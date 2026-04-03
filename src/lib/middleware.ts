import { NextRequest, NextResponse, NextMiddleware } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { getTokenFromRequest, verifyToken, type AccessTokenPayload } from '@/lib/auth';
import { getTenantFromRequest, type TenantContext } from '@/lib/tenant';
import { hasPermission } from '@/lib/permissions';
import type { User } from '@prisma/client';

const DEMO_TENANT_ID = 'demo-tenant-001';
const DEMO_USER_ID = 'demo-user-001';

const DEMO_USER: User = {
  id: DEMO_USER_ID,
  tenantId: DEMO_TENANT_ID,
  email: 'demo@procampanha.com',
  passwordHash: '',
  name: 'Carlos Mendes',
  phone: null,
  avatar: null,
  isActive: true,
  isSuperAdmin: false,
  emailVerifiedAt: null,
  lastLoginAt: null,
  mfaEnabled: false,
  mfaSecret: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const DEMO_TENANT: TenantContext = {
  id: DEMO_TENANT_ID,
  name: 'Campanha Prefeito 2026',
  slug: 'campanha-prefeito-2026',
  status: 'ACTIVE',
};

interface AuthOptions {
  module?: string;
  action?: string;
  permissions?: string[];
  requireAll?: boolean; // true = AND, false = OR
}

type LegacyWithAuthHandler = (req: NextRequest, auth: AccessTokenPayload) => Promise<NextResponse>;
type TenantWithAuthHandler = (req: NextRequest, tenantId: string, user: User, ...args: unknown[]) => Promise<NextResponse>;

export function withAuth(handler: LegacyWithAuthHandler, options?: AuthOptions): (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>;
export function withAuth(handler: TenantWithAuthHandler, options?: AuthOptions): (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>;
export function withAuth(
  handler: LegacyWithAuthHandler | TenantWithAuthHandler,
  options: AuthOptions = {}
) {
  return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    try {
      // 1. Extrair e validar token
      const token = getTokenFromRequest(req);
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Token não fornecido' },
          { status: 401 }
        );
      }

      const payload = verifyToken(token);
      if (payload.type !== 'access') {
        return NextResponse.json(
          { success: false, error: 'Token inválido' },
          { status: 401 }
        );
      }

      // 2. Validar tenant
      const isDemo = payload.tenantId === DEMO_TENANT_ID && payload.userId === DEMO_USER_ID;
      const tenant = isDemo ? DEMO_TENANT : await getTenantFromRequest(req);
      if (payload.tenantId !== tenant.id) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado: tenant inválido' },
          { status: 403 }
        );
      }

      // 3. Buscar e validar usuário
      const user = isDemo ? DEMO_USER : await prisma.user.findFirst({
        where: {
          id: payload.userId,
          tenantId: tenant.id,
          deletedAt: null,
          isActive: true
        }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado ou inativo' },
          { status: 401 }
        );
      }

      // 4. Verificar permissões
      if (options.module && options.action) {
        const requiredPermission = `${options.module}:${options.action}`;
        if (!hasPermission(payload.permissions, requiredPermission)) {
          return NextResponse.json(
            { success: false, error: 'Permissão insuficiente' },
            { status: 403 }
          );
        }
      }

      if (options.permissions && options.permissions.length > 0) {
        const requireAll = options.requireAll ?? false;
        let hasRequiredPermissions = false;

        if (requireAll) {
          // AND: precisa ter todas as permissões
          hasRequiredPermissions = options.permissions.every(perm =>
            hasPermission(payload.permissions, perm)
          );
        } else {
          // OR: precisa ter pelo menos uma permissão
          hasRequiredPermissions = options.permissions.some(perm =>
            hasPermission(payload.permissions, perm)
          );
        }

        if (!hasRequiredPermissions) {
          return NextResponse.json(
            { success: false, error: 'Permissões insuficientes' },
            { status: 403 }
          );
        }
      }

      // 5. Executar handler
      if (handler.length === 2) {
        // Legacy handler using auth payload
        return await (handler as LegacyWithAuthHandler)(req, payload as AccessTokenPayload);
      }

      return await (handler as TenantWithAuthHandler)(req, tenant.id, user, ...args);

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          { success: false, error: 'Token inválido' },
          { status: 401 }
        );
      }
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { success: false, error: 'Token expirado' },
          { status: 401 }
        );
      }
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Erro de autenticação' },
        { status: 500 }
      );
    }
  };
}

// Middleware para rotas Next.js (não API routes)
export function createAuthMiddleware(options: AuthOptions = {}): NextMiddleware {
  return async (req: NextRequest) => {
    try {
      // 1. Extrair e validar token
      const token = getTokenFromRequest(req);
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      const payload = verifyToken(token);
      if (payload.type !== 'access') {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // 2. Validar tenant
      const tenant = await getTenantFromRequest(req);
      if (payload.tenantId !== tenant.id) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // 3. Buscar e validar usuário
      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          tenantId: tenant.id,
          deletedAt: null,
          isActive: true
        }
      });

      if (!user) {
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // 4. Verificar permissões
      if (options.module && options.action) {
        const requiredPermission = `${options.module}:${options.action}`;
        if (!hasPermission(payload.permissions, requiredPermission)) {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }
      }

      if (options.permissions && options.permissions.length > 0) {
        const requireAll = options.requireAll ?? false;
        let hasRequiredPermissions = false;

        if (requireAll) {
          hasRequiredPermissions = options.permissions.every(perm =>
            hasPermission(payload.permissions, perm)
          );
        } else {
          hasRequiredPermissions = options.permissions.some(perm =>
            hasPermission(payload.permissions, perm)
          );
        }

        if (!hasRequiredPermissions) {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }
      }

      // Continuar para a rota
      return NextResponse.next();

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.redirect(new URL('/login', req.url));
    }
  };
}
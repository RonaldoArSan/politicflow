# PoliticFlow - Exemplos Práticos

Este documento contém exemplos práticos de implementação seguindo as regras estabelecidas.

## 1. Login com JWT + Refresh Token

### Route Handler - Login

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest } from 'next/server';
import { apiResponse, apiError, auditLog } from '@/lib/api-helpers';
import { generateTokens, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export async function POST(req: NextRequest) {
  try {
    const { email, password } = loginSchema.parse(await req.json());

    // Buscar usuário com tenant
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: {
          select: { id: true, name: true, status: true }
        }
      }
    });

    if (!user || !user.tenant) {
      return apiError('Credenciais inválidas', 401);
    }

    // Verificar se tenant está ativo
    if (user.tenant.status !== 'ACTIVE') {
      return apiError('Conta suspensa. Entre em contato com o suporte.', 401);
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      // Auditar tentativa falhada
      await auditLog(user.tenant.id, user.id, 'auth', 'LOGIN_FAILED', user.id, null, null, req);
      return apiError('Credenciais inválidas', 401);
    }

    // Verificar se usuário está ativo
    if (user.status !== 'ACTIVE') {
      return apiError('Conta desativada', 401);
    }

    // Gerar tokens
    const tokens = await generateTokens(user, user.tenant);

    // Atualizar lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Auditar login bem-sucedido
    await auditLog(user.tenant.id, user.id, 'auth', 'LOGIN', user.id, null, null, req);

    return apiResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }, 'Login realizado com sucesso');

  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    console.error('Login error:', error);
    return apiError('Erro interno do servidor', 500);
  }
}
```

### Refresh Token Handler

```typescript
// src/app/api/auth/refresh/route.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { apiResponse, apiError } from '@/lib/api-helpers';
import { generateTokens } from '@/lib/auth';

interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  tokenId: string;
  type: 'refresh';
}

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return apiError('Refresh token não fornecido', 400);
    }

    // Verificar refresh token
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET!
    ) as RefreshTokenPayload;

    if (payload.type !== 'refresh') {
      return apiError('Token inválido', 401);
    }

    // Verificar se token existe no banco e não foi revogado
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: {
        user: {
          include: { tenant: true }
        }
      }
    });

    if (!storedToken ||
        storedToken.revokedAt ||
        storedToken.expiresAt < new Date() ||
        storedToken.user.status !== 'ACTIVE' ||
        storedToken.user.tenant.status !== 'ACTIVE') {
      return apiError('Token expirado ou inválido', 401);
    }

    // Verificar hash do token (segurança extra)
    const crypto = await import('crypto');
    const expectedHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    if (storedToken.token !== expectedHash) {
      return apiError('Token inválido', 401);
    }

    // Gerar novos tokens
    const tokens = await generateTokens(storedToken.user, storedToken.user.tenant);

    // Revogar token antigo
    await prisma.refreshToken.update({
      where: { id: payload.tokenId },
      data: { revokedAt: new Date() }
    });

    return apiResponse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }, 'Tokens renovados com sucesso');

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return apiError('Token inválido', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      return apiError('Token expirado', 401);
    }
    console.error('Refresh token error:', error);
    return apiError('Erro interno do servidor', 500);
  }
}
```

### Logout Handler

```typescript
// src/app/api/auth/logout/route.ts
import { NextRequest } from 'next/server';
import { apiResponse, apiError, auditLog } from '@/lib/api-helpers';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return apiError('Token não fornecido', 401);
    }

    const payload = verifyToken(token);

    // Revogar todos os refresh tokens do usuário
    await prisma.refreshToken.updateMany({
      where: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });

    // Auditar logout
    await auditLog(payload.tenantId, payload.userId, 'auth', 'LOGOUT', payload.userId, null, null, req);

    return apiResponse({ message: 'Logout realizado com sucesso' });

  } catch (error) {
    console.error('Logout error:', error);
    return apiError('Erro no logout', 500);
  }
}
```

## 2. Middleware/Helper de Tenant Context

### withAuth HOF

```typescript
// lib/api-helpers.ts
import { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getTenantFromRequest } from '@/lib/tenant';
import { hasPermission } from '@/lib/permissions';

interface AuthOptions {
  module?: string;
  action?: string;
  permissions?: string[];
}

export function withAuth<T extends any[]>(
  handler: (req: NextRequest, tenantId: string, user: any, ...args: T) => Promise<Response>,
  options: AuthOptions = {}
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    try {
      // 1. Extrair e validar token
      const token = getTokenFromRequest(req);
      if (!token) {
        return apiError('Token não fornecido', 401);
      }

      const payload = verifyToken(token);
      if (payload.type !== 'access') {
        return apiError('Token inválido', 401);
      }

      // 2. Validar tenant
      const tenant = await getTenantFromRequest(req);
      if (payload.tenantId !== tenant.id) {
        return apiError('Acesso negado: tenant inválido', 403);
      }

      // 3. Buscar e validar usuário
      const user = await prisma.user.findFirst({
        where: {
          id: payload.userId,
          tenantId: tenant.id,
          deletedAt: null,
          status: 'ACTIVE'
        }
      });

      if (!user) {
        return apiError('Usuário não encontrado ou inativo', 401);
      }

      // 4. Verificar permissões
      if (options.module && options.action) {
        const requiredPermission = `${options.module}:${options.action}`;
        if (!hasPermission(payload.permissions, requiredPermission)) {
          return apiError('Permissão insuficiente', 403);
        }
      }

      if (options.permissions && options.permissions.length > 0) {
        const hasRequiredPermissions = options.permissions.every(perm =>
          hasPermission(payload.permissions, perm)
        );
        if (!hasRequiredPermissions) {
          return apiError('Permissões insuficientes', 403);
        }
      }

      // 5. Executar handler
      return await handler(req, tenant.id, user, ...args);

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return apiError('Token inválido', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        return apiError('Token expirado', 401);
      }
      console.error('Auth middleware error:', error);
      return apiError('Erro de autenticação', 500);
    }
  };
}
```

### Tenant Helpers

```typescript
// lib/tenant.ts
import { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function getTenantFromRequest(req: NextRequest): Promise<any> {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Error('Token not found');
  }

  const payload = verifyToken(token);

  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (tenant.status !== 'ACTIVE') {
    throw new Error('Tenant not active');
  }

  return tenant;
}

export function tenantWhere(tenantId: string) {
  return { tenantId, deletedAt: null };
}

export async function validateUserInTenant(userId: string, tenantId: string): Promise<any> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
      deletedAt: null,
      status: 'ACTIVE'
    }
  });

  if (!user) {
    throw new Error('User not found in tenant');
  }

  return user;
}
```

### Auth Utilities

```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export interface AccessTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  permissions: string[];
  type: 'access';
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  tokenId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function verifyToken(token: string): AccessTokenPayload | RefreshTokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload | RefreshTokenPayload;
  } catch (error) {
    throw error;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateTokens(user: any, tenant: any) {
  // Buscar permissões do usuário
  const permissions = await getPermissionsForUser(user.id, tenant.id);

  // Access token (15 minutos)
  const accessToken = jwt.sign(
    {
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.role,
      permissions,
      type: 'access'
    },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  // Refresh token (7 dias)
  const tokenId = randomBytes(32).toString('hex');
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tenantId: tenant.id,
      tokenId,
      type: 'refresh'
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Hash do refresh token para armazenamento seguro
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // Salvar refresh token
  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      tenantId: tenant.id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return { accessToken, refreshToken };
}

export async function getPermissionsForUser(userId: string, tenantId: string): Promise<string[]> {
  // Buscar papéis do usuário
  const userRoles = await prisma.userRole.findMany({
    where: { userId, tenantId },
    include: { role: true }
  });

  // Coletar todas as permissões
  const allPermissions = new Set<string>();

  for (const userRole of userRoles) {
    const rolePermissions = ROLE_PERMISSIONS[userRole.role.slug] || [];
    rolePermissions.forEach(perm => allPermissions.add(perm));
  }

  return Array.from(allPermissions);
}
```

## 3. Guard de Permissão RBAC

### Permission System

```typescript
// lib/permissions.ts
export const MODULES = {
  USERS: 'users',
  ROLES: 'roles',
  COMMITTEES: 'committees',
  TEAMS: 'teams',
  AGENDA: 'agenda',
  TASKS: 'tasks',
  DEMANDS: 'demands',
  ACTIONS: 'actions',
  LEADERS: 'leaders',
  ADVISORS: 'advisors',
  CRM: 'crm',
  REPORTS: 'reports',
  AUDIT: 'audit',
  SETTINGS: 'settings'
} as const;

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  MANAGE: 'manage'
} as const;

export const PERMISSIONS = {
  // Usuários
  USERS_CREATE: `${MODULES.USERS}:${ACTIONS.CREATE}`,
  USERS_READ: `${MODULES.USERS}:${ACTIONS.READ}`,
  USERS_UPDATE: `${MODULES.USERS}:${ACTIONS.UPDATE}`,
  USERS_DELETE: `${MODULES.USERS}:${ACTIONS.DELETE}`,

  // Comitês
  COMMITTEES_CREATE: `${MODULES.COMMITTEES}:${ACTIONS.CREATE}`,
  COMMITTEES_READ: `${MODULES.COMMITTEES}:${ACTIONS.READ}`,
  COMMITTEES_UPDATE: `${MODULES.COMMITTEES}:${ACTIONS.UPDATE}`,
  COMMITTEES_DELETE: `${MODULES.COMMITTEES}:${ACTIONS.DELETE}`,

  // Agenda
  AGENDA_CREATE: `${MODULES.AGENDA}:${ACTIONS.CREATE}`,
  AGENDA_READ: `${MODULES.AGENDA}:${ACTIONS.READ}`,
  AGENDA_UPDATE: `${MODULES.AGENDA}:${ACTIONS.UPDATE}`,

  // E assim por diante...
} as const;

export const ROLES = {
  TENANT_ADMIN: 'tenant_admin',
  COORDENADOR_GERAL: 'coordenador_geral',
  CHEFE_GABINETE: 'chefe_gabinete',
  COORDENADOR_COMITE: 'coordenador_comite',
  OPERADOR_AGENDA: 'operador_agenda',
  ASSESSOR: 'assessor',
  LEITURA: 'leitura'
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.TENANT_ADMIN]: [
    '*:*'  // Acesso total
  ],

  [ROLES.COORDENADOR_GERAL]: [
    'agenda:*',
    'actions:*',
    'committees:*',
    'teams:*',
    'leaders:*',
    'demands:*',
    'tasks:*',
    'reports:*',
    'crm:*'
  ],

  [ROLES.CHEFE_GABINETE]: [
    'agenda:*',
    'advisors:*',
    'gabinete:*',
    'demands:*',
    'tasks:*'
  ],

  [ROLES.COORDENADOR_COMITE]: [
    'committees:*',
    'actions:*',
    'teams:*',
    'leaders:*',
    'tasks:*'
  ],

  [ROLES.OPERADOR_AGENDA]: [
    'agenda:read',
    'agenda:create',
    'agenda:update'
  ],

  [ROLES.ASSESSOR]: [
    'agenda:read',
    'tasks:*',
    'demands:*',
    'leaders:read',
    'crm:read'
  ],

  [ROLES.LEITURA]: [
    'committees:read',
    'teams:read',
    'agenda:read',
    'tasks:read',
    'demands:read',
    'leaders:read',
    'advisors:read',
    'reports:read'
  ]
};

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // Super admin bypass
  if (userPermissions.includes('*:*')) {
    return true;
  }

  // Verificar permissão exata
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Verificar wildcards
  const [requiredModule, requiredAction] = requiredPermission.split(':');

  // module:* permite qualquer ação no módulo
  if (userPermissions.includes(`${requiredModule}:*`)) {
    return true;
  }

  return false;
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  // Hierarquia de papéis (simplificada)
  const roleHierarchy = {
    [ROLES.TENANT_ADMIN]: 100,
    [ROLES.COORDENADOR_GERAL]: 80,
    [ROLES.CHEFE_GABINETE]: 70,
    [ROLES.COORDENADOR_COMITE]: 60,
    [ROLES.OPERADOR_AGENDA]: 40,
    [ROLES.ASSESSOR]: 30,
    [ROLES.LEITURA]: 10
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}
```

### Client-side Permission Guards

```tsx
// components/auth/PermissionGuard.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';
import { hasPermission } from '@/lib/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // true = AND, false = OR
}

export function PermissionGuard({
  children,
  permission,
  permissions = [],
  fallback = null,
  requireAll = false
}: PermissionGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  const userPermissions = user.permissions || [];

  // Verificar permissão única
  if (permission && !hasPermission(userPermissions, permission)) {
    return fallback;
  }

  // Verificar múltiplas permissões
  if (permissions.length > 0) {
    if (requireAll) {
      // AND: precisa ter todas as permissões
      const hasAllPermissions = permissions.every(perm =>
        hasPermission(userPermissions, perm)
      );
      if (!hasAllPermissions) {
        return fallback;
      }
    } else {
      // OR: precisa ter pelo menos uma permissão
      const hasAnyPermission = permissions.some(perm =>
        hasPermission(userPermissions, perm)
      );
      if (!hasAnyPermission) {
        return fallback;
      }
    }
  }

  return <>{children}</>;
}

// Hook para verificações condicionais
export function usePermissions() {
  const { user } = useAuth();

  const checkPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    return hasPermission(user.permissions, permission);
  };

  const checkPermissions = (permissions: string[], requireAll = false): boolean => {
    if (!user?.permissions) return false;

    if (requireAll) {
      return permissions.every(perm => hasPermission(user.permissions, perm));
    } else {
      return permissions.some(perm => hasPermission(user.permissions, perm));
    }
  };

  const checkRole = (role: string): boolean => {
    return user?.role === role;
  };

  return {
    checkPermission,
    checkPermissions,
    checkRole,
    permissions: user?.permissions || [],
    role: user?.role
  };
}
```

## 4. CRUD Multi-tenant de Comitês

### Service de Comitês

```typescript
// lib/services/committee-service.ts
import { z } from 'zod';
import { PlanLimits } from '@/lib/billing/limits';
import { auditLog } from '@/lib/audit';

export const createCommitteeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens').optional(),
  parentId: z.string().uuid('ID do comitê pai inválido').optional(),
  description: z.string().max(500).optional()
});

export const updateCommitteeSchema = createCommitteeSchema.partial().extend({
  id: z.string().uuid('ID inválido')
});

export const committeeFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export class CommitteeService {
  static async create(data: z.infer<typeof createCommitteeSchema>, tenantId: string, userId: string) {
    // 1. Validar limites do plano
    const canCreate = await PlanLimits.canCreateCommittee(tenantId);
    if (!canCreate) {
      throw new Error('Limite de comitês do plano atingido. Faça upgrade do plano para criar mais comitês.');
    }

    // 2. Preparar dados
    const committeeData = {
      ...data,
      tenantId,
      slug: data.slug || this.generateSlug(data.name)
    };

    // 3. Validar regras de negócio
    await this.validateBusinessRules(committeeData, tenantId);

    // 4. Criar registro
    const committee = await prisma.committee.create({
      data: committeeData,
      include: {
        parent: { select: { id: true, name: true } }
      }
    });

    // 5. Auditar
    await auditLog(tenantId, userId, 'committee', 'CREATE', committee.id, null, committee);

    return committee;
  }

  static async list(tenantId: string, filters: z.infer<typeof committeeFiltersSchema>) {
    const { page, limit, search, status } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [committees, total] = await Promise.all([
      prisma.committee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { children: true } }
        }
      }),
      prisma.committee.count({ where })
    ]);

    return {
      data: committees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getById(id: string, tenantId: string) {
    const committee = await prisma.committee.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          where: { deletedAt: null },
          select: { id: true, name: true, status: true }
        },
        _count: { select: { children: true } }
      }
    });

    if (!committee) {
      throw new Error('Comitê não encontrado');
    }

    return committee;
  }

  static async update(id: string, data: z.infer<typeof updateCommitteeSchema>, tenantId: string, userId: string) {
    // Buscar dados antigos para auditoria
    const oldCommittee = await prisma.committee.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldCommittee) {
      throw new Error('Comitê não encontrado');
    }

    // Preparar dados de atualização
    const updateData = {
      ...data,
      ...(data.name && { slug: data.slug || this.generateSlug(data.name) })
    };

    // Validar regras de negócio se necessário
    if (updateData.parentId) {
      await this.validateParentHierarchy(id, updateData.parentId, tenantId);
    }

    // Atualizar
    const updatedCommittee = await prisma.committee.update({
      where: { id, tenantId },
      data: updateData,
      include: {
        parent: { select: { id: true, name: true } }
      }
    });

    // Auditar
    await auditLog(tenantId, userId, 'committee', 'UPDATE', id, oldCommittee, updatedCommittee);

    return updatedCommittee;
  }

  static async delete(id: string, tenantId: string, userId: string) {
    // Verificar se tem filhos ativos
    const childrenCount = await prisma.committee.count({
      where: {
        parentId: id,
        tenantId,
        deletedAt: null
      }
    });

    if (childrenCount > 0) {
      throw new Error('Não é possível excluir um comitê que possui subcomitês ativos');
    }

    // Buscar dados antigos
    const oldCommittee = await prisma.committee.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldCommittee) {
      throw new Error('Comitê não encontrado');
    }

    // Soft delete
    await prisma.committee.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });

    // Auditar
    await auditLog(tenantId, userId, 'committee', 'DELETE', id, oldCommittee, null);
  }

  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private static async validateBusinessRules(data: any, tenantId: string) {
    // Validar unicidade do slug
    if (data.slug) {
      const existing = await prisma.committee.findFirst({
        where: {
          slug: data.slug,
          tenantId,
          deletedAt: null
        }
      });

      if (existing) {
        throw new Error('Já existe um comitê com este slug');
      }
    }

    // Validar hierarquia se parentId fornecido
    if (data.parentId) {
      await this.validateParentHierarchy(null, data.parentId, tenantId);
    }
  }

  private static async validateParentHierarchy(childId: string | null, parentId: string, tenantId: string) {
    // Verificar se parent existe e pertence ao tenant
    const parent = await prisma.committee.findFirst({
      where: {
        id: parentId,
        tenantId,
        deletedAt: null
      }
    });

    if (!parent) {
      throw new Error('Comitê pai não encontrado');
    }

    // Evitar ciclos na hierarquia
    if (childId && await this.wouldCreateCycle(childId, parentId, tenantId)) {
      throw new Error('Hierarquia circular não permitida');
    }
  }

  private static async wouldCreateCycle(childId: string, parentId: string, tenantId: string): Promise<boolean> {
    // Verificar se o parent é descendente do child
    const descendants = await this.getAllDescendants(childId, tenantId);
    return descendants.includes(parentId);
  }

  private static async getAllDescendants(committeeId: string, tenantId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [committeeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await prisma.committee.findMany({
        where: {
          parentId: currentId,
          tenantId,
          deletedAt: null
        },
        select: { id: true }
      });

      for (const child of children) {
        descendants.push(child.id);
        queue.push(child.id);
      }
    }

    return descendants;
  }
}
```

### Route Handlers para Comitês

```typescript
// src/app/api/committees/route.ts
import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import { CommitteeService, committeeFiltersSchema } from '@/lib/services/committee-service';
import { z } from 'zod';

const createCommitteeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional()
});

async function handleGET(req: NextRequest, tenantId: string, user: any) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = committeeFiltersSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status')
    });

    const result = await CommitteeService.list(tenantId, filters);
    return apiResponse(result.data, 'Comitês encontrados', 200, result.pagination);
  } catch (error) {
    return apiError('Erro ao buscar comitês', 500);
  }
}

async function handlePOST(req: NextRequest, tenantId: string, user: any) {
  try {
    const body = await req.json();
    const validatedData = createCommitteeSchema.parse(body);

    const committee = await CommitteeService.create(validatedData, tenantId, user.id);
    return apiResponse(committee, 'Comitê criado com sucesso', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    return apiError(error.message || 'Erro ao criar comitê', 500);
  }
}

export const GET = withAuth(handleGET, { module: 'committees', action: 'read' });
export const POST = withAuth(handlePOST, { module: 'committees', action: 'create' });
```

```typescript
// src/app/api/committees/[id]/route.ts
import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import { CommitteeService } from '@/lib/services/committee-service';
import { z } from 'zod';

const updateCommitteeSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional()
});

async function handleGET(req: NextRequest, tenantId: string, user: any, { params }: { params: { id: string } }) {
  try {
    const committee = await CommitteeService.getById(params.id, tenantId);
    return apiResponse(committee);
  } catch (error) {
    return apiError(error.message || 'Erro ao buscar comitê', 500);
  }
}

async function handlePUT(req: NextRequest, tenantId: string, user: any, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validatedData = updateCommitteeSchema.parse(body);

    const committee = await CommitteeService.update(params.id, validatedData, tenantId, user.id);
    return apiResponse(committee, 'Comitê atualizado com sucesso');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos: ' + error.errors.map(e => e.message).join(', '), 400);
    }
    return apiError(error.message || 'Erro ao atualizar comitê', 500);
  }
}

async function handleDELETE(req: NextRequest, tenantId: string, user: any, { params }: { params: { id: string } }) {
  try {
    await CommitteeService.delete(params.id, tenantId, user.id);
    return apiResponse({ message: 'Comitê excluído com sucesso' });
  } catch (error) {
    return apiError(error.message || 'Erro ao excluir comitê', 500);
  }
}

export const GET = withAuth(handleGET, { module: 'committees', action: 'read' });
export const PUT = withAuth(handlePUT, { module: 'committees', action: 'update' });
export const DELETE = withAuth(handleDELETE, { module: 'committees', action: 'delete' });
```

## 5. CRUD Multi-tenant de Agenda

### Service de Agenda

```typescript
// lib/services/schedule-service.ts
import { z } from 'zod';
import { auditLog } from '@/lib/audit';

export const createScheduleSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().optional(),
  startDate: z.string().datetime('Data de início inválida'),
  endDate: z.string().datetime('Data de fim inválida').optional(),
  location: z.string().max(200).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  committeeId: z.string().uuid().optional()
}).refine((data) => {
  if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
    return false;
  }
  return true;
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['endDate']
});

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  id: z.string().uuid('ID inválido')
});

export const scheduleFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  committeeId: z.string().uuid().optional()
});

export class ScheduleService {
  static async create(data: z.infer<typeof createScheduleSchema>, tenantId: string, userId: string) {
    // Validar se committee pertence ao tenant (se fornecido)
    if (data.committeeId) {
      await this.validateCommitteeAccess(data.committeeId, tenantId);
    }

    // Preparar dados
    const scheduleData = {
      ...data,
      tenantId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null
    };

    // Criar registro
    const schedule = await prisma.schedule.create({
      data: scheduleData,
      include: {
        committee: { select: { id: true, name: true } }
      }
    });

    // Auditar
    await auditLog(tenantId, userId, 'schedule', 'CREATE', schedule.id, null, schedule);

    return schedule;
  }

  static async list(tenantId: string, filters: z.infer<typeof scheduleFiltersSchema>) {
    const { page, limit, search, status, startDate, endDate, committeeId } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...(committeeId && { committeeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(startDate && endDate && {
        OR: [
          {
            startDate: { gte: new Date(startDate), lte: new Date(endDate) }
          },
          {
            endDate: { gte: new Date(startDate), lte: new Date(endDate) }
          }
        ]
      })
    };

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          committee: { select: { id: true, name: true } }
        }
      }),
      prisma.schedule.count({ where })
    ]);

    return {
      data: schedules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getById(id: string, tenantId: string) {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      },
      include: {
        committee: { select: { id: true, name: true } }
      }
    });

    if (!schedule) {
      throw new Error('Agenda não encontrada');
    }

    return schedule;
  }

  static async update(id: string, data: z.infer<typeof updateScheduleSchema>, tenantId: string, userId: string) {
    // Buscar dados antigos
    const oldSchedule = await prisma.schedule.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldSchedule) {
      throw new Error('Agenda não encontrada');
    }

    // Validar committee se fornecido
    if (data.committeeId) {
      await this.validateCommitteeAccess(data.committeeId, tenantId);
    }

    // Preparar dados de atualização
    const updateData = {
      ...data,
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) })
    };

    // Atualizar
    const updatedSchedule = await prisma.schedule.update({
      where: { id, tenantId },
      data: updateData,
      include: {
        committee: { select: { id: true, name: true } }
      }
    });

    // Auditar
    await auditLog(tenantId, userId, 'schedule', 'UPDATE', id, oldSchedule, updatedSchedule);

    return updatedSchedule;
  }

  static async delete(id: string, tenantId: string, userId: string) {
    // Buscar dados antigos
    const oldSchedule = await prisma.schedule.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldSchedule) {
      throw new Error('Agenda não encontrada');
    }

    // Soft delete
    await prisma.schedule.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });

    // Auditar
    await auditLog(tenantId, userId, 'schedule', 'DELETE', id, oldSchedule, null);
  }

  private static async validateCommitteeAccess(committeeId: string, tenantId: string) {
    const committee = await prisma.committee.findFirst({
      where: {
        id: committeeId,
        tenantId,
        deletedAt: null
      }
    });

    if (!committee) {
      throw new Error('Comitê não encontrado ou não pertence ao tenant');
    }
  }
}
```

## 6. Exemplo de Auditoria Automática

### Audit Service

```typescript
// lib/audit.ts
import { NextRequest } from 'next/server';

export interface AuditData {
  tenantId: string;
  userId: string | null;
  entity: string;
  action: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}

export async function auditLog(
  tenantId: string,
  userId: string | null,
  entity: string,
  action: string,
  entityId: string,
  oldData?: any,
  newData?: any,
  req?: NextRequest
): Promise<void> {
  try {
    const ip = req ? getClientIP(req) : null;
    const userAgent = req ? req.headers.get('user-agent') : null;

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        entity,
        action,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        ip,
        userAgent,
        timestamp: new Date()
      }
    });
  } catch (error) {
    // Log do erro de auditoria (não deve quebrar o fluxo principal)
    console.error('Audit log error:', error);
  }
}

function getClientIP(req: NextRequest): string | null {
  // Tentar vários headers para obter IP real
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const clientIP = req.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  return null;
}

// Helpers para auditoria automática
export const AUDIT_EVENTS = {
  // Auth
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // CRUD
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE',

  // Business
  STATUS_CHANGE: 'STATUS_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  PLAN_CHANGE: 'PLAN_CHANGE',
  EXPORT: 'EXPORT',

  // Security
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED'
} as const;

export function createAuditMiddleware(entity: string) {
  return async (
    operation: () => Promise<any>,
    action: string,
    tenantId: string,
    userId: string | null,
    entityId: string,
    req?: NextRequest
  ) => {
    let oldData = null;
    let newData = null;

    // Para updates, buscar dados antigos
    if (action === AUDIT_EVENTS.UPDATE) {
      try {
        const model = getPrismaModel(entity);
        oldData = await (prisma as any)[model].findUnique({
          where: { id: entityId, tenantId }
        });
      } catch (error) {
        console.error('Error fetching old data for audit:', error);
      }
    }

    // Executar operação
    const result = await operation();

    // Para creates e updates, capturar newData
    if (action === AUDIT_EVENTS.CREATE || action === AUDIT_EVENTS.UPDATE) {
      newData = result;
    }

    // Auditar
    await auditLog(tenantId, userId, entity, action, entityId, oldData, newData, req);

    return result;
  };
}

function getPrismaModel(entity: string): string {
  const modelMap: Record<string, string> = {
    committee: 'committee',
    schedule: 'schedule',
    task: 'task',
    demand: 'demand',
    user: 'user',
    role: 'role'
  };

  return modelMap[entity] || entity;
}
```

### Uso Automático em Services

```typescript
// Exemplo em committee-service.ts
export class CommitteeService {
  private static audit = createAuditMiddleware('committee');

  static async create(data: any, tenantId: string, userId: string, req?: NextRequest) {
    return this.audit(
      async () => {
        // Lógica de criação
        const committee = await prisma.committee.create({
          data: { ...data, tenantId }
        });
        return committee;
      },
      AUDIT_EVENTS.CREATE,
      tenantId,
      userId,
      'new-id', // será preenchido após criação
      req
    );
  }

  static async update(id: string, data: any, tenantId: string, userId: string, req?: NextRequest) {
    return this.audit(
      async () => {
        const committee = await prisma.committee.update({
          where: { id, tenantId },
          data
        });
        return committee;
      },
      AUDIT_EVENTS.UPDATE,
      tenantId,
      userId,
      id,
      req
    );
  }
}
```

## 7. Exemplo de Enforcement de Limites por Plano

### Billing Limits Service

```typescript
// lib/billing/limits.ts
import { PlanLimitsError } from '@/lib/errors';

export class PlanLimits {
  static async getTenantPlan(tenantId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: {
          include: { features: true }
        }
      }
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new PlanLimitsError('Tenant sem plano ativo');
    }

    return subscription.plan;
  }

  static async canCreateUser(tenantId: string): Promise<boolean> {
    const plan = await this.getTenantPlan(tenantId);
    if (plan.maxUsers === -1) return true; // Ilimitado

    const currentUsers = await prisma.user.count({
      where: {
        tenantId,
        deletedAt: null,
        status: 'ACTIVE'
      }
    });

    return currentUsers < plan.maxUsers;
  }

  static async canCreateCommittee(tenantId: string): Promise<boolean> {
    const plan = await this.getTenantPlan(tenantId);
    if (plan.maxCommittees === -1) return true;

    const currentCommittees = await prisma.committee.count({
      where: {
        tenantId,
        deletedAt: null,
        status: 'ACTIVE'
      }
    });

    return currentCommittees < plan.maxCommittees;
  }

  static async canUseFeature(tenantId: string, feature: string): Promise<boolean> {
    const plan = await this.getTenantPlan(tenantId);

    // Enterprise tem tudo
    if (plan.slug === 'enterprise') return true;

    // Verificar se feature está habilitada
    return plan.features.some(f => f.feature === feature && f.enabled);
  }

  static async checkMonthlyActionsLimit(tenantId: string) {
    const plan = await this.getTenantPlan(tenantId);
    if (plan.maxActionsMonth === -1) {
      return { allowed: true, used: 0, limit: -1 };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const actionsThisMonth = await prisma.auditLog.count({
      where: {
        tenantId,
        entity: 'political_action',
        action: 'CREATE',
        timestamp: { gte: startOfMonth }
      }
    });

    return {
      allowed: actionsThisMonth < plan.maxActionsMonth,
      used: actionsThisMonth,
      limit: plan.maxActionsMonth
    };
  }

  static async enforceLimit(
    tenantId: string,
    limitType: 'users' | 'committees' | 'actions',
    operation: string
  ): Promise<void> {
    let allowed = false;

    switch (limitType) {
      case 'users':
        allowed = await this.canCreateUser(tenantId);
        break;
      case 'committees':
        allowed = await this.canCreateCommittee(tenantId);
        break;
      case 'actions':
        const actionLimit = await this.checkMonthlyActionsLimit(tenantId);
        allowed = actionLimit.allowed;
        break;
    }

    if (!allowed) {
      const plan = await this.getTenantPlan(tenantId);
      throw new PlanLimitsError(
        `Limite de ${limitType} do plano '${plan.name}' atingido. ${operation}`,
        limitType,
        plan
      );
    }
  }
}
```

### Custom Error Class

```typescript
// lib/errors.ts
export class PlanLimitsError extends Error {
  constructor(
    message: string,
    public limitType?: string,
    public plan?: any
  ) {
    super(message);
    this.name = 'PlanLimitsError';
  }
}
```

### Uso em Route Handlers

```typescript
// src/app/api/committees/route.ts
import { PlanLimits } from '@/lib/billing/limits';

export const POST = withAuth(async (req, tenantId, user) => {
  try {
    // Verificar limite ANTES de processar
    await PlanLimits.enforceLimit(tenantId, 'committees', 'Faça upgrade do plano para criar mais comitês.');

    // Prosseguir com criação...
    const committee = await CommitteeService.create(validatedData, tenantId, user.id);

    return apiResponse(committee, 'Comitê criado com sucesso', 201);
  } catch (error) {
    if (error instanceof PlanLimitsError) {
      return apiError(error.message, 403);
    }
    // Outros erros...
  }
}, { module: 'committees', action: 'create' });
```

### Frontend Usage Display

```tsx
// components/billing/usage-widget.tsx
'use client';

import { useApi } from '@/hooks/use-api';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function UsageWidget() {
  const { data: usage, error } = useApi('/api/billing/usage');

  if (error) return null;
  if (!usage) return <div>Carregando...</div>;

  const { usage: currentUsage, plan, percentages } = usage;

  return (
    <div className="space-y-4">
      {/* Usuários */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Usuários</span>
          <span>{currentUsage.users} / {plan.limits.maxUsers === -1 ? '∞' : plan.limits.maxUsers}</span>
        </div>
        <Progress value={percentages.users} className="h-2" />
        {percentages.users > 90 && (
          <Alert className="mt-2">
            <AlertDescription>
              Você está próximo do limite de usuários do plano.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Comitês */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Comitês</span>
          <span>{currentUsage.committees} / {plan.limits.maxCommittees === -1 ? '∞' : plan.limits.maxCommittees}</span>
        </div>
        <Progress value={percentages.committees} className="h-2" />
      </div>

      {/* Ações do mês */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Ações este mês</span>
          <span>{currentUsage.actionsThisMonth} / {plan.limits.maxActionsMonth === -1 ? '∞' : plan.limits.maxActionsMonth}</span>
        </div>
        <Progress value={percentages.actions} className="h-2" />
      </div>
    </div>
  );
}
```

---

**Última atualização**: 2 de abril de 2026
**Próximos passos**: Implementar base de auth, tenant context, RBAC, committees CRUD, schedules CRUD, audit log
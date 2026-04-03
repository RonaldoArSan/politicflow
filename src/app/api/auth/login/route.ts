import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateTokens } from '@/lib/auth';
import { apiResponse, apiError, auditLog } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError('E-mail e senha são obrigatórios', 400);
    }

    // Find user (we need to search across all tenants by email)
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isActive: true,
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        tenant: true,
      },
    });

    if (!user) {
      return apiError('Credenciais inválidas', 401);
    }

    if (user.tenant.status === 'SUSPENDED' || user.tenant.status === 'CANCELLED') {
      return apiError('Conta suspensa. Entre em contato com o suporte.', 403);
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return apiError('Credenciais inválidas', 401);
    }

    const roles = user.userRoles.map(ur => ur.role.slug);
    const { accessToken, refreshToken } = await generateTokens(user, user.tenant);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Audit log
    await auditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        roles,
        isSuperAdmin: user.isSuperAdmin,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          logo: user.tenant.logo,
        },
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Erro interno do servidor', 500);
  }
}

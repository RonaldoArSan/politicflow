import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, authenticateRequest, auditLog } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) return apiError('Não autorizado', 401);

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            status: true,
          },
        },
        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) return apiError('Usuário não encontrado', 404);

    return apiResponse({
      ...user,
      roles: user.userRoles.map(ur => ur.role),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return apiError('Erro interno do servidor', 500);
  }
}

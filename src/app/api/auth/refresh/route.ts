import { NextRequest } from 'next/server';
import { validateRefreshToken, generateAccessToken, generateRefreshToken, revokeRefreshToken } from '@/lib/auth';
import { apiResponse, apiError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return apiError('Refresh token é obrigatório', 400);
    }

    const tokenData = await validateRefreshToken(refreshToken);
    if (!tokenData) {
      return apiError('Refresh token inválido ou expirado', 401);
    }

    const { user } = tokenData;

    if (!user.isActive || user.deletedAt) {
      return apiError('Conta desativada', 403);
    }

    // Revoke old token
    await revokeRefreshToken(refreshToken);

    const roles = user.userRoles.map(ur => ur.role.slug);

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      isSuperAdmin: user.isSuperAdmin,
    });

    const newRefreshToken = await generateRefreshToken(user.id);

    return apiResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return apiError('Erro interno do servidor', 500);
  }
}

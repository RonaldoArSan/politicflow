import { NextRequest } from 'next/server';
import { revokeAllUserTokens } from '@/lib/auth';
import { apiResponse, apiError, authenticateRequest, auditLog } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return apiError('Não autorizado', 401);
    }

    await revokeAllUserTokens(auth.userId);

    await auditLog({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: auth.userId,
    });

    return apiResponse({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Logout error:', error);
    return apiError('Erro interno do servidor', 500);
  }
}

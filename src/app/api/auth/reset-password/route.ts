import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-helpers';
import { hashPassword } from '@/lib/auth';
import { createHash } from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, password } = body;

  if (!token || !password) return apiError('Token e nova senha são obrigatórios', 400);
  if (password.length < 8) return apiError('A senha deve ter pelo menos 8 caracteres', 400);

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const resetToken = await prisma.refreshToken.findFirst({
    where: {
      token: tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!resetToken) return apiError('Token inválido ou expirado', 400);

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: { revokedAt: new Date() },
    }),
  ]);

  return apiResponse({ message: 'Senha redefinida com sucesso.' });
}

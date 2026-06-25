import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-helpers';
import { randomBytes, createHash } from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email } = body;

  if (!email) return apiError('E-mail é obrigatório', 400);

  // Find user — don't reveal if email exists
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), deletedAt: null, isActive: true },
  });

  if (user) {
    // Revoke any existing reset tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Generate reset token (expires in 1h)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // In production: send email with reset link
    // For now: return the token in dev mode so we can test
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      return apiResponse({ resetToken: rawToken, message: 'Token gerado (modo dev)' });
    }
  }

  // Always return success to not reveal if email exists
  return apiResponse({ message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' });
}

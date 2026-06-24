import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import type { User } from '@prisma/client';

function getIdFromUrl(req: NextRequest) {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 1];
}

async function handlePatch(request: NextRequest, tenantId: string, user: User) {
  const id = getIdFromUrl(request);
  const body = await request.json();
  const action = body?.action;

  if (action !== 'markRead') {
    return apiError('Ação inválida', 400);
  }

  const notification = await prisma.notification.findFirst({
    where: { id, tenantId, userId: user.id },
  });

  if (!notification) {
    return apiError('Notificação não encontrada', 404);
  }

  if (notification.readAt) {
    return apiResponse({ id }, 'Notificação já está marcada como lida');
  }

  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return apiResponse({ id }, 'Notificação marcada como lida');
}

async function handleDelete(request: NextRequest, tenantId: string, user: User) {
  const id = getIdFromUrl(request);

  const notification = await prisma.notification.findFirst({
    where: { id, tenantId, userId: user.id },
  });

  if (!notification) {
    return apiError('Notificação não encontrada', 404);
  }

  await prisma.notification.delete({
    where: { id },
  });

  return apiResponse({ id }, 'Notificação removida com sucesso');
}

export const PATCH = withAuth(handlePatch, { permissions: ['notifications:read'] });
export const DELETE = withAuth(handleDelete, { permissions: ['notifications:read'] });

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import type { User } from '@prisma/client';

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function handleGet(request: NextRequest, tenantId: string, user: User) {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  const notifications = await prisma.notification.findMany({
    where: {
      tenantId,
      userId: user.id,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return apiResponse(notifications.map(notification => {
    const data = notification.data;
    const link = isJsonObject(data) && typeof data.link === 'string' ? data.link : undefined;
    const actor = isJsonObject(data) && typeof data.actor === 'string' ? data.actor : undefined;

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      channel: notification.channel,
      isRead: Boolean(notification.readAt),
      createdAt: notification.createdAt.toISOString(),
      sentAt: notification.sentAt?.toISOString() ?? null,
      readAt: notification.readAt?.toISOString() ?? null,
      data: data ?? null,
      link,
      actor,
    };
  }));
}

async function handlePatch(request: NextRequest, tenantId: string, user: User) {
  const body = await request.json();
  const action = body?.action;

  if (action !== 'markAllRead') {
    return apiError('Ação inválida', 400);
  }

  await prisma.notification.updateMany({
    where: {
      tenantId,
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return apiResponse({ success: true }, 'Notificações marcadas como lidas');
}

export const GET = withAuth(handleGet, { module: 'notifications', action: 'read' });
export const PATCH = withAuth(handlePatch, { permissions: ['notifications:read'] });

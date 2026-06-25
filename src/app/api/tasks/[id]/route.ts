import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handlePatch(request: NextRequest, auth: AccessTokenPayload, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const task = await prisma.task.findFirst({ where: { id, ...tenantWhere(auth.tenantId) } });
  if (!task) return apiError('Tarefa não encontrada', 404);

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(body.status    !== undefined && { status:      body.status    }),
      ...(body.title     !== undefined && { title:       body.title     }),
      ...(body.priority  !== undefined && { priority:    body.priority  }),
      ...(body.dueDate   !== undefined && { dueDate:     body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
      ...(body.description !== undefined && { description: body.description }),
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'UPDATE', entityType: 'task', entityId: id, oldValues: task, newValues: body });
  return apiResponse(updated);
}

async function handleDelete(request: NextRequest, auth: AccessTokenPayload, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.task.findFirst({ where: { id, ...tenantWhere(auth.tenantId) } });
  if (!task) return apiError('Tarefa não encontrada', 404);

  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'DELETE', entityType: 'task', entityId: id });
  return apiResponse({ deleted: true });
}

export const PATCH  = withAuth(handlePatch,  { module: 'tasks', action: 'update' });
export const DELETE = withAuth(handleDelete, { module: 'tasks', action: 'delete' });

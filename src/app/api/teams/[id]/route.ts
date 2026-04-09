import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, apiResponse, apiError, auditLog } from '@/lib/api-helpers';
import type { User } from '@prisma/client';

function getIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 1];
}

async function handleGet(req: NextRequest, tenantId: string, _user: User) {
  const id = getIdFromUrl(req);
  const team = await prisma.team.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      committee: { select: { id: true, name: true } },
      _count: { select: { advisors: true, actions: true } },
    },
  });
  if (!team) return apiError('Equipe não encontrada', 404);
  return apiResponse(team);
}

async function handlePut(req: NextRequest, tenantId: string, user: User) {
  const id = getIdFromUrl(req);
  const body = await req.json();
  const { name, supervisorName, status, committeeId } = body;

  if (!name?.trim()) return apiError('Nome é obrigatório', 400);

  const existing = await prisma.team.findFirst({ where: { id, tenantId, deletedAt: null } });
  if (!existing) return apiError('Equipe não encontrada', 404);

  let committeeIdValue: string | null = existing.committeeId;
  if (committeeId !== undefined) {
    if (committeeId) {
      const committeeExists = await prisma.committee.findFirst({
        where: { id: committeeId, tenantId, deletedAt: null }
      });
      if (committeeExists) {
        committeeIdValue = committeeId;
      }
    } else {
      committeeIdValue = null;
    }
  }

  const team = await prisma.team.update({
    where: { id },
    data: {
      name: name.trim(),
      supervisorName: supervisorName || null,
      status: status || existing.status,
      committeeId: committeeIdValue,
    },
  });

  await auditLog({
    tenantId,
    userId: user.id,
    action: 'UPDATE',
    entityType: 'team',
    entityId: id,
    oldValues: { name: existing.name, status: existing.status },
    newValues: { name: team.name, status: team.status },
  });

  return apiResponse(team, 'Equipe atualizada com sucesso');
}

async function handleDelete(req: NextRequest, tenantId: string, user: User) {
  const id = getIdFromUrl(req);

  const existing = await prisma.team.findFirst({ where: { id, tenantId, deletedAt: null } });
  if (!existing) return apiError('Equipe não encontrada', 404);

  await prisma.team.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await auditLog({
    tenantId,
    userId: user.id,
    action: 'DELETE',
    entityType: 'team',
    entityId: id,
    oldValues: { name: existing.name },
  });

  return apiResponse({ message: 'Equipe excluída com sucesso' });
}

export const GET    = withAuth(handleGet,    { module: 'teams', action: 'read' });
export const PUT    = withAuth(handlePut,    { module: 'teams', action: 'update' });
export const DELETE = withAuth(handleDelete, { module: 'teams', action: 'delete' });

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { JwtPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: JwtPayload) {
  const id = request.nextUrl.pathname.split('/').pop();

  const committee = await prisma.committee.findFirst({
    where: { id, ...tenantWhere(auth.tenantId) },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, type: true, status: true } },
      teams: { select: { id: true, name: true, status: true } },
      _count: { select: { actions: true } },
    },
  });

  if (!committee) return apiError('Comitê não encontrado', 404);
  return apiResponse(committee);
}

async function handlePut(request: NextRequest, auth: JwtPayload) {
  const id = request.nextUrl.pathname.split('/').pop();
  const body = await request.json();

  const existing = await prisma.committee.findFirst({
    where: { id, ...tenantWhere(auth.tenantId) },
  });

  if (!existing) return apiError('Comitê não encontrado', 404);

  const committee = await prisma.committee.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      address: body.address,
      city: body.city,
      state: body.state,
      neighborhood: body.neighborhood,
      region: body.region,
      zipCode: body.zipCode,
      phone: body.phone,
      email: body.email,
      responsibleName: body.responsibleName,
      parentId: body.parentId,
      status: body.status,
      observations: body.observations,
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'UPDATE',
    entityType: 'committee',
    entityId: id,
    oldValues: existing,
    newValues: committee,
  });

  return apiResponse(committee);
}

async function handleDelete(request: NextRequest, auth: JwtPayload) {
  const id = request.nextUrl.pathname.split('/').pop();

  const existing = await prisma.committee.findFirst({
    where: { id, ...tenantWhere(auth.tenantId) },
  });

  if (!existing) return apiError('Comitê não encontrado', 404);

  // Soft delete
  await prisma.committee.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'DELETE',
    entityType: 'committee',
    entityId: id,
    oldValues: existing,
  });

  return apiResponse({ message: 'Comitê removido com sucesso' });
}

export const GET = withAuth(handleGet, { module: 'committees', action: 'read' });
export const PUT = withAuth(handlePut, { module: 'committees', action: 'update' });
export const DELETE = withAuth(handleDelete, { module: 'committees', action: 'delete' });

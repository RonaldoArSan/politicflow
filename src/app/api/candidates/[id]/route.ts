import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(_req: NextRequest, auth: AccessTokenPayload, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = await prisma.candidate.findFirst({
    where: { id, ...tenantWhere(auth.tenantId) },
    include: { _count: { select: { actions: true, schedules: true } } },
  });
  if (!candidate) return apiError('Candidato não encontrado', 404);
  return apiResponse(candidate);
}

async function handlePatch(request: NextRequest, auth: AccessTokenPayload, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const candidate = await prisma.candidate.findFirst({ where: { id, ...tenantWhere(auth.tenantId) } });
  if (!candidate) return apiError('Candidato não encontrado', 404);

  const updated = await prisma.candidate.update({
    where: { id },
    data: {
      ...(body.name         !== undefined && { name: body.name }),
      ...(body.position     !== undefined && { position: body.position }),
      ...(body.party        !== undefined && { party: body.party }),
      ...(body.coalition    !== undefined && { coalition: body.coalition }),
      ...(body.federation   !== undefined && { federation: body.federation }),
      ...(body.municipality !== undefined && { municipality: body.municipality }),
      ...(body.state        !== undefined && { state: body.state }),
      ...(body.bio          !== undefined && { bio: body.bio }),
      ...(body.photo        !== undefined && { photo: body.photo }),
      ...(body.socialMedia  !== undefined && { socialMedia: body.socialMedia }),
    },
  });

  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'UPDATE', entityType: 'candidate', entityId: id, oldValues: candidate, newValues: body });
  return apiResponse(updated);
}

async function handleDelete(_req: NextRequest, auth: AccessTokenPayload, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = await prisma.candidate.findFirst({ where: { id, ...tenantWhere(auth.tenantId) } });
  if (!candidate) return apiError('Candidato não encontrado', 404);

  await prisma.candidate.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'DELETE', entityType: 'candidate', entityId: id });
  return apiResponse({ deleted: true });
}

export const GET    = withAuth(handleGet,    { module: 'candidates', action: 'read'   });
export const PATCH  = withAuth(handlePatch,  { module: 'candidates', action: 'update' });
export const DELETE = withAuth(handleDelete, { module: 'candidates', action: 'delete' });

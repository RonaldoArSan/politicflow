import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handlePatch(request: NextRequest, auth: AccessTokenPayload, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const unit = await prisma.gabineteUnit.findFirst({ where: { id, ...tenantWhere(auth.tenantId) } });
  if (!unit) return apiError('Unidade não encontrada', 404);

  const updated = await prisma.gabineteUnit.update({
    where: { id },
    data: {
      ...(body.name            !== undefined && { name:            body.name            }),
      ...(body.type            !== undefined && { type:            body.type            }),
      ...(body.status          !== undefined && { status:          body.status          }),
      ...(body.address         !== undefined && { address:         body.address         }),
      ...(body.city            !== undefined && { city:            body.city            }),
      ...(body.state           !== undefined && { state:           body.state           }),
      ...(body.neighborhood    !== undefined && { neighborhood:    body.neighborhood    }),
      ...(body.region          !== undefined && { region:          body.region          }),
      ...(body.phone           !== undefined && { phone:           body.phone           }),
      ...(body.email           !== undefined && { email:           body.email           }),
      ...(body.responsibleName !== undefined && { responsibleName: body.responsibleName }),
      ...(body.observations    !== undefined && { observations:    body.observations    }),
    },
  });

  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'UPDATE', entityType: 'gabinete_unit', entityId: id, oldValues: unit, newValues: body });
  return apiResponse(updated);
}

async function handleDelete(_req: NextRequest, auth: AccessTokenPayload, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const unit = await prisma.gabineteUnit.findFirst({ where: { id, ...tenantWhere(auth.tenantId) } });
  if (!unit) return apiError('Unidade não encontrada', 404);

  await prisma.gabineteUnit.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'DELETE', entityType: 'gabinete_unit', entityId: id });
  return apiResponse({ deleted: true });
}

export const PATCH  = withAuth(handlePatch,  { module: 'gabinete', action: 'update' });
export const DELETE = withAuth(handleDelete, { module: 'gabinete', action: 'delete' });

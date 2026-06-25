import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, auditLog } from '@/lib/api-helpers';
import type { AccessTokenPayload } from '@/lib/auth';

async function handlePatch(request: NextRequest, auth: AccessTokenPayload) {
  const body = await request.json();
  const { name, domain } = body;

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant) return apiError('Tenant não encontrado', 404);

  const updated = await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: {
      ...(name   !== undefined && { name   }),
      ...(domain !== undefined && { domain: domain || null }),
    },
    select: { id: true, name: true, slug: true, domain: true },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'UPDATE',
    entityType: 'tenant',
    entityId: auth.tenantId,
    oldValues: { name: tenant.name, domain: tenant.domain },
    newValues: { name, domain },
  });

  return apiResponse(updated);
}

export const PATCH = withAuth(handlePatch, { module: 'settings', action: 'update' });

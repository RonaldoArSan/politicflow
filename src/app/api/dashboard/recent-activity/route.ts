import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, withAuth } from '@/lib/api-helpers';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(_req: NextRequest, auth: AccessTokenPayload) {
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: auth.tenantId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  return apiResponse(logs);
}

export const GET = withAuth(handleGet, { module: 'dashboard', action: 'read' });

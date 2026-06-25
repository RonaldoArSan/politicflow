import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, withAuth } from '@/lib/api-helpers';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(_req: NextRequest, auth: AccessTokenPayload) {
  const stages = await prisma.crmStage.groupBy({
    by: ['stage'],
    where: { person: { tenantId: auth.tenantId, deletedAt: null } },
    _count: { stage: true },
  });

  return apiResponse(stages.map(s => ({ stage: s.stage, count: s._count.stage })));
}

export const GET = withAuth(handleGet, { module: 'dashboard', action: 'read' });

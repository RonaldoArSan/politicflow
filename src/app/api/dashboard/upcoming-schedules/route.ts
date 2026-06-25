import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, withAuth } from '@/lib/api-helpers';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(_req: NextRequest, auth: AccessTokenPayload) {
  const schedules = await prisma.schedule.findMany({
    where: {
      tenantId: auth.tenantId,
      deletedAt: null,
      startDate: { gte: new Date() },
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
    },
    orderBy: { startDate: 'asc' },
    take: 5,
    select: { id: true, title: true, startDate: true, type: true, status: true },
  });

  return apiResponse(schedules);
}

export const GET = withAuth(handleGet, { module: 'dashboard', action: 'read' });

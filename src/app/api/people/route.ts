import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, apiResponse, apiError, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const unlinked = searchParams.get('unlinked') === 'true';

  const where = {
    ...tenantWhere(auth.tenantId),
    deletedAt: null,
    ...(search ? {
      name: { contains: search, mode: 'insensitive' as const }
    } : {}),
    ...(unlinked ? {
      AND: [
        { advisor: null },
        { leader: null }
      ]
    } : {})
  };

  const [people, total] = await Promise.all([
    prisma.person.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        occupation: true
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit
    }),
    prisma.person.count({ where })
  ]);

  return paginatedResponse(people, total, page, limit);
}

export const GET = withAuth(handleGet, { module: 'committees', action: 'read' });

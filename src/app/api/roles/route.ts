import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, withAuth, getPaginationParams, paginatedResponse } from '@/lib/api-helpers';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);

  const where = {
    OR: [{ tenantId: auth.tenantId }, { tenantId: null, isSystem: true }],
  };

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      include: { _count: { select: { userRoles: true } } },
      orderBy: { isSystem: 'desc' },
      skip,
      take: limit,
    }),
    prisma.role.count({ where }),
  ]);

  return paginatedResponse(roles, total, page, limit);
}

export const GET = withAuth(handleGet, { module: 'settings', action: 'read' });

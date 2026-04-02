import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, getPaginationParams, paginatedResponse, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { JwtPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: JwtPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const committeeId = searchParams.get('committeeId') || '';

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(status ? { status: status as never } : {}),
    ...(committeeId ? { committeeId } : {}),
  };

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      include: {
        committee: { select: { id: true, name: true } },
        _count: { select: { advisors: true, actions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.team.count({ where }),
  ]);

  return paginatedResponse(teams, total, page, limit);
}

async function handlePost(request: NextRequest, auth: JwtPayload) {
  const body = await request.json();
  const { name, committeeId, supervisorName, status } = body;

  if (!name) {
    return apiError('O nome da equipe é obrigatório', 400);
  }

  const team = await prisma.team.create({
    data: {
      tenantId: auth.tenantId,
      name,
      committeeId: committeeId || null,
      supervisorName,
      status: status || 'ACTIVE',
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'team',
    entityId: team.id,
    newValues: team,
  });

  return apiResponse(team, 201);
}

export const GET = withAuth(handleGet, { module: 'teams', action: 'read' });
export const POST = withAuth(handlePost, { module: 'teams', action: 'create' });

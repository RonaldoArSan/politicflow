import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, getPaginationParams, paginatedResponse, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { JwtPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: JwtPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(type ? { type: type as never } : {}),
    ...(status ? { status: status as never } : {}),
    ...(dateFrom || dateTo ? {
      startDate: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    } : {}),
  };

  const [actions, total] = await Promise.all([
    prisma.politicalAction.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
        candidate: { select: { id: true, name: true } },
        committee: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.politicalAction.count({ where }),
  ]);

  return paginatedResponse(actions, total, page, limit);
}

async function handlePost(request: NextRequest, auth: JwtPayload) {
  const body = await request.json();
  const {
    title, type, description, startDate, endDate,
    location, responsibleId, candidateId, committeeId, teamId,
    goal, estimatedPublic, estimatedCost, materials,
  } = body;

  if (!title || !type || !startDate) {
    return apiError('Título, tipo e data são obrigatórios', 400);
  }

  const action = await prisma.politicalAction.create({
    data: {
      tenantId: auth.tenantId,
      title,
      type,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      location,
      responsibleId,
      candidateId,
      committeeId,
      teamId,
      goal,
      estimatedPublic,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      materials,
    },
    include: {
      responsible: { select: { id: true, name: true } },
      candidate: { select: { id: true, name: true } },
      committee: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'political_action',
    entityId: action.id,
    newValues: { title, type, startDate },
  });

  return apiResponse(action, 201);
}

export const GET = withAuth(handleGet, { module: 'actions', action: 'read' });
export const POST = withAuth(handlePost, { module: 'actions', action: 'create' });

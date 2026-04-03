import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, getPaginationParams, paginatedResponse, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(status ? { status: status as never } : {}),
    ...(priority ? { priority: priority as never } : {}),
  };

  const [demands, total] = await Promise.all([
    prisma.demand.findMany({
      where,
      include: {
        responsible: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.demand.count({ where }),
  ]);

  return paginatedResponse(demands, total, page, limit);
}

async function handlePost(request: NextRequest, auth: AccessTokenPayload) {
  const body = await request.json();
  const {
    title, description, category, priority, origin, originDetail,
    responsibleId, forwardedTo, deadline, neighborhood, city, region,
  } = body;

  if (!title) {
    return apiError('Título é obrigatório', 400);
  }

  const demand = await prisma.demand.create({
    data: {
      tenantId: auth.tenantId,
      title,
      description,
      category,
      priority: priority || 'MEDIUM',
      origin,
      originDetail,
      responsibleId,
      createdById: auth.userId,
      forwardedTo,
      deadline: deadline ? new Date(deadline) : null,
      neighborhood,
      city,
      region,
    },
    include: {
      responsible: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'demand',
    entityId: demand.id,
    newValues: { title, priority, origin },
  });

  return apiResponse(demand, 201);
}

export const GET = withAuth(handleGet, { module: 'demands', action: 'read' });
export const POST = withAuth(handlePost, { module: 'demands', action: 'create' });

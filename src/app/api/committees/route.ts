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

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(type ? { type: type as never } : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [committees, total] = await Promise.all([
    prisma.committee.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { teams: true, children: true, actions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.committee.count({ where }),
  ]);

  return paginatedResponse(committees, total, page, limit);
}

async function handlePost(request: NextRequest, auth: JwtPayload) {
  const body = await request.json();
  const { name, type, address, city, state, neighborhood, region, zipCode, phone, email, responsibleName, parentId, observations } = body;

  if (!name || !type) {
    return apiError('Nome e tipo são obrigatórios', 400);
  }

  const committee = await prisma.committee.create({
    data: {
      tenantId: auth.tenantId,
      name,
      type,
      address,
      city,
      state,
      neighborhood,
      region,
      zipCode,
      phone,
      email,
      responsibleName,
      parentId,
      observations,
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'committee',
    entityId: committee.id,
    newValues: committee,
  });

  return apiResponse(committee, 201);
}

export const GET = withAuth(handleGet, { module: 'committees', action: 'read' });
export const POST = withAuth(handlePost, { module: 'committees', action: 'create' });

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
  const region = searchParams.get('region') || '';

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? {
      person: { name: { contains: search, mode: 'insensitive' as const } },
    } : {}),
    ...(status ? { status: status as never } : {}),
    ...(region ? { region: { contains: region, mode: 'insensitive' as const } } : {}),
  };

  const [leaders, total] = await Promise.all([
    prisma.leader.findMany({
      where,
      include: {
        person: {
          select: { id: true, name: true, email: true, phone: true, city: true, neighborhood: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.leader.count({ where }),
  ]);

  return paginatedResponse(leaders, total, page, limit);
}

async function handlePost(request: NextRequest, auth: AccessTokenPayload) {
  const body = await request.json();
  const {
    name, email, phone, city, neighborhood,
    region, segment, influenceLevel, estimatedSupporters, observations,
  } = body;

  if (!name) {
    return apiError('Nome é obrigatório', 400);
  }

  const person = await prisma.person.create({
    data: {
      tenantId: auth.tenantId,
      name,
      email,
      phone,
      city,
      neighborhood,
    },
  });

  const leader = await prisma.leader.create({
    data: {
      tenantId: auth.tenantId,
      personId: person.id,
      region,
      segment,
      influenceLevel: influenceLevel || 'MEDIUM',
      estimatedSupporters: estimatedSupporters ? parseInt(estimatedSupporters) : null,
      observations,
      lastContactAt: new Date(),
    },
    include: {
      person: { select: { id: true, name: true, email: true, phone: true, city: true } },
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'leader',
    entityId: leader.id,
    newValues: { name, region, segment, influenceLevel },
  });

  return apiResponse(leader, 201);
}

export const GET = withAuth(handleGet, { module: 'leaders', action: 'read' });
export const POST = withAuth(handlePost, { module: 'leaders', action: 'create' });

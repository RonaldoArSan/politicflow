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

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? {
      person: { name: { contains: search, mode: 'insensitive' as const } },
    } : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [advisors, total] = await Promise.all([
    prisma.advisor.findMany({
      where,
      include: {
        person: {
          select: { id: true, name: true, email: true, phone: true, city: true },
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.advisor.count({ where }),
  ]);

  return paginatedResponse(advisors, total, page, limit);
}

async function handlePost(request: NextRequest, auth: AccessTokenPayload) {
  const body = await request.json();
  const { name, email, phone, city, role, specialty, teamId, observations } = body;

  if (!name) {
    return apiError('Nome é obrigatório', 400);
  }

  // Create person first, then advisor
  const person = await prisma.person.create({
    data: {
      tenantId: auth.tenantId,
      name,
      email,
      phone,
      city,
    },
  });

  const advisor = await prisma.advisor.create({
    data: {
      tenantId: auth.tenantId,
      personId: person.id,
      role,
      specialty,
      teamId,
      observations,
      startDate: new Date(),
    },
    include: {
      person: { select: { id: true, name: true, email: true, phone: true } },
      team: { select: { id: true, name: true } },
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'advisor',
    entityId: advisor.id,
    newValues: { name, role, specialty },
  });

  return apiResponse(advisor, 201);
}

export const GET = withAuth(handleGet, { module: 'advisors', action: 'read' });
export const POST = withAuth(handlePost, { module: 'advisors', action: 'create' });

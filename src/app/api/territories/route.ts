import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, getPaginationParams, paginatedResponse, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search   = searchParams.get('search')   || '';
  const type     = searchParams.get('type')     || '';
  const parentId = searchParams.get('parentId') || '';

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search   ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(type     ? { type: type as never } : {}),
    ...(parentId ? { parentId } : { parentId: null }),
  };

  const [territories, total] = await Promise.all([
    prisma.territory.findMany({
      where,
      include: {
        _count: { select: { children: true } },
        parent: { select: { id: true, name: true } },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.territory.count({ where }),
  ]);

  return paginatedResponse(territories, total, page, limit);
}

async function handlePost(request: NextRequest, auth: AccessTokenPayload) {
  const body = await request.json();
  const { name, type, parentId, population, metadata } = body;

  if (!name || !type) return apiError('Nome e tipo são obrigatórios', 400);

  const territory = await prisma.territory.create({
    data: {
      tenantId: auth.tenantId,
      name,
      type,
      parentId: parentId || null,
      population: population ? parseInt(population) : null,
      metadata: metadata || null,
    },
  });

  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'CREATE', entityType: 'territory', entityId: territory.id, newValues: { name, type } });
  return apiResponse(territory, 201);
}

async function handleDelete(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return apiError('ID obrigatório', 400);

  const territory = await prisma.territory.findFirst({ where: { id, ...tenantWhere(auth.tenantId) } });
  if (!territory) return apiError('Território não encontrado', 404);

  await prisma.territory.delete({ where: { id } });
  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'DELETE', entityType: 'territory', entityId: id });
  return apiResponse({ deleted: true });
}

export const GET    = withAuth(handleGet,    { module: 'territories', action: 'read'   });
export const POST   = withAuth(handlePost,   { module: 'territories', action: 'create' });
export const DELETE = withAuth(handleDelete, { module: 'territories', action: 'delete' });

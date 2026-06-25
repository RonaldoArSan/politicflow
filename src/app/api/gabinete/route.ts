import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, getPaginationParams, paginatedResponse, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const type   = searchParams.get('type')   || '';
  const status = searchParams.get('status') || '';

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(type   ? { type:   type   as never } : {}),
    ...(status ? { status: status as never } : {}),
  };

  const [units, total] = await Promise.all([
    prisma.gabineteUnit.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.gabineteUnit.count({ where }),
  ]);

  return paginatedResponse(units, total, page, limit);
}

async function handlePost(request: NextRequest, auth: AccessTokenPayload) {
  const body = await request.json();
  const { name, type, address, city, state, neighborhood, region, zipCode, phone, email, responsibleName, observations } = body;

  if (!name || !type) return apiError('Nome e tipo são obrigatórios', 400);

  const unit = await prisma.gabineteUnit.create({
    data: {
      tenantId: auth.tenantId,
      name, type,
      address: address || null,
      city: city || null,
      state: state || null,
      neighborhood: neighborhood || null,
      region: region || null,
      zipCode: zipCode || null,
      phone: phone || null,
      email: email || null,
      responsibleName: responsibleName || null,
      observations: observations || null,
    },
  });

  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'CREATE', entityType: 'gabinete_unit', entityId: unit.id, newValues: { name, type } });
  return apiResponse(unit, 201);
}

export const GET  = withAuth(handleGet,  { module: 'gabinete', action: 'read'   });
export const POST = withAuth(handlePost, { module: 'gabinete', action: 'create' });

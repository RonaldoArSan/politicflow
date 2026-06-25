import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, getPaginationParams, paginatedResponse, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search = searchParams.get('search') || '';

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { position: { contains: search, mode: 'insensitive' as const } },
        { party: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  };

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: {
        _count: { select: { actions: true, schedules: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.candidate.count({ where }),
  ]);

  return paginatedResponse(candidates, total, page, limit);
}

async function handlePost(request: NextRequest, auth: AccessTokenPayload) {
  const body = await request.json();
  const { name, position, party, coalition, federation, municipality, state, bio, photo, socialMedia } = body;

  if (!name || !position || !party) {
    return apiError('Nome, cargo e partido são obrigatórios', 400);
  }

  const candidate = await prisma.candidate.create({
    data: {
      tenantId: auth.tenantId,
      name,
      position,
      party,
      coalition: coalition || null,
      federation: federation || null,
      municipality: municipality || null,
      state: state || null,
      bio: bio || null,
      photo: photo || null,
      socialMedia: socialMedia || null,
    },
  });

  await auditLog({ tenantId: auth.tenantId, userId: auth.userId, action: 'CREATE', entityType: 'candidate', entityId: candidate.id, newValues: { name, position, party } });
  return apiResponse(candidate, 201);
}

export const GET  = withAuth(handleGet,  { module: 'candidates', action: 'read'   });
export const POST = withAuth(handlePost, { module: 'candidates', action: 'create' });

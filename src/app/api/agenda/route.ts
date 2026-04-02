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

  const [schedules, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      include: {
        candidate: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'asc' },
      skip,
      take: limit,
    }),
    prisma.schedule.count({ where }),
  ]);

  return paginatedResponse(schedules, total, page, limit);
}

async function handlePost(request: NextRequest, auth: JwtPayload) {
  const body = await request.json();
  const {
    title, description, type, startDate, endDate, allDay,
    location, responsibleName, briefing, isPublic,
    participants, checklist, candidateId,
  } = body;

  if (!title || !type || !startDate) {
    return apiError('Título, tipo e data são obrigatórios', 400);
  }

  const schedule = await prisma.schedule.create({
    data: {
      tenantId: auth.tenantId,
      title,
      description,
      type,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      allDay: allDay || false,
      location,
      responsibleName,
      briefing,
      isPublic: isPublic || false,
      participants: participants || [],
      checklist,
      candidateId,
      createdById: auth.userId,
    },
    include: {
      candidate: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'schedule',
    entityId: schedule.id,
    newValues: { title, type, startDate },
  });

  return apiResponse(schedule, 201);
}

export const GET = withAuth(handleGet, { module: 'agenda', action: 'read' });
export const POST = withAuth(handlePost, { module: 'agenda', action: 'create' });

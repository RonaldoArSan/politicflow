import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError, paginatedResponse } from '@/lib/api-helpers';
import { ScheduleService, scheduleFiltersSchema, createScheduleSchema } from '@/lib/services/schedule-service';
import { z } from 'zod';

import type { User } from '@prisma/client';

async function handleGET(req: NextRequest, tenantId: string, user: User) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = scheduleFiltersSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      candidateId: searchParams.get('candidateId') || undefined,
      isPublic: searchParams.get('isPublic') || undefined
    });

    const result = await ScheduleService.list(tenantId, filters);
    return paginatedResponse(result.data, result.pagination.total, filters.page, filters.limit);
  } catch (error) {
    return apiError('Erro ao buscar agendas', 500);
  }
}

async function handlePOST(req: NextRequest, tenantId: string, user: User) {
  try {
    const body = await req.json();
    const validatedData = createScheduleSchema.parse(body);

    const schedule = await ScheduleService.create(validatedData, tenantId, user.id);
    return apiResponse(schedule, 'Agenda criada com sucesso', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos: ' + error.issues.map(e => e.message).join(', '), 400);
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar agenda';
    return apiError(message, 500);
  }
}

export const GET = withAuth(handleGET, { module: 'agenda', action: 'read' });
export const POST = withAuth(handlePOST, { module: 'agenda', action: 'create' });

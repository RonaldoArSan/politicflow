import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import { ScheduleService, updateScheduleSchema } from '@/lib/services/schedule-service';
import { z } from 'zod';
import type { User } from '@prisma/client';

function getIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 1];
}

async function handleGET(req: NextRequest, tenantId: string, _user: User) {
  try {
    const id = getIdFromUrl(req);
    const schedule = await ScheduleService.getById(id, tenantId);
    return apiResponse(schedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar agenda';
    return apiError(message, 500);
  }
}

async function handlePUT(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    const body = await req.json();
    const validatedData = updateScheduleSchema.parse(body);

    const schedule = await ScheduleService.update(id, validatedData, tenantId, user.id);
    return apiResponse(schedule, 'Agenda atualizada com sucesso');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos: ' + error.issues.map(e => e.message).join(', '), 400);
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar agenda';
    return apiError(message, 500);
  }
}

async function handleDELETE(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    await ScheduleService.delete(id, tenantId, user.id);
    return apiResponse({ message: 'Agenda excluída com sucesso' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir agenda';
    return apiError(message, 500);
  }
}

export const GET = withAuth(handleGET, { module: 'agenda', action: 'read' });
export const PUT = withAuth(handlePUT, { module: 'agenda', action: 'update' });
export const DELETE = withAuth(handleDELETE, { module: 'agenda', action: 'delete' });

import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import { CommitteeService } from '@/lib/services/committee-service';
import { z } from 'zod';
import type { User } from '@prisma/client';

const updateCommitteeSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['CENTRAL', 'REGIONAL']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  neighborhood: z.string().optional(),
  region: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  responsibleName: z.string().optional(),
  parentId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  observations: z.string().optional()
});

function getIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 1];
}

async function handleGET(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    const committee = await CommitteeService.getById(id, tenantId);
    return apiResponse(committee);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar comitê';
    return apiError(message, 500);
  }
}

async function handlePUT(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    const body = await req.json();
    const validatedData = updateCommitteeSchema.parse(body);

    const committee = await CommitteeService.update(id, validatedData, tenantId, user.id);
    return apiResponse(committee, 'Comitê atualizado com sucesso');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos: ' + error.issues.map(e => e.message).join(', '), 400);
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar comitê';
    return apiError(message, 500);
  }
}

async function handleDELETE(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    await CommitteeService.delete(id, tenantId, user.id);
    return apiResponse({ message: 'Comitê excluído com sucesso' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir comitê';
    return apiError(message, 500);
  }
}

export const GET = withAuth(handleGET, { module: 'committees', action: 'read' });
export const PUT = withAuth(handlePUT, { module: 'committees', action: 'update' });
export const DELETE = withAuth(handleDELETE, { module: 'committees', action: 'delete' });

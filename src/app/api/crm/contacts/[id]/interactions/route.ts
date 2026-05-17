import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError, paginatedResponse } from '@/lib/api-helpers';
import { CRMService } from '@/lib/services/crm-service';
import { z } from 'zod';
import type { User } from '@prisma/client';

const recordInteractionSchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'MESSAGE', 'VISIT', 'OTHER']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  nextFollowUp: z.string().datetime().optional(),
});

function getIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 3];
}

async function handleGET(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);

    const result = await CRMService.getInteractions(id, tenantId);
    return apiResponse(result, 'Interações encontradas', 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar interações';
    return apiError(message, 500);
  }
}

async function handlePOST(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    const body = await req.json();
    const validatedData = recordInteractionSchema.parse(body);

    const interaction = await CRMService.recordInteraction(
      id,
      {
        type: validatedData.type,
        description: validatedData.description,
        date: validatedData.nextFollowUp ? new Date(validatedData.nextFollowUp) : undefined,
      },
      tenantId
    );

    return apiResponse(interaction, 'Interação registrada com sucesso', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = 'Dados inválidos: ' + error.issues.map(e => e.message).join(', ');
      return apiError(message, 400);
    }
    const message = error instanceof Error ? error.message : 'Erro ao registrar interação';
    return apiError(message, 500);
  }
}

export const GET = withAuth(handleGET, { module: 'crm', action: 'read' });
export const POST = withAuth(handlePOST, { module: 'crm', action: 'create' });

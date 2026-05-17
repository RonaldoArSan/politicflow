import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import { CRMService } from '@/lib/services/crm-service';
import { z } from 'zod';
import type { User } from '@prisma/client';

const moveStageSchema = z.object({
  targetStage: z.enum([
    'NEW_CONTACT',
    'POTENTIAL_SUPPORTER',
    'ACTIVE_LEADER',
    'STRATEGIC_PARTNER',
    'CONFIRMED_MOBILIZER',
  ]),
});

function getIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 3];
}

async function handlePATCH(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    const body = await req.json();
    const { targetStage } = moveStageSchema.parse(body);

    const contact = await CRMService.moveStage(id, targetStage, tenantId, user.id);
    return apiResponse({
      id: contact.id,
      personId: contact.personId,
      name: (contact as any).person?.name,
      phone: (contact as any).person?.phone,
      email: (contact as any).person?.email,
      role: (contact as any).person?.occupation,
      neighborhood: (contact as any).person?.neighborhood,
      city: (contact as any).person?.city,
      stage: contact.stage,
      impact: (contact as any).impact ?? 'MEDIUM',
      observations: (contact as any).person?.notes,
      lastInteraction: (contact as any).interactions?.[0]?.date ?? null,
      nextFollowUp: contact.nextFollowUp,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    }, `Contato movido para ${targetStage}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = 'Dados inválidos: ' + error.issues.map(e => e.message).join(', ');
      return apiError(message, 400);
    }
    const message = error instanceof Error ? error.message : 'Erro ao mover contato';
    return apiError(message, 500);
  }
}

export const PATCH = withAuth(handlePATCH, { module: 'crm', action: 'update' });

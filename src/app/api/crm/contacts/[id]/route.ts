import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import { CRMService } from '@/lib/services/crm-service';
import { z } from 'zod';
import type { User } from '@prisma/client';

const updateContactSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  observations: z.string().optional(),
});

function getIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 1];
}

async function handleGET(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    const crmStage = await (await import('@/lib/prisma')).default.crmStage.findUnique({
      where: { id },
      include: { person: true, interactions: { orderBy: { date: 'desc' }, take: 1 } },
    });
    if (!crmStage || crmStage.person.tenantId !== tenantId) return apiError('Contato não encontrado', 404);
    return apiResponse(mapContact(crmStage), 'Contato encontrado');
  } catch (error) {
    return apiError('Erro ao buscar contato', 500);
  }
}

function mapContact(c: any) {
  return {
    id: c.id,
    personId: c.personId,
    name: c.person.name,
    phone: c.person.phone,
    email: c.person.email,
    role: c.person.occupation,
    neighborhood: c.person.neighborhood,
    city: c.person.city,
    stage: c.stage,
    impact: c.impact ?? 'MEDIUM',
    observations: c.person.notes,
    lastInteraction: c.interactions?.[0]?.date ?? null,
    nextFollowUp: c.nextFollowUp,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

async function handlePATCH(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    const body = await req.json();
    const validatedData = updateContactSchema.parse(body);

    const contact = await CRMService.update(id, validatedData, tenantId, user.id);
    return apiResponse(mapContact(contact), 'Contato atualizado com sucesso');
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = 'Dados inválidos: ' + error.issues.map(e => e.message).join(', ');
      return apiError(message, 400);
    }
    const message = error instanceof Error ? error.message : 'Erro ao atualizar contato';
    return apiError(message, message.includes('não encontrado') ? 404 : 500);
  }
}

async function handleDELETE(req: NextRequest, tenantId: string, user: User) {
  try {
    const id = getIdFromUrl(req);
    await CRMService.delete(id, tenantId, user.id);
    return apiResponse({ id }, 'Contato deletado com sucesso');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar contato';
    return apiError(message, message.includes('não encontrado') ? 404 : 500);
  }
}

export const GET = withAuth(handleGET, { module: 'crm', action: 'read' });
export const PATCH = withAuth(handlePATCH, { module: 'crm', action: 'update' });
export const DELETE = withAuth(handleDELETE, { module: 'crm', action: 'delete' });

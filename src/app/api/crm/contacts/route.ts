import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError, paginatedResponse } from '@/lib/api-helpers';
import { CRMService, crmFiltersSchema } from '@/lib/services/crm-service';
import { z } from 'zod';
import type { User } from '@prisma/client';

const createContactSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  observations: z.string().optional(),
});

type CreateContactInput = z.infer<typeof createContactSchema>;

function mapContact(c: any) {
  return {
    id: c.id,
    personId: c.personId,
    name: c.person?.name ?? c.name,
    phone: c.person?.phone ?? c.phone,
    email: c.person?.email ?? c.email,
    role: c.person?.occupation ?? c.role,
    neighborhood: c.person?.neighborhood ?? c.neighborhood,
    city: c.person?.city ?? c.city,
    stage: c.stage,
    impact: c.impact ?? 'MEDIUM',
    observations: c.person?.notes ?? c.observations,
    lastInteraction: c.interactions?.[0]?.date ?? null,
    nextFollowUp: c.nextFollowUp,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

async function handleGET(req: NextRequest, tenantId: string, user: User) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = crmFiltersSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      stage: searchParams.get('stage') || undefined,
      region: searchParams.get('region') || undefined,
    });

    const result = await CRMService.list(tenantId, filters);
    return paginatedResponse(
      result.data.map(mapContact),
      result.pagination.total,
      result.pagination.page,
      result.pagination.limit
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar contatos';
    return apiError(message, 500);
  }
}

async function handlePOST(req: NextRequest, tenantId: string, user: User) {
  try {
    const body = await req.json();
    const validatedData = createContactSchema.parse(body);

    const contact = await CRMService.create(validatedData, tenantId, user.id);
    return apiResponse(contact, 'Contato criado com sucesso', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = 'Dados inválidos: ' + error.issues.map(e => e.message).join(', ');
      return apiError(message, 400);
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar contato';
    return apiError(message, 500);
  }
}

export const GET = withAuth(handleGET, { module: 'crm', action: 'read' });
export const POST = withAuth(handlePOST, { module: 'crm', action: 'create' });

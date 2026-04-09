import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError, paginatedResponse } from '@/lib/api-helpers';
import { CommitteeService, committeeFiltersSchema } from '@/lib/services/committee-service';
import { z } from 'zod';

const createCommitteeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['CENTRAL', 'REGIONAL', 'MUNICIPAL', 'NEIGHBORHOOD']),
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
  observations: z.string().optional()
});

import type { User } from '@prisma/client';

async function handleGET(req: NextRequest, tenantId: string, user: User) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = committeeFiltersSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined
    });

    const result = await CommitteeService.list(tenantId, filters);
    return paginatedResponse(result.data, result.pagination.total, filters.page, filters.limit);
  } catch (error) {
    return apiError('Erro ao buscar comitês', 500);
  }
}

async function handlePOST(req: NextRequest, tenantId: string, user: User) {
  try {
    const body = await req.json();
    const validatedData = createCommitteeSchema.parse(body);

    const committee = await CommitteeService.create(validatedData, tenantId, user.id);
    return apiResponse(committee, 'Comitê criado com sucesso', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos: ' + error.issues.map(e => e.message).join(', '), 400);
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar comitê';
    return apiError(message, 500);
  }
}

export const GET = withAuth(handleGET, { module: 'committees', action: 'read' });
export const POST = withAuth(handlePOST, { module: 'committees', action: 'create' });

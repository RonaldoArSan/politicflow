import { NextRequest } from 'next/server';
import { withAuth, apiResponse, apiError } from '@/lib/api-helpers';
import { PlanLimits, PlanLimitsError } from '@/lib/billing-limits';

import type { User } from '@prisma/client';

async function handleGET(req: NextRequest, tenantId: string, user: User) {
  try {
    const usageStats = await PlanLimits.getUsageStats(tenantId);
    return apiResponse(usageStats);
  } catch (error) {
    if (error instanceof PlanLimitsError) {
      return apiError(error.message, 403);
    }
    return apiError('Erro ao buscar estatísticas de uso', 500);
  }
}

export const GET = withAuth(handleGET, { module: 'settings', action: 'read' });
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, withAuth } from '@/lib/api-helpers';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(_req: NextRequest, auth: AccessTokenPayload) {
  const demands = await prisma.demand.findMany({
    where: { tenantId: auth.tenantId, deletedAt: null },
    select: { category: true, status: true },
  });

  const map: Record<string, { total: number; resolved: number }> = {};
  for (const d of demands) {
    const key = d.category || 'Outros';
    if (!map[key]) map[key] = { total: 0, resolved: 0 };
    map[key].total++;
    if (d.status === 'RESOLVED') map[key].resolved++;
  }

  const result = Object.entries(map)
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return apiResponse(result);
}

export const GET = withAuth(handleGet, { module: 'dashboard', action: 'read' });

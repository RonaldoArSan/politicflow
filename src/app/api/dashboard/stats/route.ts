import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, withAuth } from '@/lib/api-helpers';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(_req: NextRequest, auth: AccessTokenPayload) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const [
    actionsTotal,
    actionsConfirmed,
    schedulesThisWeek,
    leadersActive,
    demandsOpen,
    crmTotal,
    tasksPending,
  ] = await Promise.all([
    prisma.politicalAction.count({ where: { tenantId: auth.tenantId, deletedAt: null, startDate: { gte: startOfMonth } } }),
    prisma.politicalAction.count({ where: { tenantId: auth.tenantId, deletedAt: null, status: 'CONFIRMED', startDate: { gte: startOfMonth } } }),
    prisma.schedule.count({ where: { tenantId: auth.tenantId, deletedAt: null, startDate: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.leader.count({ where: { tenantId: auth.tenantId, deletedAt: null, status: 'ACTIVE' } }),
    prisma.demand.count({ where: { tenantId: auth.tenantId, deletedAt: null, status: 'OPEN' } }),
    prisma.crmStage.count({ where: { person: { tenantId: auth.tenantId, deletedAt: null } } }),
    prisma.task.count({ where: { tenantId: auth.tenantId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } } }),
  ]);

  return apiResponse({
    actions: { total: actionsTotal, confirmed: actionsConfirmed },
    schedules: { thisWeek: schedulesThisWeek },
    leaders: { active: leadersActive },
    demands: { open: demandsOpen },
    crm: { total: crmTotal },
    tasks: { pending: tasksPending },
  });
}

export const GET = withAuth(handleGet, { module: 'dashboard', action: 'read' });

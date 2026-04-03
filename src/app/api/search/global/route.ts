import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError, withAuth, apiResponse } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

// Define search result type
interface SearchResult {
  id: string;
  type: 'schedule' | 'action' | 'task' | 'demand' | 'advisor' | 'leader' | 'candidate';
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  icon?: string;
  color?: string;
  route: string;
}

async function handleGet(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  if (!query || query.length < 2) {
    return apiResponse([]);
  }

  const searchFilter = { contains: query, mode: 'insensitive' as const };
  const tenantFilter = tenantWhere(auth.tenantId);

  try {
    const [schedules, actions, tasks, demands, advisors, leaders, candidates] = await Promise.all([
      // Schedules
      prisma.schedule.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { title: searchFilter },
            { description: searchFilter },
            { location: searchFilter },
          ],
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          type: true,
          location: true,
        },
        take: limit,
      }),

      // Political Actions
      prisma.politicalAction.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { title: searchFilter },
            { description: searchFilter },
            { goal: searchFilter },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          startDate: true,
          status: true,
        },
        take: limit,
      }),

      // Tasks
      prisma.task.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { title: searchFilter },
            { description: searchFilter },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
        },
        take: limit,
      }),

      // Demands
      prisma.demand.findMany({
        where: {
          ...tenantFilter,
          OR: [
            { title: searchFilter },
            { description: searchFilter },
            { category: searchFilter },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          category: true,
        },
        take: limit,
      }),

      // Advisors
      prisma.advisor.findMany({
        where: {
          ...tenantFilter,
          person: {
            name: searchFilter,
          },
        },
        include: {
          person: {
            select: { name: true },
          },
        },
        take: limit,
      }),

      // Leaders
      prisma.leader.findMany({
        where: {
          ...tenantFilter,
          person: {
            name: searchFilter,
          },
        },
        include: {
          person: {
            select: { name: true },
          },
        },
        take: limit,
      }),

      // Candidates
      prisma.candidate.findMany({
        where: {
          ...tenantFilter,
          name: searchFilter,
        },
        select: {
          id: true,
          name: true,
          position: true,
          party: true,
        },
        take: limit,
      }),
    ]);

    const results: SearchResult[] = [];

    // Format Schedule results
    schedules.forEach((schedule) => {
      results.push({
        id: schedule.id,
        type: 'schedule',
        title: schedule.title,
        subtitle: schedule.type,
        description: schedule.location ?? undefined,
        date: schedule.startDate.toISOString(),
        icon: '📅',
        color: 'blue',
        route: `/dashboard/agenda?id=${schedule.id}`,
      });
    });

    // Format Political Action results
    actions.forEach((action) => {
      results.push({
        id: action.id,
        type: 'action',
        title: action.title,
        subtitle: action.type,
        description: action.description ?? undefined,
        date: action.startDate.toISOString(),
        icon: '⚡',
        color: 'yellow',
        route: `/dashboard/acoes?id=${action.id}`,
      });
    });

    // Format Task results
    tasks.forEach((task) => {
      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        subtitle: task.status,
        description: task.description ? `Prioridade: ${task.priority}` : `Prioridade: ${task.priority}`,
        icon: '📋',
        color: 'green',
        route: `/dashboard/tarefas?id=${task.id}`,
      });
    });

    // Format Demand results
    demands.forEach((demand) => {
      results.push({
        id: demand.id,
        type: 'demand',
        title: demand.title,
        subtitle: demand.status,
        description: demand.category ? `${demand.category}` : undefined,
        icon: '⚠️',
        color: 'red',
        route: `/dashboard/demandas?id=${demand.id}`,
      });
    });

    // Format Advisor results
    advisors.forEach((advisor) => {
      results.push({
        id: advisor.id,
        type: 'advisor',
        title: advisor.person.name,
        subtitle: advisor.specialty || 'Assessor',
        description: advisor.role ?? undefined,
        icon: '🎤',
        color: 'purple',
        route: `/dashboard/assessores?id=${advisor.id}`,
      });
    });

    // Format Leader results
    leaders.forEach((leader) => {
      results.push({
        id: leader.id,
        type: 'leader',
        title: leader.person.name,
        subtitle: leader.influenceLevel || 'Liderança',
        description: leader.segment ?? undefined,
        icon: '⭐',
        color: 'amber',
        route: `/dashboard/liderancas?id=${leader.id}`,
      });
    });

    // Format Candidate results
    candidates.forEach((candidate) => {
      results.push({
        id: candidate.id,
        type: 'candidate',
        title: candidate.name,
        subtitle: 'Candidato',
        description: candidate.position,
        icon: '🗳️',
        color: 'indigo',
        route: `/dashboard/crm?id=${candidate.id}`,
      });
    });

    // Limit total results
    const limitedResults = results.slice(0, limit);

    return apiResponse(limitedResults);
  } catch (error) {
    console.error('Search error:', error);
    return apiError('Erro ao realizar busca', 500);
  }
}

export const GET = withAuth(handleGet);

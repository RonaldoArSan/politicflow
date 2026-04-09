import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, apiResponse, apiError, auditLog } from '@/lib/api-helpers';
import type { User } from '@prisma/client';
import { z } from 'zod';

function getTeamIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 3];
}

const addMemberSchema = z.object({
  advisorId: z.string().uuid('ID do assessor inválido')
});

// GET /api/teams/[id]/members - List team members
async function handleGet(req: NextRequest, tenantId: string, _user: User) {
  const teamId = getTeamIdFromUrl(req);

  const team = await prisma.team.findFirst({
    where: { id: teamId, tenantId, deletedAt: null }
  });

  if (!team) {
    return apiError('Equipe não encontrada', 404);
  }

  const members = await prisma.advisor.findMany({
    where: {
      teamId,
      tenantId,
      deletedAt: null
    },
    include: {
      person: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return apiResponse(members);
}

// POST /api/teams/[id]/members - Add existing advisor to team
async function handlePost(req: NextRequest, tenantId: string, user: User) {
  try {
    const teamId = getTeamIdFromUrl(req);
    const { advisorId } = addMemberSchema.parse(await req.json());

    const team = await prisma.team.findFirst({
      where: { id: teamId, tenantId, deletedAt: null }
    });

    if (!team) {
      return apiError('Equipe não encontrada', 404);
    }

    const advisor = await prisma.advisor.findFirst({
      where: { id: advisorId, tenantId, deletedAt: null }
    });

    if (!advisor) {
      return apiError('Assessor não encontrado', 404);
    }

    if (advisor.teamId === teamId) {
      return apiError('Assessor já está nesta equipe', 400);
    }

    const updated = await prisma.advisor.update({
      where: { id: advisorId },
      data: { teamId },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    await auditLog({
      tenantId,
      userId: user.id,
      action: 'ADD_MEMBER',
      entityType: 'team',
      entityId: teamId,
      newValues: { advisorId }
    });

    return apiResponse(updated, 'Assessor adicionado à equipe', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos', 400);
    }
    console.error('Error adding team member:', error);
    return apiError('Erro ao adicionar assessor', 500);
  }
}

// DELETE /api/teams/[id]/members/[advisorId] - Remove advisor from team
async function handleDelete(req: NextRequest, tenantId: string, user: User) {
  try {
    const teamId = getTeamIdFromUrl(req);
    const segments = req.nextUrl.pathname.split('/');
    const advisorId = segments[segments.length - 1];

    const team = await prisma.team.findFirst({
      where: { id: teamId, tenantId, deletedAt: null }
    });

    if (!team) {
      return apiError('Equipe não encontrada', 404);
    }

    const advisor = await prisma.advisor.findFirst({
      where: { id: advisorId, teamId, tenantId, deletedAt: null }
    });

    if (!advisor) {
      return apiError('Assessor não encontrado nesta equipe', 404);
    }

    const updated = await prisma.advisor.update({
      where: { id: advisorId },
      data: { teamId: null },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    await auditLog({
      tenantId,
      userId: user.id,
      action: 'REMOVE_MEMBER',
      entityType: 'team',
      entityId: teamId,
      oldValues: { advisorId }
    });

    return apiResponse(updated, 'Assessor removido da equipe');
  } catch (error) {
    console.error('Error removing team member:', error);
    return apiError('Erro ao remover assessor', 500);
  }
}

export const GET = withAuth(handleGet, { module: 'teams', action: 'read' });
export const POST = withAuth(handlePost, { module: 'teams', action: 'update' });
export const DELETE = withAuth(handleDelete, { module: 'teams', action: 'update' });

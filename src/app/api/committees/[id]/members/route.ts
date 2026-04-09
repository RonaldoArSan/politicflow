import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, apiResponse, apiError, auditLog } from '@/lib/api-helpers';
import type { User } from '@prisma/client';
import { z } from 'zod';

function getCommitteeIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 3];
}

const addMemberSchema = z.object({
  personId: z.string().uuid('ID da pessoa inválido')
});

// GET /api/committees/[id]/members - List committee members
async function handleGet(req: NextRequest, tenantId: string, _user: User) {
  const committeeId = getCommitteeIdFromUrl(req);

  const committee = await prisma.committee.findFirst({
    where: { id: committeeId, tenantId, deletedAt: null }
  });

  if (!committee) {
    return apiError('Comitê não encontrado', 404);
  }

  // Get all advisors from teams that belong to this committee
  const advisors = await prisma.advisor.findMany({
    where: {
      tenantId,
      deletedAt: null,
      team: {
        committeeId,
        deletedAt: null
      }
    },
    include: {
      person: true,
      team: { select: { id: true, name: true } }
    }
  });

  // For now, we'll only return advisors as committee members
  // Leaders might be handled differently in the future
  const members = advisors.map(a => ({
    ...a.person,
    advisor: a
  }));

  return apiResponse(members);
}

// POST /api/committees/[id]/members - Add person to committee
async function handlePost(req: NextRequest, tenantId: string, user: User) {
  try {
    const committeeId = getCommitteeIdFromUrl(req);
    const { personId } = addMemberSchema.parse(await req.json());

    const committee = await prisma.committee.findFirst({
      where: { id: committeeId, tenantId, deletedAt: null }
    });

    if (!committee) {
      return apiError('Comitê não encontrado', 404);
    }

    const person = await prisma.person.findFirst({
      where: { id: personId, tenantId, deletedAt: null }
    });

    if (!person) {
      return apiError('Pessoa não encontrada', 404);
    }

    // Create a note linking person to committee
    await prisma.note.create({
      data: {
        tenantId,
        entityType: 'committee_member',
        entityId: committeeId,
        content: `Membro adicionado: ${person.name}`,
        authorName: user.name
      }
    });

    await auditLog({
      tenantId,
      userId: user.id,
      action: 'ADD_COMMITTEE_MEMBER',
      entityType: 'committee',
      entityId: committeeId,
      newValues: { personId, personName: person.name }
    });

    return apiResponse(person, 'Membro adicionado ao comitê', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos', 400);
    }
    console.error('Error adding committee member:', error);
    return apiError('Erro ao adicionar membro', 500);
  }
}

// DELETE /api/committees/[id]/members/[personId] - Remove person from committee
async function handleDelete(req: NextRequest, tenantId: string, user: User) {
  try {
    const committeeId = getCommitteeIdFromUrl(req);
    const segments = req.nextUrl.pathname.split('/');
    const personId = segments[segments.length - 1];

    const committee = await prisma.committee.findFirst({
      where: { id: committeeId, tenantId, deletedAt: null }
    });

    if (!committee) {
      return apiError('Comitê não encontrado', 404);
    }

    const person = await prisma.person.findFirst({
      where: { id: personId, tenantId, deletedAt: null }
    });

    if (!person) {
      return apiError('Pessoa não encontrada', 404);
    }

    // Create a note removing person from committee
    await prisma.note.create({
      data: {
        tenantId,
        entityType: 'committee_member',
        entityId: committeeId,
        content: `Membro removido: ${person.name}`,
        authorName: user.name
      }
    });

    await auditLog({
      tenantId,
      userId: user.id,
      action: 'REMOVE_COMMITTEE_MEMBER',
      entityType: 'committee',
      entityId: committeeId,
      oldValues: { personId, personName: person.name }
    });

    return apiResponse(person, 'Membro removido do comitê');
  } catch (error) {
    console.error('Error removing committee member:', error);
    return apiError('Erro ao remover membro', 500);
  }
}

export const GET = withAuth(handleGet, { module: 'committees', action: 'read' });
export const POST = withAuth(handlePost, { module: 'committees', action: 'update' });
export const DELETE = withAuth(handleDelete, { module: 'committees', action: 'update' });

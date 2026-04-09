import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, apiResponse, apiError, auditLog } from '@/lib/api-helpers';
import type { User } from '@prisma/client';
import { z } from 'zod';

function getTeamIdFromUrl(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split('/');
  return segments[segments.length - 4];
}

const createAdvisorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  specialty: z.string().optional()
});

// POST /api/teams/[id]/members/create - Create new advisor and link to team
async function handlePost(req: NextRequest, tenantId: string, user: User) {
  try {
    const teamId = getTeamIdFromUrl(req);
    const body = createAdvisorSchema.parse(await req.json());

    const team = await prisma.team.findFirst({
      where: { id: teamId, tenantId, deletedAt: null }
    });

    if (!team) {
      return apiError('Equipe não encontrada', 404);
    }

    // Create person first
    const person = await prisma.person.create({
      data: {
        tenantId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null
      }
    });

    // Create advisor linked to team
    const advisor = await prisma.advisor.create({
      data: {
        tenantId,
        personId: person.id,
        teamId,
        role: body.role || null,
        specialty: body.specialty || null,
        status: 'ACTIVE'
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
      }
    });

    await auditLog({
      tenantId,
      userId: user.id,
      action: 'CREATE_MEMBER',
      entityType: 'team',
      entityId: teamId,
      newValues: { advisorId: advisor.id, personName: body.name }
    });

    return apiResponse(advisor, 'Assessor criado e adicionado à equipe', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError('Dados inválidos: ' + error.issues.map(e => e.message).join(', '), 400);
    }
    console.error('Error creating team member:', error);
    return apiError('Erro ao criar assessor', 500);
  }
}

export const POST = withAuth(handlePost, { module: 'teams', action: 'update' });

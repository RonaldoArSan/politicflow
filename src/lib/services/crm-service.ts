import prisma from '@/lib/prisma';
import { CrmPipelineStage } from '@prisma/client';
import { z } from 'zod';

export const crmFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  stage: z.nativeEnum(CrmPipelineStage).optional(),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  region: z.string().optional(),
});

export type CrmFilters = z.infer<typeof crmFiltersSchema>;

export class CRMService {
  /**
   * Listar contatos com filtros
   */
  static async list(tenantId: string, filters: CrmFilters) {
    const { page, limit, search, stage, region } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      person: {
        tenantId,
      },
    };

    if (search) {
      where.person.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { neighborhood: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (stage) {
      where.stage = stage;
    }

    if (region) {
      where.person.address = { contains: region, mode: 'insensitive' };
    }

    const [contacts, total] = await Promise.all([
      prisma.crmStage.findMany({
        where,
        include: {
          person: true,
          interactions: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.crmStage.count({ where }),
    ]);

    return {
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Criar novo contato
   */
  static async create(
    data: {
      name: string;
      phone?: string;
      email?: string;
      role?: string;
      neighborhood?: string;
      city?: string;
      impact?: 'LOW' | 'MEDIUM' | 'HIGH';
      observations?: string;
    },
    tenantId: string,
    userId: string
  ) {
    // Verificar duplicata por telefone
    if (data.phone) {
      const existingPerson = await prisma.person.findFirst({
        where: {
          tenantId,
          phone: data.phone,
        },
      });

      if (existingPerson) {
        throw new Error('Já existe um contato com este telefone');
      }
    }

    // Criar Person
    const person = await prisma.person.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        occupation: data.role,
        neighborhood: data.neighborhood,
        city: data.city,
        notes: data.observations,
      },
    });

    // Criar CrmStage
    const crmStage = await prisma.crmStage.create({
      data: {
        personId: person.id,
        stage: 'NEW_CONTACT',
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
      include: {
        person: true,
        interactions: true,
      },
    });

    // Registrar primeira interação
    await prisma.crmInteraction.create({
      data: {
        crmStageId: crmStage.id,
        type: 'NEW_CONTACT',
        description: `Novo contato adicionado: ${data.name}`,
      },
    });

    // Registrar em auditoria
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        entityType: 'CrmStage',
        entityId: crmStage.id,
        action: 'CREATE',
        newValues: JSON.stringify({ person, crmStage }),
      },
    });

    return {
      id: crmStage.id,
      personId: person.id,
      name: person.name,
      phone: person.phone,
      email: person.email,
      role: person.occupation,
      neighborhood: person.neighborhood,
      city: person.city,
      stage: crmStage.stage,
      impact: 'MEDIUM' as const,
      observations: data.observations,
      lastInteraction: new Date(),
      nextFollowUp: crmStage.nextFollowUp,
      createdAt: crmStage.createdAt,
    };
  }

  /**
   * Atualizar contato
   */
  static async update(
    id: string,
    data: Partial<{
      name: string;
      phone: string;
      email: string;
      role: string;
      neighborhood: string;
      city: string;
      observations: string;
    }>,
    tenantId: string,
    userId: string
  ) {
    const crmStage = await prisma.crmStage.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!crmStage || crmStage.person.tenantId !== tenantId) {
      throw new Error('Contato não encontrado');
    }

    const oldValues = { ...crmStage.person };

    // Atualizar Person
    const updatedPerson = await prisma.person.update({
      where: { id: crmStage.person.id },
      data: {
        name: data.name || crmStage.person.name,
        phone: data.phone || crmStage.person.phone,
        email: data.email || crmStage.person.email,
        occupation: data.role || crmStage.person.occupation,
        neighborhood: data.neighborhood || crmStage.person.neighborhood,
        city: data.city || crmStage.person.city,
        notes: data.observations || crmStage.person.notes,
      },
    });

    // Atualizar CrmStage
    const updatedCrmStage = await prisma.crmStage.update({
      where: { id },
      data: { updatedAt: new Date() },
      include: { person: true, interactions: { take: 1, orderBy: { date: 'desc' } } },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        entityType: 'CrmStage',
        entityId: id,
        action: 'UPDATE',
        oldValues: JSON.stringify(oldValues),
        newValues: JSON.stringify(updatedPerson),
      },
    });

    return updatedCrmStage;
  }

  /**
   * Deletar contato
   */
  static async delete(id: string, tenantId: string, userId: string) {
    const crmStage = await prisma.crmStage.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!crmStage || crmStage.person.tenantId !== tenantId) {
      throw new Error('Contato não encontrado');
    }

    // Auditoria
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        entityType: 'CrmStage',
        entityId: id,
        action: 'DELETE',
        oldValues: JSON.stringify(crmStage),
      },
    });

    // Deletar CrmStage (vai deletar CrmInteractions em cascata)
    await prisma.crmStage.delete({ where: { id } });

    // Deletar Person
    await prisma.person.delete({ where: { id: crmStage.personId } });
  }

  /**
   * Mover contato entre fases
   */
  static async moveStage(
    id: string,
    newStage: CrmPipelineStage,
    tenantId: string,
    userId: string
  ) {
    const crmStage = await prisma.crmStage.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!crmStage || crmStage.person.tenantId !== tenantId) {
      throw new Error('Contato não encontrado');
    }

    const oldStage = crmStage.stage;

    // Atualizar CrmStage
    const updated = await prisma.crmStage.update({
      where: { id },
      data: {
        stage: newStage,
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: { person: true, interactions: { take: 1, orderBy: { date: 'desc' } } },
    });

    // Registrar interação
    await prisma.crmInteraction.create({
      data: {
        crmStageId: id,
        type: 'STAGE_CHANGE',
        description: `Contato movido de "${oldStage}" para "${newStage}"`,
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        entityType: 'CrmStage',
        entityId: id,
        action: 'STAGE_CHANGE',
        oldValues: JSON.stringify({ stage: oldStage }),
        newValues: JSON.stringify({ stage: newStage }),
      },
    });

    return updated;
  }

  /**
   * Registrar interação
   */
  static async recordInteraction(
    crmStageId: string,
    data: {
      type: string;
      description: string;
      date?: Date;
    },
    tenantId: string
  ) {
    const crmStage = await prisma.crmStage.findUnique({
      where: { id: crmStageId },
      include: { person: true },
    });

    if (!crmStage || crmStage.person.tenantId !== tenantId) {
      throw new Error('Contato não encontrado');
    }

    const interaction = await prisma.crmInteraction.create({
      data: {
        crmStageId,
        type: data.type,
        description: data.description,
        date: data.date || new Date(),
      },
    });

    // Atualizar CrmStage com nextFollowUp
    await prisma.crmStage.update({
      where: { id: crmStageId },
      data: {
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return interaction;
  }

  /**
   * Listar interações
   */
  static async getInteractions(crmStageId: string, tenantId: string) {
    const crmStage = await prisma.crmStage.findUnique({
      where: { id: crmStageId },
      include: { person: true },
    });

    if (!crmStage || crmStage.person.tenantId !== tenantId) {
      throw new Error('Contato não encontrado');
    }

    return prisma.crmInteraction.findMany({
      where: { crmStageId },
      orderBy: { date: 'desc' },
    });
  }
}

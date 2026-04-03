import { z } from 'zod';
import prisma from '../prisma';
import { auditLog } from '../api-helpers';

export const createScheduleBaseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().optional(),
  type: z.enum(['PUBLIC_EVENT', 'INTERNAL_MEETING', 'INTERVIEW', 'VISIT', 'RECORDING', 'TRAVEL', 'OTHER']),
  startDate: z.string().datetime('Data de início inválida'),
  endDate: z.string().datetime('Data de fim inválida').optional(),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  responsibleName: z.string().optional(),
  briefing: z.string().optional(),
  isPublic: z.boolean().default(false),
  participants: z.array(z.string()).default([]),
  checklist: z.record(z.string(), z.unknown()).optional(),
  candidateId: z.string().uuid().optional()
});

export const createScheduleSchema = createScheduleBaseSchema.refine((data) => {
  if (data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
    return false;
  }
  return true;
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['endDate']
});

export const updateScheduleSchema = createScheduleBaseSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED']).optional(),
  id: z.string().uuid('ID inválido').optional()
}).refine((data) => {
  if (data.endDate && data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
    return false;
  }
  return true;
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['endDate']
});

export const scheduleFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  status: z.preprocess((val) => (val === "" ? undefined : val), z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED']).optional()),
  type: z.preprocess((val) => (val === "" ? undefined : val), z.enum(['PUBLIC_EVENT', 'INTERNAL_MEETING', 'INTERVIEW', 'VISIT', 'RECORDING', 'TRAVEL', 'OTHER']).optional()),
  startDate: z.preprocess((val) => (val === "" ? undefined : val), z.string().datetime().optional()),
  endDate: z.preprocess((val) => (val === "" ? undefined : val), z.string().datetime().optional()),
  candidateId: z.preprocess((val) => (val === "" ? undefined : val), z.string().uuid().optional()),
  isPublic: z.preprocess((val) => (val === "true" ? true : val === "false" ? false : undefined), z.boolean().optional())
});

export class ScheduleService {
  static async create(data: z.infer<typeof createScheduleSchema>, tenantId: string, userId: string) {
    // Validar se candidate pertence ao tenant (se fornecido)
    if (data.candidateId) {
      await this.validateCandidateAccess(data.candidateId, tenantId);
    }

    // Preparar dados
    const scheduleData = {
      ...data,
      tenantId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: 'SCHEDULED' as const,
      createdById: userId,
      checklist: data.checklist as object ?? null,
    };

    // Criar registro
    const schedule = await prisma.schedule.create({
      data: scheduleData,
      include: {
        candidate: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Auditar
    await auditLog({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'schedule',
      entityId: schedule.id,
      newValues: schedule,
    });

    return schedule;
  }

  static async list(tenantId: string, filters: z.infer<typeof scheduleFiltersSchema>) {
    const { page, limit, search, status, type, startDate, endDate, candidateId, isPublic } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...(type && { type }),
      ...(candidateId && { candidateId }),
      ...(isPublic !== undefined && { isPublic }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { location: { contains: search, mode: 'insensitive' as const } },
          { responsibleName: { contains: search, mode: 'insensitive' as const } }
        ]
      }),
      ...(startDate && endDate && {
        OR: [
          {
            startDate: { gte: new Date(startDate), lte: new Date(endDate) }
          },
          {
            endDate: { gte: new Date(startDate), lte: new Date(endDate) }
          }
        ]
      })
    };

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          candidate: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } }
        }
      }),
      prisma.schedule.count({ where })
    ]);

    return {
      data: schedules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getById(id: string, tenantId: string) {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      },
      include: {
        candidate: { select: { id: true, name: true, party: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    if (!schedule) {
      throw new Error('Agenda não encontrada');
    }

    return schedule;
  }

  static async update(id: string, data: Omit<z.infer<typeof updateScheduleSchema>, 'id'>, tenantId: string, userId: string) {
    // Buscar dados antigos
    const oldSchedule = await prisma.schedule.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldSchedule) {
      throw new Error('Agenda não encontrada');
    }

    // Validar candidate se fornecido
    if (data.candidateId) {
      await this.validateCandidateAccess(data.candidateId, tenantId);
    }

    // Preparar dados de atualização
    const updateData = {
      ...data,
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.checklist !== undefined && { checklist: data.checklist as object }),
      ...(data.candidateId !== undefined && { candidateId: data.candidateId }),
    };

    // Atualizar
    const updatedSchedule = await prisma.schedule.update({
      where: { id, tenantId },
      data: updateData,
      include: {
        candidate: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Auditar
    await auditLog({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'schedule',
      entityId: id,
      oldValues: oldSchedule,
      newValues: updatedSchedule,
    });

    return updatedSchedule;
  }

  static async delete(id: string, tenantId: string, userId: string) {
    // Buscar dados antigos
    const oldSchedule = await prisma.schedule.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldSchedule) {
      throw new Error('Agenda não encontrada');
    }

    // Soft delete
    await prisma.schedule.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });

    // Auditar
    await auditLog({
      tenantId,
      userId,
      action: 'DELETE',
      entityType: 'schedule',
      entityId: id,
      oldValues: oldSchedule,
    });
  }

  static async updateStatus(id: string, status: string, tenantId: string, userId: string) {
    const validStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'];

    if (!validStatuses.includes(status)) {
      throw new Error('Status inválido');
    }

    // Buscar dados antigos
    const oldSchedule = await prisma.schedule.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldSchedule) {
      throw new Error('Agenda não encontrada');
    }

    // Atualizar status
    const updatedSchedule = await prisma.schedule.update({
      where: { id, tenantId },
      data: { status: status as import('@prisma/client').ScheduleStatus },
      include: {
        candidate: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    // Auditar
    await auditLog({
      tenantId,
      userId,
      action: 'STATUS_UPDATE',
      entityType: 'schedule',
      entityId: id,
      oldValues: { status: oldSchedule.status },
      newValues: { status },
    });

    return updatedSchedule;
  }

  private static async validateCandidateAccess(candidateId: string, tenantId: string) {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        tenantId,
        deletedAt: null
      }
    });

    if (!candidate) {
      throw new Error('Candidato não encontrado ou não pertence ao tenant');
    }
  }
}
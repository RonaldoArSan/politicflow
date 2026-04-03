import { z } from 'zod';
import prisma from '../prisma';
import { auditLog } from '../audit';
import { PlanLimits } from '../billing-limits';

export const createCommitteeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  type: z.enum(['CENTRAL', 'REGIONAL']),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  neighborhood: z.string().optional(),
  region: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  responsibleName: z.string().optional(),
  parentId: z.string().uuid('ID do comitê pai inválido').optional(),
  observations: z.string().optional()
});

export const updateCommitteeSchema = createCommitteeSchema.partial().extend({
  id: z.string().uuid('ID inválido').optional()
});

export const committeeFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.preprocess((val) => (val === "" ? undefined : val), z.string().optional()),
  status: z.preprocess((val) => (val === "" ? undefined : val), z.enum(['ACTIVE', 'INACTIVE']).optional()),
  type: z.preprocess((val) => (val === "" ? undefined : val), z.enum(['CENTRAL', 'REGIONAL']).optional())
});

export class CommitteeService {
  static async create(data: z.infer<typeof createCommitteeSchema>, tenantId: string, userId: string) {
    // 1. Validar limites do plano
    await PlanLimits.enforceLimit(tenantId, 'committees', 'Faça upgrade do plano para criar mais comitês.');

    // 2. Preparar dados
    const committeeData = {
      ...data,
      tenantId,
      status: 'ACTIVE' as const
    };

    // 2. Validar regras de negócio
    await this.validateBusinessRules(committeeData, tenantId);

    // 3. Criar registro
    const committee = await prisma.committee.create({
      data: committeeData,
      include: {
        parent: { select: { id: true, name: true } }
      }
    });

    // 4. Auditar
    await auditLog(tenantId, userId, 'committee', 'CREATE', committee.id, undefined, committee);

    return committee;
  }

  static async list(tenantId: string, filters: z.infer<typeof committeeFiltersSchema>) {
    const { page, limit, search, status, type } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(status && { status }),
      ...(type && { type }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { responsibleName: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };

    const [committees, total] = await Promise.all([
      prisma.committee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { children: true } }
        }
      }),
      prisma.committee.count({ where })
    ]);

    return {
      data: committees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getById(id: string, tenantId: string) {
    const committee = await prisma.committee.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          where: { deletedAt: null },
          select: { id: true, name: true, status: true, type: true }
        },
        _count: { select: { children: true } }
      }
    });

    if (!committee) {
      throw new Error('Comitê não encontrado');
    }

    return committee;
  }

  static async update(id: string, data: Omit<z.infer<typeof updateCommitteeSchema>, 'id'>, tenantId: string, userId: string) {
    // Buscar dados antigos para auditoria
    const oldCommittee = await prisma.committee.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldCommittee) {
      throw new Error('Comitê não encontrado');
    }

    // Preparar dados de atualização
    const updateData = { ...data };

    // Validar regras de negócio se necessário
    if (updateData.parentId) {
      await this.validateParentHierarchy(id, updateData.parentId, tenantId);
    }

    // Atualizar
    const updatedCommittee = await prisma.committee.update({
      where: { id, tenantId },
      data: updateData,
      include: {
        parent: { select: { id: true, name: true } }
      }
    });

    // Auditar
    await auditLog(tenantId, userId, 'committee', 'UPDATE', id, oldCommittee, updatedCommittee);

    return updatedCommittee;
  }

  static async delete(id: string, tenantId: string, userId: string) {
    // Verificar se tem filhos ativos
    const childrenCount = await prisma.committee.count({
      where: {
        parentId: id,
        tenantId,
        deletedAt: null
      }
    });

    if (childrenCount > 0) {
      throw new Error('Não é possível excluir um comitê que possui subcomitês ativos');
    }

    // Buscar dados antigos
    const oldCommittee = await prisma.committee.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!oldCommittee) {
      throw new Error('Comitê não encontrado');
    }

    // Soft delete
    await prisma.committee.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });

    // Auditar
    await auditLog(tenantId, userId, 'committee', 'DELETE', id, oldCommittee);
  }

  private static async validateBusinessRules(data: z.infer<typeof createCommitteeSchema> & { tenantId: string; status: 'ACTIVE' }, tenantId: string) {
    // Validar unicidade do nome (por tenant)
    const existing = await prisma.committee.findFirst({
      where: {
        name: data.name,
        tenantId,
        deletedAt: null
      }
    });

    if (existing) {
      throw new Error('Já existe um comitê com este nome');
    }

    // Validar hierarquia se parentId fornecido
    if (data.parentId) {
      await this.validateParentHierarchy(null, data.parentId, tenantId);
    }
  }

  private static async validateParentHierarchy(childId: string | null, parentId: string, tenantId: string) {
    // Verificar se parent existe e pertence ao tenant
    const parent = await prisma.committee.findFirst({
      where: {
        id: parentId,
        tenantId,
        deletedAt: null
      }
    });

    if (!parent) {
      throw new Error('Comitê pai não encontrado');
    }

    // Evitar ciclos na hierarquia
    if (childId && await this.wouldCreateCycle(childId, parentId, tenantId)) {
      throw new Error('Hierarquia circular não permitida');
    }
  }

  private static async wouldCreateCycle(childId: string, parentId: string, tenantId: string): Promise<boolean> {
    // Verificar se o parent é descendente do child
    const descendants = await this.getAllDescendants(childId, tenantId);
    return descendants.includes(parentId);
  }

  private static async getAllDescendants(committeeId: string, tenantId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [committeeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await prisma.committee.findMany({
        where: {
          parentId: currentId,
          tenantId,
          deletedAt: null
        },
        select: { id: true }
      });

      for (const child of children) {
        descendants.push(child.id);
        queue.push(child.id);
      }
    }

    return descendants;
  }
}
import prisma from './prisma';

export class PlanLimitsError extends Error {
  constructor(
    message: string,
    public limitType?: string,
    public plan?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PlanLimitsError';
  }
}

export class PlanLimits {
  static async getTenantPlan(tenantId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true }
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new PlanLimitsError('Tenant sem plano ativo');
    }

    return subscription.plan;
  }

  static async canCreateUser(tenantId: string): Promise<boolean> {
    const plan = await this.getTenantPlan(tenantId);
    if (plan.maxUsers === -1) return true; // Ilimitado

    const currentUsers = await prisma.user.count({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true
      }
    });

    return currentUsers < plan.maxUsers;
  }

  static async canCreateCommittee(tenantId: string): Promise<boolean> {
    const plan = await this.getTenantPlan(tenantId);
    if (plan.maxCommittees === -1) return true;

    const currentCommittees = await prisma.committee.count({
      where: {
        tenantId,
        deletedAt: null,
        status: 'ACTIVE'
      }
    });

    return currentCommittees < plan.maxCommittees;
  }

  static async canUseFeature(tenantId: string, feature: string): Promise<boolean> {
    const plan = await this.getTenantPlan(tenantId);

    // Enterprise tem tudo
    if (plan.slug === 'enterprise') return true;

    // Verificar se feature está habilitada
    const features = Array.isArray(plan.features) ? plan.features : [];
    return features.some(
      (f) => typeof f === 'object' && f !== null && (f as Record<string, unknown>).feature === feature && (f as Record<string, unknown>).enabled
    );
  }

  static async checkMonthlyActionsLimit(tenantId: string) {
    const plan = await this.getTenantPlan(tenantId);
    if (plan.maxActionsPerMonth === -1) {
      return { allowed: true, used: 0, limit: -1 };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const actionsThisMonth = await prisma.auditLog.count({
      where: {
        tenantId,
        entityType: 'political_action',
        action: 'CREATE',
        createdAt: { gte: startOfMonth }
      }
    });

    return {
      allowed: actionsThisMonth < plan.maxActionsPerMonth,
      used: actionsThisMonth,
      limit: plan.maxActionsPerMonth
    };
  }

  static async enforceLimit(
    tenantId: string,
    limitType: 'users' | 'committees' | 'actions',
    operation: string
  ): Promise<void> {
    let allowed = false;

    switch (limitType) {
      case 'users':
        allowed = await this.canCreateUser(tenantId);
        break;
      case 'committees':
        allowed = await this.canCreateCommittee(tenantId);
        break;
      case 'actions':
        const actionLimit = await this.checkMonthlyActionsLimit(tenantId);
        allowed = actionLimit.allowed;
        break;
    }

    if (!allowed) {
      const plan = await this.getTenantPlan(tenantId);
      throw new PlanLimitsError(
        `Limite de ${limitType} do plano '${plan.name}' atingido. ${operation}`,
        limitType,
        plan
      );
    }
  }

  static async getUsageStats(tenantId: string) {
    const plan = await this.getTenantPlan(tenantId);

    // Usuários ativos
    const activeUsers = await prisma.user.count({
      where: { tenantId, deletedAt: null, isActive: true }
    });

    // Comitês ativos
    const activeCommittees = await prisma.committee.count({
      where: { tenantId, deletedAt: null, status: 'ACTIVE' }
    });

    // Ações do mês
    const actionStats = await this.checkMonthlyActionsLimit(tenantId);

    return {
      plan: {
        name: plan.name,
        limits: {
          maxUsers: plan.maxUsers,
          maxCommittees: plan.maxCommittees,
          maxActionsMonth: plan.maxActionsPerMonth
        }
      },
      usage: {
        users: activeUsers,
        committees: activeCommittees,
        actionsThisMonth: actionStats.used
      },
      percentages: {
        users: plan.maxUsers === -1 ? 0 : (activeUsers / plan.maxUsers) * 100,
        committees: plan.maxCommittees === -1 ? 0 : (activeCommittees / plan.maxCommittees) * 100,
        actions: actionStats.limit === -1 ? 0 : (actionStats.used / actionStats.limit) * 100
      }
    };
  }
}
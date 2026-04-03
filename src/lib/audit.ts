import prisma from './prisma';

export interface AuditData {
  tenantId: string;
  userId: string | null;
  entity: string;
  action: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  ip?: string;
  userAgent?: string;
  timestamp?: Date;
}

export async function auditLog(
  tenantId: string,
  userId: string | null,
  entity: string,
  action: string,
  entityId: string,
  oldData?: unknown,
  newData?: unknown,
  req?: Request
): Promise<void> {
  try {
    const ip = req ? getClientIP(req) : null;
    const userAgent = req ? req.headers.get('user-agent') : null;

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType: entity,
        entityId,
        oldValues: oldData ?? undefined,
        newValues: newData ?? undefined,
        ipAddress: ip ?? undefined,
        userAgent,
        createdAt: new Date()
      }
    });
  } catch (error) {
    // Log do erro de auditoria (não deve quebrar o fluxo principal)
    console.error('Audit log error:', error);
  }
}

function getClientIP(req: Request): string | null {
  // Tentar vários headers para obter IP real
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const clientIP = req.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  return null;
}

// Helpers para auditoria automática
export const AUDIT_EVENTS = {
  // Auth
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // CRUD
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE',

  // Business
  STATUS_CHANGE: 'STATUS_CHANGE',
  ROLE_CHANGE: 'ROLE_CHANGE',
  PLAN_CHANGE: 'PLAN_CHANGE',
  EXPORT: 'EXPORT',

  // Security
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED'
} as const;

export function createAuditMiddleware(entity: string) {
  return async (
    operation: () => Promise<unknown>,
    action: string,
    tenantId: string,
    userId: string | null,
    entityId: string,
    req?: Request
  ) => {
    let oldData = null;
    let newData = null;

    // Para updates, buscar dados antigos
    if (action === AUDIT_EVENTS.UPDATE) {
      try {
        const model = getPrismaModel(entity);
        oldData = await (prisma as unknown as Record<string, { findUnique: (args: unknown) => Promise<unknown> }>)[model].findUnique({
          where: { id: entityId, tenantId }
        });
      } catch (error) {
        console.error('Error fetching old data for audit:', error);
      }
    }

    // Executar operação
    const result = await operation();

    // Para creates e updates, capturar newData
    if (action === AUDIT_EVENTS.CREATE || action === AUDIT_EVENTS.UPDATE) {
      newData = result;
    }

    // Auditar
    await auditLog(tenantId, userId, entity, action, entityId, oldData, newData, req);

    return result;
  };
}

function getPrismaModel(entity: string): string {
  const modelMap: Record<string, string> = {
    committee: 'committee',
    schedule: 'schedule',
    task: 'task',
    demand: 'demand',
    user: 'user',
    role: 'role'
  };

  return modelMap[entity] || entity;
}
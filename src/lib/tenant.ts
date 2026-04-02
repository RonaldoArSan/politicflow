import { NextRequest } from 'next/server';
import { verifyAccessToken, type JwtPayload } from './auth';

/**
 * Extracts tenant context from the authenticated request.
 * All data queries MUST be scoped by tenantId.
 */
export function getTenantFromRequest(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}

/**
 * Creates a tenant-scoped where clause.
 * Use this in all Prisma queries to ensure data isolation.
 */
export function tenantWhere(tenantId: string, additionalWhere?: Record<string, unknown>) {
  return {
    tenantId,
    deletedAt: null,
    ...additionalWhere,
  };
}

/**
 * Validates that the requesting user belongs to the target tenant.
 */
export function validateTenantAccess(userTenantId: string, targetTenantId: string): boolean {
  return userTenantId === targetTenantId;
}

import { NextRequest } from 'next/server';
import { getTokenFromRequest, verifyToken } from './auth';
import prisma from './prisma';
import type { User, Committee, Schedule } from '@prisma/client';

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  status: string;
}

/**
 * Extracts tenant context from the authenticated request.
 * All data queries MUST be scoped by tenantId.
 */
export async function getTenantFromRequest(req: NextRequest): Promise<TenantContext> {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Error('Token not found');
  }

  const payload = verifyToken(token);

  const tenant = await prisma.tenant.findUnique({
    where: { id: payload.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (tenant.status !== 'ACTIVE') {
    throw new Error('Tenant not active');
  }

  return tenant;
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

/**
 * Validates user access within tenant and checks if user is active.
 */
export async function validateUserInTenant(userId: string, tenantId: string): Promise<User> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
      deletedAt: null,
      isActive: true
    }
  });

  if (!user) {
    throw new Error('User not found in tenant or inactive');
  }

  return user;
}

/**
 * Gets tenant by slug (useful for multi-tenant routing)
 */
export async function getTenantBySlug(slug: string): Promise<TenantContext & { domain: string | null }> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      domain: true
    }
  });

  if (!tenant || tenant.status !== 'ACTIVE') {
    throw new Error('Tenant not found or inactive');
  }

  return tenant;
}

/**
 * Ensures tenant isolation for database operations
 */
export function createTenantScopedPrisma(tenantId: string) {
  return {
    // User operations
    findUser: (where: Record<string, unknown>) => prisma.user.findFirst({
      where: { ...where, tenantId, deletedAt: null }
    }),

    findUsers: (where: Record<string, unknown> = {}, options: { orderBy?: Record<string, unknown>; skip?: number; take?: number } = {}) => prisma.user.findMany({
      where: { ...where, tenantId, deletedAt: null },
      ...options
    }),

    // Committee operations
    findCommittee: (where: Record<string, unknown>) => prisma.committee.findFirst({
      where: where as Parameters<typeof prisma.committee.findFirst>[0] extends { where?: infer W } ? W : never
    }),

    findCommittees: (where: Record<string, unknown> = {}, options: { orderBy?: Record<string, unknown>; skip?: number; take?: number } = {}) => prisma.committee.findMany({
      where: where as Parameters<typeof prisma.committee.findMany>[0] extends { where?: infer W } ? W : never,
      ...options
    }),

    // Schedule operations
    findSchedule: (where: Record<string, unknown>) => prisma.schedule.findFirst({
      where: where as Parameters<typeof prisma.schedule.findFirst>[0] extends { where?: infer W } ? W : never
    }),

    findSchedules: (where: Record<string, unknown> = {}, options: { orderBy?: Record<string, unknown>; skip?: number; take?: number } = {}) => prisma.schedule.findMany({
      where: where as Parameters<typeof prisma.schedule.findMany>[0] extends { where?: infer W } ? W : never,
      ...options
    }),

    // Generic tenant-scoped operations via dynamic access
    create: (model: string, data: Record<string, unknown>) => (prisma as unknown as Record<string, { create: (args: unknown) => Promise<unknown> }>)[model].create({
      data: { ...data, tenantId }
    }),

    update: (model: string, where: Record<string, unknown>, data: Record<string, unknown>) => (prisma as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>)[model].update({
      where: { ...where, tenantId },
      data
    }),

    delete: (model: string, where: Record<string, unknown>) => (prisma as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>)[model].update({
      where: { ...where, tenantId },
      data: { deletedAt: new Date() }
    }),

    findMany: (model: string, where: Record<string, unknown> = {}, options: Record<string, unknown> = {}) => (prisma as unknown as Record<string, { findMany: (args: unknown) => Promise<unknown[]> }>)[model].findMany({
      where: { ...where, tenantId, deletedAt: null },
      ...options
    }),

    findFirst: (model: string, where: Record<string, unknown> = {}, options: Record<string, unknown> = {}) => (prisma as unknown as Record<string, { findFirst: (args: unknown) => Promise<unknown> }>)[model].findFirst({
      where: { ...where, tenantId, deletedAt: null },
      ...options
    }),

    count: (model: string, where: Record<string, unknown> = {}) => (prisma as unknown as Record<string, { count: (args: unknown) => Promise<number> }>)[model].count({
      where: { ...where, tenantId, deletedAt: null }
    })
  };
}

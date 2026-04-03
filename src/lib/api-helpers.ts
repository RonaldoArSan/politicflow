import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, type AccessTokenPayload } from './auth';
import { hasPermission } from './permissions';
import prisma from './prisma';

/**
 * Standard API response wrapper.
 */
export function apiResponse<T>(data: T, messageOrStatus: string | number = '', status = 200, pagination?: Record<string, unknown>) {
  let message: string = '';
  let finalStatus: number = 200;

  if (typeof messageOrStatus === 'number') {
    finalStatus = messageOrStatus;
  } else {
    message = messageOrStatus;
    finalStatus = status;
  }

  const response: Record<string, unknown> = { success: true, data };
  if (message) response.message = message;
  if (pagination) response.pagination = pagination;
  return NextResponse.json(response, { status: finalStatus });
}

export function apiError(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, error: message, errors }, { status });
}

/**
 * Authenticates a request and returns the JWT payload.
 */
export function authenticateRequest(request: NextRequest): AccessTokenPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token) as AccessTokenPayload;
}

export { withAuth } from './middleware';

/**
 * Logs an audit event.
 */
export async function auditLog(params: {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { auditLog: logAudit } = await import('./audit');

  await logAudit(
    params.tenantId,
    params.userId || null,
    params.entityType,
    params.action,
    params.entityId || '',
    params.oldValues,
    params.newValues
  );
}

/**
 * Extracts pagination params from URL search params.
 */
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Creates a paginated response.
 */
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return apiResponse({
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

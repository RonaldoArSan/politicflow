import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, type JwtPayload } from './auth';
import { hasPermission } from './permissions';
import prisma from './prisma';

/**
 * Standard API response wrapper.
 */
export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, error: message, errors }, { status });
}

/**
 * Authenticates a request and returns the JWT payload.
 */
export function authenticateRequest(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyAccessToken(authHeader.substring(7));
}

/**
 * Higher-order handler that enforces authentication + optional permission check.
 */
export function withAuth(
  handler: (request: NextRequest, auth: JwtPayload) => Promise<NextResponse>,
  options?: { module?: string; action?: string }
) {
  return async (request: NextRequest) => {
    const auth = authenticateRequest(request);
    if (!auth) {
      return apiError('Não autorizado', 401);
    }

    if (options?.module && options?.action) {
      if (!hasPermission(auth.roles, options.module, options.action, auth.isSuperAdmin)) {
        return apiError('Sem permissão para esta ação', 403);
      }
    }

    return handler(request, auth);
  };
}

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
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
        newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
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

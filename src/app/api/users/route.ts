import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { apiResponse, apiError, withAuth, getPaginationParams, paginatedResponse, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { AccessTokenPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: AccessTokenPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(role ? {
      userRoles: { some: { role: { slug: role } } },
    } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          select: {
            role: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return paginatedResponse(users, total, page, limit);
}

async function handlePost(request: NextRequest, auth: AccessTokenPayload) {
  const body = await request.json();
  const { name, email, password, phone, roleIds } = body;

  if (!name || !email || !password) {
    return apiError('Nome, e-mail e senha são obrigatórios', 400);
  }

  // Check if email already exists in this tenant
  const existingUser = await prisma.user.findFirst({
    where: { tenantId: auth.tenantId, email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    return apiError('Este e-mail já está cadastrado neste tenant', 400);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      tenantId: auth.tenantId,
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      phone,
      userRoles: roleIds?.length ? {
        create: roleIds.map((roleId: string) => ({ roleId })),
      } : undefined,
    },
    include: {
      userRoles: {
        include: { role: { select: { id: true, name: true, slug: true } } },
      },
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'user',
    entityId: user.id,
    newValues: { name: user.name, email: user.email },
  });

  return apiResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.userRoles.map(ur => ur.role),
  }, 201);
}

export const GET = withAuth(handleGet, { module: 'users', action: 'read' });
export const POST = withAuth(handlePost, { module: 'users', action: 'create' });

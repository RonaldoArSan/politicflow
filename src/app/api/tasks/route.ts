import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiResponse, apiError, withAuth, getPaginationParams, paginatedResponse, auditLog } from '@/lib/api-helpers';
import { tenantWhere } from '@/lib/tenant';
import type { JwtPayload } from '@/lib/auth';

async function handleGet(request: NextRequest, auth: JwtPayload) {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const assigneeId = searchParams.get('assigneeId') || '';

  const where = {
    ...tenantWhere(auth.tenantId),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(status ? { status: status as never } : {}),
    ...(priority ? { priority: priority as never } : {}),
    ...(assigneeId ? { assigneeId } : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return paginatedResponse(tasks, total, page, limit);
}

async function handlePost(request: NextRequest, auth: JwtPayload) {
  const body = await request.json();
  const {
    title, description, assigneeId, priority, dueDate,
    checklist, column, status: taskStatus,
  } = body;

  if (!title) {
    return apiError('Título é obrigatório', 400);
  }

  const task = await prisma.task.create({
    data: {
      tenantId: auth.tenantId,
      title,
      description,
      assigneeId,
      createdById: auth.userId,
      priority: priority || 'MEDIUM',
      status: taskStatus || 'TODO',
      dueDate: dueDate ? new Date(dueDate) : null,
      checklist,
      column: column || 'todo',
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await auditLog({
    tenantId: auth.tenantId,
    userId: auth.userId,
    action: 'CREATE',
    entityType: 'task',
    entityId: task.id,
    newValues: { title, priority, status: taskStatus },
  });

  return apiResponse(task, 201);
}

export const GET = withAuth(handleGet, { module: 'tasks', action: 'read' });
export const POST = withAuth(handlePost, { module: 'tasks', action: 'create' });

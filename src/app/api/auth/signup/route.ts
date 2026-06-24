import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateTokens } from '@/lib/auth';
import { apiResponse, apiError, auditLog } from '@/lib/api-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, name, tenantName, phone } = body;

    // Validate required fields
    if (!email || !password || !confirmPassword || !name || !tenantName) {
      return apiError('E-mail, senha, nome e nome da organização são obrigatórios', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return apiError('E-mail inválido', 400);
    }

    // Validate password strength
    if (password.length < 8) {
      return apiError('Senha deve ter pelo menos 8 caracteres', 400);
    }

    if (password !== confirmPassword) {
      return apiError('Senhas não conferem', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        deletedAt: null,
      },
    });

    if (existingUser) {
      return apiError('Este e-mail já está cadastrado', 409);
    }

    // Create tenant (organization)
    const tenantSlug = tenantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 63); // Slug max length

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (existingTenant) {
      return apiError('Nome de organização já existe. Tente outro.', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Start transaction
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        status: 'ACTIVE',
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: email.toLowerCase().trim(),
        name,
        phone: phone || null,
        passwordHash,
        isActive: true,
        isSuperAdmin: false, // First user gets admin role, not super admin
      },
    });

    // Create admin role if it doesn't exist
    let adminRole = await prisma.role.findFirst({
      where: {
        tenantId: tenant.id,
        slug: 'admin',
      },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Administrador',
          slug: 'admin',
          description: 'Acesso completo',
          isSystem: true,
        },
      });
    }

    // Assign admin role to user
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    // Get user with roles and tenant
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        tenant: true,
      },
    });

    if (!userWithRoles) {
      return apiError('Erro ao criar usuário', 500);
    }

    const roles = userWithRoles.userRoles.map(ur => ur.role.slug);
    const { accessToken, refreshToken } = await generateTokens(userWithRoles, userWithRoles.tenant);

    // Audit log
    await auditLog({
      tenantId: tenant.id,
      userId: user.id,
      action: 'SIGNUP',
      entityType: 'user',
      entityId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return apiResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        roles,
        isSuperAdmin: user.isSuperAdmin,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logo: tenant.logo,
        },
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return apiError('Erro ao criar conta', 500);
  }
}

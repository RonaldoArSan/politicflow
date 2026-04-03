import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'politicflow-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface AccessTokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  permissions: string[];
  type: 'access';
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  tokenId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign({
    userId: payload.userId,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.roles[0] || 'user', // Primary role
    permissions: payload.permissions,
    type: 'access'
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    if (payload.type !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyToken(token: string): AccessTokenPayload | RefreshTokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as AccessTokenPayload | RefreshTokenPayload;
  } catch (error) {
    throw error;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function generateTokens(user: { id: string; email: string; tenantId: string; userRoles: { role: { slug: string } }[] }, tenant: { id: string }) {
  // Buscar permissões do usuário
  const permissions = await getPermissionsForUser(user.id, tenant.id);

  // Access token (15 minutos)
  const accessToken = jwt.sign(
    {
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: user.userRoles[0]?.role.slug || 'user',
      permissions,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Refresh token (7 dias)
  const tokenId = randomBytes(32).toString('hex');
  const refreshToken = jwt.sign(
    {
      userId: user.id,
      tenantId: tenant.id,
      tokenId,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Hash do refresh token para armazenamento seguro
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // Salvar refresh token
  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return { accessToken, refreshToken };
}

export async function getPermissionsForUser(userId: string, tenantId: string): Promise<string[]> {
  // Buscar papéis do usuário
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true }
  });

  // Coletar todas as permissões
  const allPermissions = new Set<string>();

  for (const userRole of userRoles) {
    const rolePermissions = await getPermissionsForRole(userRole.roleId);
    rolePermissions.forEach(perm => allPermissions.add(perm));
  }

  return Array.from(allPermissions);
}

async function getPermissionsForRole(roleId: string): Promise<string[]> {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true }
  });

  return rolePermissions.map(rp => `${rp.permission.module}:${rp.permission.action}`);
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function validateRefreshToken(token: string) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!refreshToken) return null;
  if (refreshToken.revokedAt) return null;
  if (refreshToken.expiresAt < new Date()) return null;

  return refreshToken;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.update({
    where: { token },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

export async function getUserWithRoles(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

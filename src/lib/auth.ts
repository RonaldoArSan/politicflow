import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'politicflow-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  isSuperAdmin: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
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

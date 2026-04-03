import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'politicflow-dev-secret-change-in-production';

const DEMO_TENANT_ID = 'demo-tenant-001';
const DEMO_USER_ID = 'demo-user-001';

export async function POST() {
  const permissions = ['*:*'];

  const accessToken = jwt.sign(
    {
      userId: DEMO_USER_ID,
      tenantId: DEMO_TENANT_ID,
      email: 'demo@procampanha.com',
      role: 'tenant_admin',
      permissions,
      type: 'access',
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  const refreshToken = jwt.sign(
    {
      userId: DEMO_USER_ID,
      tenantId: DEMO_TENANT_ID,
      tokenId: 'demo-refresh',
      type: 'refresh',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: DEMO_USER_ID,
        name: 'Carlos Mendes',
        email: 'demo@procampanha.com',
        avatar: null,
        roles: ['tenant_admin'],
        isSuperAdmin: false,
        tenant: {
          id: DEMO_TENANT_ID,
          name: 'Campanha Prefeito 2026',
          slug: 'campanha-prefeito-2026',
          logo: null,
        },
      },
      accessToken,
      refreshToken,
    },
  });
}

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({ datasource: { url: process.env.DATABASE_URL } });

async function main() {
  console.log('🌱 Starting seed...');

  // ── Plans ──────────────────────────────────────────────────
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: 'vereadores-prefeitos' },
      update: {},
      create: {
        name: 'Vereadores e Prefeitos',
        slug: 'vereadores-prefeitos',
        description: 'Plano ideal para campanhas municipais',
        price: 299.90,
        maxUsers: 10,
        maxCommittees: 5,
        maxActionsPerMonth: 100,
        maxStorageMb: 1024,
        premiumModules: ['dashboard', 'agenda', 'committees', 'actions', 'demands', 'tasks'],
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'deputados-estaduais' },
      update: {},
      create: {
        name: 'Deputados Estaduais',
        slug: 'deputados-estaduais',
        description: 'Plano para campanhas estaduais',
        price: 499.90,
        maxUsers: 25,
        maxCommittees: 15,
        maxActionsPerMonth: 300,
        maxStorageMb: 5120,
        premiumModules: ['dashboard', 'agenda', 'committees', 'actions', 'demands', 'tasks', 'leaders', 'crm', 'reports'],
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'deputados-federais-governadores' },
      update: {},
      create: {
        name: 'Deputados Federais e Governadores',
        slug: 'deputados-federais-governadores',
        description: 'Plano para campanhas de grande porte',
        price: 799.00,
        maxUsers: 50,
        maxCommittees: 30,
        maxActionsPerMonth: 500,
        maxStorageMb: 10240,
        premiumModules: ['*'],
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'senadores-presidentes' },
      update: {},
      create: {
        name: 'Senadores e Presidentes',
        slug: 'senadores-presidentes',
        description: 'Plano enterprise sem limites',
        price: 1299.00,
        maxUsers: 9999,
        maxCommittees: 9999,
        maxActionsPerMonth: 99999,
        maxStorageMb: 102400,
        premiumModules: ['*'],
      },
    }),
  ]);
  console.log(`✅ Created ${plans.length} plans`);

  // ── Tenant ─────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'campanha-prefeito-2026' },
    update: {},
    create: {
      id: 'demo-tenant-001',
      name: 'Campanha Prefeito 2026',
      slug: 'campanha-prefeito-2026',
      status: 'ACTIVE',
      settings: { timezone: 'America/Sao_Paulo', language: 'pt-BR' },
    },
  });
  console.log(`✅ Tenant: ${tenant.name}`);

  // ── Subscription ───────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      planId: plans[2].id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ── Roles ──────────────────────────────────────────────────
  const roleDefinitions = [
    { slug: 'tenant_admin', name: 'Administrador', description: 'Controle total do tenant' },
    { slug: 'coordenador_geral', name: 'Coordenador Geral', description: 'Gestão operacional ampla' },
    { slug: 'chefe_gabinete', name: 'Chefe de Gabinete', description: 'Operação institucional' },
    { slug: 'coordenador_comite', name: 'Coordenador de Comitê', description: 'Comitês e mobilização' },
    { slug: 'operador_agenda', name: 'Operador de Agenda', description: 'Compromissos e calendário' },
    { slug: 'assessor', name: 'Assessor', description: 'Atuação operacional limitada' },
    { slug: 'leitura', name: 'Somente Leitura', description: 'Acesso somente leitura' },
  ];

  const roles = [];
  for (const rd of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: rd.slug } },
      update: {},
      create: { tenantId: tenant.id, ...rd },
    });
    roles.push(role);
  }
  console.log(`✅ Created ${roles.length} roles`);

  // ── Users ──────────────────────────────────────────────────
  const hash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@politicflow.com' } },
    update: {},
    create: {
      id: 'demo-user-001',
      tenantId: tenant.id,
      email: 'admin@politicflow.com',
      passwordHash: hash,
      name: 'Carlos Mendes',
      phone: '(11) 91234-5678',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roles[0].id } },
    update: {},
    create: { userId: admin.id, roleId: roles[0].id },
  });

  const extraUsers = [
    { name: 'Maria Santos', email: 'maria@politicflow.com', role: 'coordenador_geral' },
    { name: 'Ana Lima', email: 'ana@politicflow.com', role: 'chefe_gabinete' },
    { name: 'Pedro Alves', email: 'pedro@politicflow.com', role: 'coordenador_comite' },
    { name: 'Fernanda Costa', email: 'fernanda@politicflow.com', role: 'assessor' },
  ];

  for (const u of extraUsers) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
      update: {},
      create: { tenantId: tenant.id, email: u.email, passwordHash: hash, name: u.name },
    });
    const r = roles.find(r => r.slug === u.role);
    if (r) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: r.id } },
        update: {},
        create: { userId: user.id, roleId: r.id },
      });
    }
  }
  console.log('✅ Created 5 users');

  // ── Committees ─────────────────────────────────────────────
  await prisma.committee.createMany({
    data: [
      { tenantId: tenant.id, name: 'Comitê Central Campanha', type: 'CENTRAL', city: 'São Paulo', neighborhood: 'Centro', responsibleName: 'Maria Santos', status: 'ACTIVE' },
      { tenantId: tenant.id, name: 'Comitê Zona Norte', type: 'REGIONAL', city: 'São Paulo', neighborhood: 'Santana', responsibleName: 'Carlos Oliveira', status: 'ACTIVE' },
      { tenantId: tenant.id, name: 'Comitê Zona Sul', type: 'REGIONAL', city: 'São Paulo', neighborhood: 'Campo Belo', responsibleName: 'Ana Lima', status: 'ACTIVE' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created 3 committees');

  // ── Candidate ──────────────────────────────────────────────
  await prisma.candidate.create({
    data: {
      tenantId: tenant.id,
      name: 'Dr. Roberto Mendonça',
      position: 'Prefeito',
      party: 'PSD',
      coalition: 'Unidos pela Cidade',
      municipality: 'São Paulo',
      state: 'SP',
      bio: 'Médico, empresário e líder comunitário com 20 anos de atuação social.',
    },
  });
  console.log('✅ Created candidate');

  console.log('\n🎉 Seed completed!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: admin@politicflow.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

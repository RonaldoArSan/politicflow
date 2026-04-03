import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL || ''),
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
}).$extends(withAccelerate());

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
  const committeeData = [
    { id: 'demo-com-001', name: 'Comitê Central Campanha', type: 'CENTRAL' as const, city: 'São Paulo', neighborhood: 'Centro', responsibleName: 'Maria Santos' },
    { id: 'demo-com-002', name: 'Comitê Zona Norte', type: 'REGIONAL' as const, city: 'São Paulo', neighborhood: 'Santana', responsibleName: 'Carlos Oliveira' },
    { id: 'demo-com-003', name: 'Comitê Zona Sul', type: 'REGIONAL' as const, city: 'São Paulo', neighborhood: 'Interlagos', responsibleName: 'Ana Lima' },
    { id: 'demo-com-004', name: 'Comitê Zona Leste', type: 'REGIONAL' as const, city: 'São Paulo', neighborhood: 'Itaquera', responsibleName: 'Pedro Alves' },
    { id: 'demo-com-005', name: 'Comitê Zona Oeste', type: 'REGIONAL' as const, city: 'São Paulo', neighborhood: 'Lapa', responsibleName: 'Fernanda Costa' },
  ];

  const createdCommittees = [];
  for (const com of committeeData) {
    const committee = await prisma.committee.upsert({
      where: { id: com.id },
      update: { ...com, tenantId: tenant.id, status: 'ACTIVE' },
      create: { ...com, tenantId: tenant.id, status: 'ACTIVE' },
    });
    createdCommittees.push(committee);
  }
  console.log(`✅ Created ${createdCommittees.length} committees`);

  // ── Teams ──────────────────────────────────────────────────
  const teamData = [
    { name: 'Equipe Mobilização Centro', commId: 'demo-com-001', supervisor: 'Roberto Silva' },
    { name: 'Equipe Comunicação Digital', commId: 'demo-com-001', supervisor: 'Julia Lima' },
    { name: 'Equipe Voluntários ZN', commId: 'demo-com-002', supervisor: 'Fernando Souza' },
    { name: 'Equipe Mobilizadores ZS', commId: 'demo-com-003', supervisor: 'Ricardo Gomes' },
    { name: 'Equipe Logística Eventos', commId: 'demo-com-004', supervisor: 'Sonia Abrão' },
  ];

  for (const t of teamData) {
    await prisma.team.upsert({
      where: { id: `team-${t.name.toLowerCase().replace(/ /g, '-')}` },
      update: {},
      create: {
        id: `team-${t.name.toLowerCase().replace(/ /g, '-')}`,
        tenantId: tenant.id,
        committeeId: t.commId,
        name: t.name,
        supervisorName: t.supervisor,
        status: 'ACTIVE',
      },
    });
  }
  console.log('✅ Created 5 teams linked to committees');

  // ── Candidate ──────────────────────────────────────────────
  await prisma.candidate.upsert({
    where: { id: 'demo-candidate-001' },
    update: {},
    create: {
      id: 'demo-candidate-001',
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

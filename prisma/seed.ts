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

  // ── CRM Demo Data ──────────────────────────────────────────
  const crmContacts = [
    // Novos Contatos
    { name: 'João Silva', phone: '(11) 98765-4321', role: 'Professor', neighborhood: 'Vila Mariana', city: 'São Paulo', stage: 'NEW_CONTACT', impact: 'MEDIUM', observations: 'Interessado em educação pública' },
    { name: 'Maria Oliveira', phone: '(11) 99876-5432', role: 'Empresária', neighborhood: 'Jardins', city: 'São Paulo', stage: 'NEW_CONTACT', impact: 'HIGH', observations: 'Dona de empresa de tecnologia, pode financiar campanha' },
    { name: 'Carlos Santos', phone: '(11) 98765-1234', role: 'Médico', neighborhood: 'Moema', city: 'São Paulo', stage: 'NEW_CONTACT', impact: 'MEDIUM', observations: 'Especialista em saúde pública' },
    { name: 'Ana Costa', phone: '(11) 91234-5678', role: 'Advogada', neighborhood: 'Pinheiros', city: 'São Paulo', stage: 'NEW_CONTACT', impact: 'LOW', observations: 'Interessada em questões jurídicas' },

    // Potenciais Apoiadores
    { name: 'Roberto Lima', phone: '(11) 98765-6789', role: 'Empresário', neighborhood: 'Itaim Bibi', city: 'São Paulo', stage: 'POTENTIAL_SUPPORTER', impact: 'HIGH', observations: 'Dono de rede de supermercados, participou de reunião inicial' },
    { name: 'Fernanda Alves', phone: '(11) 99876-9876', role: 'Jornalista', neighborhood: 'Consolação', city: 'São Paulo', stage: 'POTENTIAL_SUPPORTER', impact: 'MEDIUM', observations: 'Trabalha em jornal local, pode ajudar com mídia' },
    { name: 'Pedro Rodrigues', phone: '(11) 98765-8765', role: 'Professor Universitário', neighborhood: 'Butantã', city: 'São Paulo', stage: 'POTENTIAL_SUPPORTER', impact: 'MEDIUM', observations: 'Especialista em políticas públicas' },
    { name: 'Sofia Mendes', phone: '(11) 91234-8765', role: 'Líder Comunitária', neighborhood: 'Santana', city: 'São Paulo', stage: 'POTENTIAL_SUPPORTER', impact: 'HIGH', observations: 'Coordena associação de moradores' },

    // Líderes Ativos
    { name: 'José Pereira', phone: '(11) 99876-1234', role: 'Sindicalista', neighborhood: 'Brás', city: 'São Paulo', stage: 'ACTIVE_LEADER', impact: 'HIGH', observations: 'Líder sindical com grande influência na classe trabalhadora' },
    { name: 'Luciana Gomes', phone: '(11) 98765-3456', role: 'Vereadora', neighborhood: 'Liberdade', city: 'São Paulo', stage: 'ACTIVE_LEADER', impact: 'HIGH', observations: 'Vereadora atual, pode trazer base eleitoral' },
    { name: 'Marcos Vieira', phone: '(11) 91234-3456', role: 'Pastor', neighborhood: 'Ipiranga', city: 'São Paulo', stage: 'ACTIVE_LEADER', impact: 'MEDIUM', observations: 'Líder religioso com comunidade ativa' },

    // Parceiros Estratégicos
    { name: 'Dr. Antonio Carvalho', phone: '(11) 99876-4567', role: 'Médico', neighborhood: 'Higienópolis', city: 'São Paulo', stage: 'STRATEGIC_PARTNER', impact: 'HIGH', observations: 'Diretor de hospital público, apoia reformas na saúde' },
    { name: 'Isabel Fernandes', phone: '(11) 98765-5678', role: 'Empresária', neighborhood: 'Vila Nova Conceição', city: 'São Paulo', stage: 'STRATEGIC_PARTNER', impact: 'HIGH', observations: 'CEO de empresa de construção, financia obras' },

    // Mobilizadores Confirmados
    { name: 'Ricardo Barbosa', phone: '(11) 91234-6789', role: 'Coordenador', neighborhood: 'Centro', city: 'São Paulo', stage: 'CONFIRMED_MOBILIZER', impact: 'HIGH', observations: 'Coordena equipe de mobilização, experiência em campanhas anteriores' },
    { name: 'Carla Nunes', phone: '(11) 99876-7890', role: 'Líder Jovem', neighborhood: 'Vila Madalena', city: 'São Paulo', stage: 'CONFIRMED_MOBILIZER', impact: 'MEDIUM', observations: 'Coordena jovens universitários' },
  ];

  for (const contact of crmContacts) {
    // Criar pessoa
    const person = await prisma.person.create({
      data: {
        tenantId: tenant.id,
        name: contact.name,
        phone: contact.phone,
        occupation: contact.role,
        neighborhood: contact.neighborhood,
        city: contact.city,
        notes: contact.observations,
      },
    });

    // Criar estágio CRM
    const crmStage = await prisma.crmStage.create({
      data: {
        personId: person.id,
        stage: contact.stage as any,
        nextFollowUp: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Data aleatória nos próximos 30 dias
      },
    });

    // Criar interação inicial
    await prisma.crmInteraction.create({
      data: {
        crmStageId: crmStage.id,
        type: 'CONTACT',
        description: `Contato inicial: ${contact.observations}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Data aleatória nos últimos 30 dias
      },
    });
  }
  console.log(`✅ Created ${crmContacts.length} CRM contacts with interactions`);

  console.log('\n🎉 Seed completed!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: admin@politicflow.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

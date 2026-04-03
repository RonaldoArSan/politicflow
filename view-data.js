import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n🔍 --- Deep Data Audit ---\n');

  const committees = await prisma.committee.findMany({
    select: { id: true, name: true, tenantId: true, deletedAt: true }
  });

  console.log(`Total found: ${committees.length}`);
  committees.forEach(c => {
    console.log(` - Name: ${c.name.padEnd(25)} | ID: ${c.id.padEnd(36)} | Tenant: ${c.tenantId} | Deleted: ${c.deletedAt}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});

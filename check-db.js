const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.team.count();
    console.log('Successfully connected and queried Team model. Current count:', count);
  } catch (err) {
    console.error('Failed to query Team model:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

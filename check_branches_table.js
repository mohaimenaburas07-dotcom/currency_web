const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branches.findMany();
  console.log('Total Branches in DB:', branches.length);
  console.log(JSON.stringify(branches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

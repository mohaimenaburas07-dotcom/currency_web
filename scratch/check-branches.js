const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branches.findMany();
  console.dir(branches, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());

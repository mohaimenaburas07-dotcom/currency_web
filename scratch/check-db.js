const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.branchHardwareConfig.findMany();
  console.dir(configs, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());

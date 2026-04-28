const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Prisma keys:", Object.keys(prisma).filter(k => !k.startsWith('$')));
  try {
    const branches = await prisma.branches.findMany();
    console.log("Branches count:", branches.length);
  } catch (e) {
    console.error("Error fetching branches:", e.message);
  }
  await prisma.$disconnect();
}

main().catch(console.error);

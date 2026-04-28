import { prisma } from "./lib/prisma";

async function main() {
  console.log("Prisma keys:", Object.keys(prisma).filter(k => !k.startsWith('$')));
  const branches = await (prisma as any).branches.findMany();
  console.log("Branches count:", branches.length);
}

main().catch(console.error);

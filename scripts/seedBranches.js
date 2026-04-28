// scripts/seedBranches.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const branches = [
  { uuid: '6dd77c32-bc55-4d6a-a980-0c802f3919f3', name: 'فرع الزويتينة للخدمات الاسلامية' },
  { uuid: '0833d3c5-ac29-48ec-a878-0c67b7fb1862', name: 'فرع جنزور للخدمات الاسلامية' },
  { uuid: '0a1e3d09-cf14-4804-9d2d-02683385107b', name: 'فرع زليتن للخدمات الاسلامية' },
  { uuid: '16cfee58-c701-41f1-9bd1-6e0fd479fdd0', name: 'فرع بنغازي' },
];

async function main() {
  console.log('Starting seed...');

  for (const b of branches) {
    const existing = await prisma.branches.findUnique({
      where: { code: b.uuid }
    });

    if (!existing) {
      await prisma.branches.create({
        data: {
          code: b.uuid,
          name_ar: b.name,
          name_en: b.name,
          is_active: true,
        }
      });
      console.log(`Created branch: ${b.name}`);
    }

    await prisma.branchHardwareConfig.upsert({
      where: { branchCode: b.uuid },
      update: { branchName: b.name },
      create: {
        branchCode: b.uuid,
        branchName: b.name,
        gatewayUrl: 'http://localhost:8080',
      }
    });
    console.log(`Initialized hardware config for: ${b.name}`);
  }

  const adminExists = await prisma.users.findUnique({ where: { username: 'admin' } });
  if (!adminExists) {
    await prisma.users.create({
      data: {
        username: 'admin',
        email: 'admin@alwaha.com',
        password: 'password123', 
        role: 'ADMIN',
        name: 'System Administrator'
      }
    });
    console.log('Created default admin user (admin/password123)');
  }

  console.log('Seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- System Setup & Branch Restoration ---');
  
  try {
    const branchCode = '6ea54323-2236-4c29-888d-9a1edf295c29';
    
    // 1. Ensure the default branch exists
    const branch = await prisma.branches.upsert({
      where: { code: branchCode },
      update: { is_active: true },
      create: {
        code: branchCode,
        name_ar: 'المركز الرئيسي',
        name_en: 'Main Branch',
        is_active: true
      }
    });
    console.log('✓ Default branch ensured:', branch.name_ar);

    // 2. Ensure hardware config exists for this branch
    const hwConfig = await prisma.branchHardwareConfig.upsert({
      where: { branchCode: branchCode },
      update: { branchName: 'المركز الرئيسي' },
      create: {
        branchCode: branchCode,
        branchName: 'المركز الرئيسي',
        gatewayUrl: 'http://localhost:8080'
      }
    });
    console.log('✓ Hardware configuration ensured for branch');

    console.log('--- Setup Complete ---');
  } catch (error) {
    console.error('Setup failed:', error.message);
    if (error.message.includes('denied access')) {
      console.error('CRITICAL: Database access denied. Please check your .env.local DATABASE_URL and credentials.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

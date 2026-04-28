const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRawUnsafe(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'branch_hardware_configs' ORDER BY ordinal_position`)
  .then(r => r.forEach(c => console.log(c.column_name, '| nullable:', c.is_nullable, '| default:', c.column_default)))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());

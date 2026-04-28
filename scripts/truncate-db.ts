import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database truncation...')
  
  // Get all table names in the public schema
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  // Filter out the migration table and format names for SQL
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `\"public\".\"${name}\"`)
    .join(', ')

  if (tables.length === 0) {
    console.log('No tables found to truncate.')
    return
  }

  try {
    // TRUNCATE with CASCADE removes all data and resets sequences while handling foreign keys
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
    console.log('✅ Database truncated successfully (all data removed, schema preserved).')
  } catch (error) {
    console.error('❌ Error truncating database:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

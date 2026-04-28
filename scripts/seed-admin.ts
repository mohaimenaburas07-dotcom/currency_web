import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding default admin user...')
  
  const password = 'admin'
  const hashedPassword = await bcrypt.hash(password, 10)
  
  // 1. Create or update the admin user
  const user = await prisma.users.upsert({
    where: { username: 'admin' },
    update: { 
      password: hashedPassword,
      role: 'ADMIN',
      is_active: true
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@alwaha.ly',
      role: 'ADMIN',
      name: 'Super Admin',
      is_active: true,
      created_at: new Date()
    }
  })

  // 2. Ensure roles exist in the roles table
  // ROLE_USER = 1, ROLE_ADMIN = 4 (based on app/api/admin/users/route.ts)
  const roles = [
    { id: 1n, name: 'ROLE_USER' },
    { id: 4n, name: 'ROLE_ADMIN' }
  ]

  for (const role of roles) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "roles" (id, name)
      VALUES ($1, $2)
      ON CONFLICT (id) DO NOTHING
    `, role.id, role.name)
  }

  // 3. Link user to ADMIN role in user_roles
  await prisma.$executeRawUnsafe(`
    INSERT INTO "user_roles" (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, BigInt(user.id), 4n)

  console.log('✅ Default admin user created successfully.')
  console.log('-------------------------------------------')
  console.log('Username: admin')
  console.log('Password: admin')
  console.log('-------------------------------------------')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

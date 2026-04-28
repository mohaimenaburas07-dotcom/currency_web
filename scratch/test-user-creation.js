const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCreateUser() {
  try {
    const user = await prisma.users.create({
      data: {
        username: "test_agent_" + Date.now(),
        password: "password123",
        email: "test_" + Date.now() + "@alwahabank.ly",
        role: "OPERATOR",
        name: "Test Agent",
        is_active: true,
        created_at: new Date()
      }
    });
    console.log("Success:", JSON.stringify(user, (k, v) => typeof v === 'bigint' ? v.toString() : v));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCreateUser();

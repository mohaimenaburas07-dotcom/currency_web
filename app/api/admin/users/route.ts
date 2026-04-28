import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  try {
    const usersRaw = await prisma.users.findMany({
      orderBy: { created_at: 'desc' }
    });

    const branchesRaw = await prisma.branches.findMany({
      where: { is_active: true }
    });

    return NextResponse.json(serializeBigInt({ 
      users: usersRaw, 
      branches: branchesRaw 
    }));
  } catch (error: any) {
    console.error("[ADMIN_USERS_GET_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, email, role, branchCode, name } = body;

    if (!username || !password || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Resolve branchCode to branch_id if provided
    let branchId: bigint | null = null;
    if (branchCode) {
      const branch = await prisma.branches.findUnique({
        where: { code: branchCode }
      });
      if (branch) branchId = branch.id;
    }

    // 2. Hash password for Spring Boot compatibility
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user using raw SQL (workaround for Prisma sync)
    const result: any[] = await prisma.$queryRawUnsafe(`
      INSERT INTO "users" (username, password, email, role, branch_code, branch_id, name, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, now())
      RETURNING *
    `, 
      username, 
      hashedPassword, 
      email, 
      role || 'OPERATOR', 
      branchCode, 
      branchId,
      name || username
    );

    const newUser = result[0];
    const userId = BigInt(newUser.id);

    // 4. Assign role in user_roles table for Spring Boot Security
    // ROLE_USER = 1, ROLE_ADMIN = 4
    const roleId = role === 'ADMIN' ? 4n : 1n;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "user_roles" (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, userId, roleId);

    return NextResponse.json(serializeBigInt(newUser));
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
    }
    console.error("[ADMIN_USERS_POST_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

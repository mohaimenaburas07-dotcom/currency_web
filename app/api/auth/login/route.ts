import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = typeof body?.username === "string" ? body.username.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!username || !password) {
      return NextResponse.json({ message: "اسم المستخدم وكلمة المرور مطلوبان" }, { status: 400 })
    }

    const user = await prisma.users.findUnique({ where: { username } })

    if (!user?.is_active) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة" }, { status: 401 })
    }

    const stored = user.password ?? ""
    const valid =
      stored.startsWith("$2") ? await bcrypt.compare(password, stored) : password === stored

    if (!valid) {
      return NextResponse.json({ message: "بيانات الدخول غير صحيحة" }, { status: 401 })
    }

    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: user.id },
      include: { roles: true },
    })
    const roleNames = userRoles
      .map((ur) => ur.roles.name)
      .filter((n): n is string => Boolean(n))
    const roles = roleNames.length > 0 ? roleNames : [user.role || "OPERATOR"]

    return NextResponse.json({
      accessToken: `local-${randomUUID()}`,
      id: String(user.id),
      username: user.username,
      email: user.email,
      roles,
      branchCode: user.branch_code,
    })
  } catch (e) {
    console.error("[auth/login]", e)
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 })
  }
}

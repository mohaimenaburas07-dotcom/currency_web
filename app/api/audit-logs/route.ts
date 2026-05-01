// app/api/audit-logs/route.ts
// Returns paginated WorkflowAuditLog entries for the Reports page.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serializeBigInt } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "50")
    const action = searchParams.get("action") ?? undefined
    const userId = searchParams.get("userId") ?? undefined
    const skip = (page - 1) * limit

    const where: any = {}
    if (action) where.action = action
    if (userId) where.performedByUserId = { contains: userId }

    const [logs, total] = await Promise.all([
      prisma.workflowAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.workflowAuditLog.count({ where }),
    ])

    return NextResponse.json(serializeBigInt({
      data: logs,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit),
      }
    }))
  } catch (error: any) {
    console.error("[AUDIT_LOGS_API]", error)
    return NextResponse.json({ message: error.message ?? "Error fetching audit logs" }, { status: 500 })
  }
}

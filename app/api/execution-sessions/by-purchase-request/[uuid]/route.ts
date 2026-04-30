// app/api/execution-sessions/by-purchase-request/[uuid]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params

  try {
    const session = await prisma.executionSession.findFirst({
      where: { purchaseRequestUuid: uuid },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
      }
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("[SessionByUuid] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

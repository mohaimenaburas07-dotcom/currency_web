// app/api/execution-sessions/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse, SessionAlreadyCompletedError } from "@/lib/workflowErrors"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    const { reason, userId } = await req.json()
    const session = await prisma.executionSession.findUniqueOrThrow({ where: { id } })

    if (["COMPLETED", "CANCELLED"].includes(session.status)) {
      throw new SessionAlreadyCompletedError()
    }

    await prisma.executionSession.update({
      where: { id },
      data: { 
        status: "CANCELLED",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled by user",
        endedAt: new Date(),
      }
    })

    await writeAuditLog({
      action: "SESSION_CANCELLED",
      entityType: "ExecutionSession",
      entityId: id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { reason },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true, status: "CANCELLED" })
  } catch (err) {
    return NextResponse.json(toErrorResponse(err), { status: 400 })
  }
}

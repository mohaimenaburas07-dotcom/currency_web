// app/api/execution-sessions/[id]/verify-identity/route.ts
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
    const session = await prisma.executionSession.findUniqueOrThrow({ where: { id } })

    if (["COMPLETED", "CANCELLED"].includes(session.status)) {
      throw new SessionAlreadyCompletedError()
    }

    const body = await req.json()
    const { documentType, documentNumber, matched, mismatchReason, userId } = body

    const verification = await prisma.identityVerification.upsert({
      where: { sessionId: id },
      update: {
        documentType,
        documentNumber,
        matched,
        mismatchReason,
        verifiedByUserId: userId ?? "system",
        verifiedAt: new Date(),
      },
      create: {
        sessionId: id,
        documentType,
        documentNumber,
        matched,
        mismatchReason,
        verifiedByUserId: userId ?? "system",
        verifiedAt: new Date(),
      },
    })

    // Update session status to reflect progress
    await prisma.executionSession.update({
      where: { id },
      data: { 
        verificationStatus: matched ? "DONE" : "FAILED",
        status: matched ? "COUNTING_CASH" : "DRAFT", 
      }
    })

    await writeAuditLog({
      action: "IDENTITY_VERIFIED",
      entityType: "IdentityVerification",
      entityId: verification.id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { matched, documentType },
      ipAddress,
      userAgent,
    })

    return NextResponse.json(verification)
  } catch (err) {
    return NextResponse.json(toErrorResponse(err), { status: 400 })
  }
}

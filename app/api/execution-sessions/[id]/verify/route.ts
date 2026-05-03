import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse } from "@/lib/workflowErrors"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { ipAddress, userAgent } = extractRequestMeta(req)
    
    const body = await req.json().catch(() => ({}))
    const userId = body.userId ?? "system"

    const session = await prisma.executionSession.update({
      where: { id },
      data: {
        verificationStatus: "DONE",
        identityVerification: {
          upsert: {
            create: {
              documentType: "ID_CARD",
              documentNumber: body.nationalId || body.passportNumber || "AUTO-VERIFIED",
              customerName: body.customerName,
              nationalId: body.nationalId,
              passportNumber: body.passportNumber,
              birthDate: body.birthDate,
              matched: true,
              verifiedByUserId: userId,
            },
            update: {
              documentNumber: body.nationalId || body.passportNumber || "AUTO-VERIFIED",
              customerName: body.customerName,
              nationalId: body.nationalId,
              passportNumber: body.passportNumber,
              birthDate: body.birthDate,
              matched: true,
              verifiedByUserId: userId,
            }
          }
        }
      },
    })

    // Audit Log
    await writeAuditLog({
      action:            "IDENTITY_VERIFIED",
      entityType:        "ExecutionSession",
      entityId:          session.id,
      performedByUserId: userId,
      sessionId:         session.id,
      newValues:         { verificationStatus: "DONE" },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true, session })
  } catch (err) {
    console.error("[verify] error:", err)
    return NextResponse.json(toErrorResponse(err), { status: 500 })
  }
}

// app/api/execution-sessions/[id]/process-fcms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { processPurchaseRequest } from "@/lib/fxApiClient"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse } from "@/lib/workflowErrors"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    const { userId, ts } = await req.json()

    // 1. Get session and serial numbers
    const session = await prisma.executionSession.findUniqueOrThrow({
      where: { id },
      include: { cashCountResult: true }
    })

    const serials = session.cashCountResult?.usdSerialNumbers || []
    if (serials.length === 0) {
      return NextResponse.json({ error: "لا توجد أرقام تسلسلية للعملات المعدودة" }, { status: 400 })
    }

    const payload = {
      ts: ts || Math.floor(Date.now() / 1000),
      usd_serial_numbers: serials,
    }

    console.log(`[FCMS-Process] Processing request ${session.purchaseRequestUuid} for session ${id}...`)

    let response: any

    try {
      response = await processPurchaseRequest(session.purchaseRequestUuid, payload)
      console.log(`[FCMS-Process] Success for ${id}:`, response)
    } catch (err: any) {
      console.error(`[FCMS-Process] Error for ${id}:`, err)
      // Do NOT write processSnapshot on failure — keeps retry path open
      return NextResponse.json({
        success: false,
        message: err.message || "تعذر الاتصال بخدمة FCMS الخارجية"
      }, { status: 400 }) // 400 so HTTP clients detect failure via status code
    }

    // 2. Update session with success snapshot and correct status
    await prisma.executionSession.update({
      where: { id },
      data: {
        processSnapshot: { ...(response || {}), status: "SUCCESS" },
        countingStatus: "DONE",
        status: "RECORDING" // B2: was READY_FOR_CONFIRMATION — now correctly RECORDING
      }
    })

    // 3. Audit
    await writeAuditLog({
      action: "FCMS_PROCESS_EXECUTED",
      entityType: "ExecutionSession",
      entityId: id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { status: "SUCCESS" },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true, message: "تمت معالجة الطلب في FCMS بنجاح", response })

  } catch (err) {
    console.error("[FCMS-Process] unexpected error:", err)
    return NextResponse.json(toErrorResponse(err), { status: 500 })
  }
}

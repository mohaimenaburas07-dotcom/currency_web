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
    let status = "SUCCESS"
    let errorMessage = null

    try {
      response = await processPurchaseRequest(session.purchaseRequestUuid, payload)
      console.log(`[FCMS-Process] Success for ${id}:`, response)
    } catch (err: any) {
      console.error(`[FCMS-Process] Error for ${id}:`, err)
      status = "FAILED"
      errorMessage = err.message
      
      // Store the failed response snapshot if possible
      await prisma.executionSession.update({
        where: { id },
        data: {
          processSnapshot: {
            error: err.message,
            timestamp: new Date().toISOString(),
            status: "FAILED"
          }
        }
      })

      return NextResponse.json({ 
        success: false, 
        error: err.message,
        errorCode: err.message.match(/FCMS\d+/) ? err.message.match(/FCMS\d+/)[0] : null
      }, { status: 200 }) // Return 200 but with success: false to show Arabic error in UI
    }

    // 2. Update session with success snapshot
    await prisma.executionSession.update({
      where: { id },
      data: {
        processSnapshot: response,
        status: "READY_FOR_CONFIRMATION" // Move state forward
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

    return NextResponse.json({ success: true, response })

  } catch (err) {
    console.error("[FCMS-Process] unexpected error:", err)
    return NextResponse.json(toErrorResponse(err), { status: 500 })
  }
}

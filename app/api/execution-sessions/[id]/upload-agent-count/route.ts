// app/api/execution-sessions/[id]/upload-agent-count/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { SessionAlreadyCompletedError, ValidationError } from "@/lib/workflowErrors"
import { processPurchaseRequest } from "@/lib/fxApiClient"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    const session = await prisma.executionSession.findUniqueOrThrow({ 
      where: { id },
    })

    if (["COMPLETED", "CANCELLED"].includes(session.status)) {
      throw new SessionAlreadyCompletedError()
    }

    if (session.verificationStatus !== "DONE") {
      throw new ValidationError("يجب إتمام التحقق من الهوية قبل العد النقدي")
    }

    const { 
      denominations = [], 
      total = 0, 
      currency = "USD", 
      userId = "system", 
      usd_serial_numbers = [],
      rawAgentResponse = null
    } = await req.json()

    const requestedAmount = (session.requestSnapshot as any)?.amount_requested ?? 0
    const isMatched = Math.abs(Number(total) - Number(requestedAmount)) < 0.01

    // B3: Safer retry guard — check processSnapshot.status explicitly
    const snap = session.processSnapshot as any
    if (session.countingStatus === "DONE" || (snap && snap.status === "SUCCESS")) {
      return NextResponse.json({
        success: true,
        message: "تم تنفيذ الطلب مسبقاً في FCMS، يرجى استكمال التوثيق المحلي",
        nextStatus: "RECORDING",
      })
    }
    if (snap && snap.status === "PENDING") {
      return NextResponse.json({
        success: false,
        message: "الطلب قيد المعالجة في FCMS. يرجى الانتظار أو تحديث الصفحة لمتابعة التوثيق المحلي.",
      }, { status: 409 })
    }

    // 4. Save results to DB in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.cashCountResult.findUnique({ where: { sessionId: id } })
      if (existing) {
        await tx.cashCountDenomination.deleteMany({ where: { cashCountResultId: existing.id } })
        await tx.cashCountResult.delete({ where: { id: existing.id } })
      }

      return tx.cashCountResult.create({
        data: {
          sessionId: id,
          currency,
          totalCountedAmount: total,
          excelFilePath: "AGENT_API_COUNT",
          isMatchedWithRequest: isMatched,
          usdSerialNumbers: usd_serial_numbers,
          denominations: {
            create: denominations.map((d: any) => ({
              denomination: d.denomination,
              notesCount: d.notesCount,
              subtotal: d.subtotal,
            }))
          }
        },
        include: { denominations: true }
      })
    })

    // B3: Write PENDING snapshot BEFORE calling FCMS
    await prisma.executionSession.update({
      where: { id },
      data: { processSnapshot: { status: "PENDING", startedAt: new Date().toISOString(), source: "GFS220_AGENT" } }
    })

    // Call FCMS Process
    let processResult: any
    try {
      processResult = await processPurchaseRequest(session.purchaseRequestUuid, {
        ts: Math.floor(Date.now() / 1000),
        usd_serial_numbers: usd_serial_numbers
      })
    } catch (fcmsErr: any) {
      // FCMS failed — clear the PENDING snapshot
      await prisma.executionSession.update({
        where: { id },
        data: { processSnapshot: { status: "FAILED", error: fcmsErr.message, failedAt: new Date().toISOString() } }
      })
      return NextResponse.json({
        success: false,
        message: fcmsErr.message || "تعذر الاتصال بخدمة FCMS الخارجية"
      }, { status: 400 })
    }

    // B3: FCMS succeeded — write SUCCESS snapshot and advance session state atomically
    await prisma.executionSession.update({
      where: { id },
      data: {
        countingStatus: "DONE",
        status: "RECORDING",
        processSnapshot: { ...(processResult || {}), status: "SUCCESS", succeededAt: new Date().toISOString() }
      }
    })

    await writeAuditLog({
      action: "CASH_COUNT_AGENT_SAVED",
      entityType: "CashCountResult",
      entityId: result.id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { total, isMatched, cashCountSource: "gfs220_agent", serialCount: usd_serial_numbers.length, rawAgentResponse },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: "تم استلام نتيجة العد من جهاز GFS-220 وتنفيذ الطلب بنجاح",
      total,
      currency,
      serialCount: usd_serial_numbers.length
    })
  } catch (err: any) {
    console.error("[upload-agent-count] error:", err)
    return NextResponse.json({
      success: false,
      message: err.message || "Failed to process agent count"
    }, { status: 400 })
  }
}

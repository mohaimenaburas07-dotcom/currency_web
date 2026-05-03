// app/api/execution-sessions/[id]/upload-excel-count/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveExcelFile } from "@/lib/mediaStorage"
import { parseCountingExcel } from "@/lib/excelCountParser"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse, SessionAlreadyCompletedError, ValidationError } from "@/lib/workflowErrors"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    const session = await prisma.executionSession.findUniqueOrThrow({ 
      where: { id },
      // include request snapshot to validate amount
    })

    if (["COMPLETED", "CANCELLED"].includes(session.status)) {
      throw new SessionAlreadyCompletedError()
    }

    if (session.verificationStatus !== "DONE") {
      throw new ValidationError("Verification must be completed before counting cash")
    }

    const contentType = req.headers.get("content-type") || ""
    let denominations: any[] = []
    let totalCountedAmount = 0
    let currency = "USD"
    let filePath = "MOCK_EXCEL_PATH"

    let userId = "system"
    let cashCountSource = "manual"
    let usdSerialNumbers: string[] = []

    // Fallback customer code extraction from snapshot if missing
    let customerCode = session.customerCode
    if (!customerCode && session.requestSnapshot) {
       try {
          const snap = session.requestSnapshot as any
          const accountNo = snap?.bankAccount?.account_number || ""
          if (accountNo.length >= 9) {
             const code = accountNo.substring(3, 9)
             customerCode = parseInt(code, 10).toString()
             console.log(`[CASH_COUNT_UPLOAD] Extracted customerCode from snapshot: ${customerCode}`)
          }
       } catch (e) {}
    }
 
    if (contentType.includes("application/json")) {
      const body = await req.json()
      denominations = body.denominations || []
      totalCountedAmount = body.total || 0
      currency = body.currency || "USD"
      userId = body.userId || "system"
      cashCountSource = body.cashCountSource || "manual"
      usdSerialNumbers = body.usd_serial_numbers || []
    } else {
      const formData = await req.formData()
      const file = formData.get("file") as File
      userId = formData.get("userId") as string ?? "system"
      cashCountSource = formData.get("cashCountSource") as string ?? "manual"
      if (!file) {
        throw new ValidationError("No Excel file provided")
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      filePath = await saveExcelFile(buffer, id, customerCode || "unknown", file.name)
      const parsed = parseCountingExcel(buffer)
      denominations = parsed.denominations
      totalCountedAmount = parsed.totalCountedAmount
      currency = parsed.currency
      usdSerialNumbers = parsed.usdSerialNumbers
    }

    const requestedAmount = (session.requestSnapshot as any)?.amount_requested ?? 0
    const isMatched = Math.abs(Number(totalCountedAmount) - Number(requestedAmount)) < 0.01

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
          totalCountedAmount,
          excelFilePath: filePath,
          isMatchedWithRequest: isMatched,
          usdSerialNumbers: usdSerialNumbers,
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

    // Update session status
    await prisma.executionSession.update({
      where: { id },
      data: { 
        countingStatus: "DONE",
        status: "RECORDING" 
      }
    })

    await writeAuditLog({
      action: "CASH_COUNT_SAVED",
      entityType: "CashCountResult",
      entityId: result.id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { total: totalCountedAmount, isMatched, cashCountSource, serialCount: usdSerialNumbers.length },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      ts: Math.floor(Date.now() / 1000),
      usd_serial_numbers: usdSerialNumbers,
      serialCount: usdSerialNumbers.length,
      total: totalCountedAmount,
      currency: currency,
      // Also include the original result for compatibility if needed
      resultId: result.id
    })
  } catch (err: any) {
    console.error("[upload-excel-count] error:", err)
    return NextResponse.json({
      success: false,
      message: err.message || "Failed to process Excel file"
    }, { status: 400 })
  }
}

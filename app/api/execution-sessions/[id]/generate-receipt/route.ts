// app/api/execution-sessions/[id]/generate-receipt/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchCustomerFromCBS } from "@/lib/cbsApiClient"
import { saveReceiptFile } from "@/lib/mediaStorage"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse, SessionAlreadyCompletedError, ValidationError } from "@/lib/workflowErrors"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    const { userId, executorName } = await req.json()
    
    // 1. Load session data
    const session = await prisma.executionSession.findUniqueOrThrow({
      where: { id },
      include: {
        cashCountResult: { include: { denominations: true } },
        receipt: true
      }
    })

    console.log(`[GenerateReceipt] Session ${id}: status=${session.status}, customerCode=${session.customerCode}, cashCount=${!!session.cashCountResult}`);

    if (session.status === "CANCELLED") {
      throw new SessionAlreadyCompletedError()
    }

    if (session.receipt) {
       return NextResponse.json({
         success: true,
         message: "تم تحميل الإيصال السابق ويمكن إعادة طباعته",
         receiptNumber: session.receipt.receiptNumber,
         customerCopyUrl: `/uploads/${session.receipt.customerCopyPath}`
       })
    }

    if (!session.cashCountResult) {
      throw new ValidationError("لم يتم إدخال بيانات العدّ النقدي — يرجى إتمام خطوة العدّ أولاً")
    }

    // 2. Fetch CBS data for the receipt (with fallback)
    let cbsData: any = null
    const snapshot = session.requestSnapshot as any

    try {
      if (session.customerCode) {
        cbsData = await fetchCustomerFromCBS(session.customerCode)
      }
    } catch (cbsErr) {
      console.warn(`[GenerateReceipt] CBS fetch failed for ${session.customerCode}, using snapshot fallback:`, cbsErr)
    }

    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 100)}`

    // 3. Prepare data for PDF
    const receiptData = {
      receiptNumber,
      executionDate: new Date(),
      customer: {
        name: cbsData?.customerName || snapshot?.client_name || "عميل مصرف الواحة",
        nationalId: cbsData?.nationalId || snapshot?.national_id || "N/A",
        passportNumber: cbsData?.passportNo || snapshot?.passport_no || "N/A",
        phone: cbsData?.phoneNumber || "N/A",
      },
      transaction: {
        currency: session.cashCountResult.currency,
        amountForeign: Number(session.cashCountResult.totalCountedAmount),
        exchangeRate: snapshot?.bank_transfer_price ?? 0,
        amountLocal: Number(session.cashCountResult.totalCountedAmount) * (snapshot?.bank_transfer_price ?? 0),
        serialNumber: session.serialNumber ?? "",
      },
      denominations: session.cashCountResult.denominations.map(d => ({
        denomination: Number(d.denomination),
        notesCount: d.notesCount,
        subtotal: Number(d.subtotal),
      })),
      executorName: executorName ?? "موظف مصرف الواحة",
      branchName: cbsData?.branch || snapshot?.branch_name || "مصرف الواحة",
    }

    // 4. Generate PDF (Placeholder for now, returning dummy buffer)
    const pdfBuffer = Buffer.from("DUMMY_PDF_CONTENT") 
    
    // 5. Save PDF files
    const customerCopyPath = await saveReceiptFile(pdfBuffer, receiptNumber, "customer")
    const archiveCopyPath  = await saveReceiptFile(pdfBuffer, receiptNumber, "archive")

    // 6. Create Receipt record
    const receipt = await prisma.receipt.create({
      data: {
        sessionId: id,
        receiptNumber,
        customerCopyPath,
        archiveCopyPath,
        printedByUserId: userId ?? "system",
        printedAt: new Date(),
      }
    })

    // Update session status (don't change main status to avoid backwards steps)
    await prisma.executionSession.update({
      where: { id },
      data: { 
        receiptStatus: "DONE"
      }
    })

    await writeAuditLog({
      action: "RECEIPT_GENERATED",
      entityType: "Receipt",
      entityId: receipt.id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { receiptNumber },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: "تم إنشاء الإيصال بنجاح",
      receiptNumber: receipt.receiptNumber,
      customerCopyUrl: `/uploads/${customerCopyPath}`,
    })
  } catch (err: any) {
    console.error("[generate-receipt] error:", err)
    return NextResponse.json(
      { success: false, message: "تعذر إنشاء الإيصال", code: "RECEIPT_GENERATION_FAILED" }, 
      { status: 400 }
    )
  }
}

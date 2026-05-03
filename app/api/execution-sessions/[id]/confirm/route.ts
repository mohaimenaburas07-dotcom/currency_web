// app/api/execution-sessions/[id]/confirm/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchCustomerFromCBS } from "@/lib/cbsApiClient"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse, SessionAlreadyCompletedError, ValidationError } from "@/lib/workflowErrors"
import { processPurchaseRequest } from "@/lib/fxApiClient"


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    const { serialNumber, userId, usedDeviceIds, sourceMetadata } = await req.json()

    if (!serialNumber) {
      throw new ValidationError("Serial number is required for confirmation")
    }

    // 1. Transactional confirmation
    const result = await prisma.$transaction(async (tx) => {
      // 1a. Load and lock session
      const session = await tx.executionSession.findUniqueOrThrow({
        where: { id },
        include: {
          identityVerification: true,
          mediaRecords: true,
          cashCountResult: true,
          receipt: true,
        }
      })

      if (["COMPLETED", "CANCELLED"].includes(session.status)) {
        throw new SessionAlreadyCompletedError()
      }

      // 1b. Checklist validation — log full state for debugging
      const docVerified = session.identityVerification?.matched === true
      const hasPhoto = session.mediaRecords.some(m => m.mediaType === 'PHOTO')
      const hasVideo = session.mediaRecords.some(m => m.mediaType === 'VIDEO')
      const hasCash = !!session.cashCountResult
      const cashMatched = session.cashCountResult?.isMatchedWithRequest === true
      const hasProcessSnapshot = !!session.processSnapshot

      console.log(`[Confirm] Session ${id} checklist:
  identity_verified=${docVerified}
  has_photo=${hasPhoto}
  has_video=${hasVideo}
  cash_done=${hasCash}
  cash_matched=${cashMatched}
  fcms_processed=${hasProcessSnapshot}
  status=${session.status}`)

      if (!docVerified) throw new ValidationError("لم يتم التحقق من الهوية — يرجى إتمام خطوة التحقق")
      if (!hasCash) throw new ValidationError("لم يتم إدخال بيانات العدّ النقدي")
      if (!cashMatched) throw new ValidationError("المبلغ المعدود لا يطابق المبلغ المطلوب")
      if (!hasProcessSnapshot) throw new ValidationError("لم تتم معالجة الطلب في المنظومة المركزية (FCMS)")
      if (!hasVideo) throw new ValidationError("تسجيل الفيديو مطلوب")
      if (!hasPhoto) throw new ValidationError("التقاط صورة العميل مطلوب")

      // 1c. Fetch CBS data (with fallback to snapshot if CBS unreachable)
      const snapshot = session.requestSnapshot as any
      let cbsData: any = null
      try {
        if (session.customerCode) {
          cbsData = await fetchCustomerFromCBS(session.customerCode)
        }
      } catch (cbsErr) {
        console.warn(`[Confirm] CBS unavailable for ${session.customerCode}, using snapshot fallback:`, cbsErr)
      }

      // 1d. Create or Update TransactionRecord
      const txnNumber = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      
      const txnRecord = await tx.transactionRecord.upsert({
        where: { purchaseRequestUuid: session.purchaseRequestUuid },
        update: {
          sessionId: session.id,
          transactionNumber: txnNumber,
          currency: session.cashCountResult.currency,
          amountForeign: session.cashCountResult.totalCountedAmount,
          exchangeRate: snapshot?.bank_transfer_price ?? snapshot?.rate ?? 0,
          amountLocal: Number(session.cashCountResult.totalCountedAmount) * (snapshot?.bank_transfer_price ?? snapshot?.rate ?? 0),
          serialNumber,
          executedByUserId: userId ?? "system",
          status: "COMPLETED",
        },
        create: {
          purchaseRequestUuid: session.purchaseRequestUuid,
          sessionId: session.id,
          transactionNumber: txnNumber,
          currency: session.cashCountResult.currency,
          amountForeign: session.cashCountResult.totalCountedAmount,
          exchangeRate: snapshot?.bank_transfer_price ?? snapshot?.rate ?? 0,
          amountLocal: Number(session.cashCountResult.totalCountedAmount) * (snapshot?.bank_transfer_price ?? snapshot?.rate ?? 0),
          serialNumber,
          executedByUserId: userId ?? "system",
          status: "COMPLETED",
        }
      })

      // 1e. Create or Update ReceivedCustomerRecord
      const rcr = await tx.receivedCustomerRecord.upsert({
        where: { purchaseRequestUuid: session.purchaseRequestUuid },
        update: {
          sessionId: session.id,
          transactionRecordId: txnRecord.id,
          customerExternalId: cbsData?.customerCode ?? session.customerCode ?? "UNKNOWN",
          customerName: session.identityVerification?.customerName ?? cbsData?.customerName ?? snapshot?.bankAccount?.user?.first_name ?? snapshot?.client_name ?? "عميل",
          nationalId: session.identityVerification?.nationalId ?? cbsData?.nationalId ?? snapshot?.bankAccount?.user?.nid ?? snapshot?.national_id ?? "N/A",
          passportNumber: session.identityVerification?.passportNumber ?? cbsData?.passportNo ?? snapshot?.bankAccount?.user?.passport_number ?? snapshot?.passport_no ?? "N/A",
          birthDate: session.identityVerification?.birthDate ?? cbsData?.birthDate ?? snapshot?.bankAccount?.user?.birth_date ?? null,
          phone: cbsData?.phoneNumber ?? (snapshot?.bankAccount?.user?.phone || snapshot?.phone || "N/A"),
          requestType: snapshot?.type?.name ?? "CASH_PICKUP",
          currency: txnRecord.currency,
          amountForeign: txnRecord.amountForeign,
          exchangeRate: txnRecord.exchangeRate,
          amountLocal: txnRecord.amountLocal,
          receiptNumber: session.receipt?.receiptNumber ?? "NOT_PRINTED",
          receivedByUserId: userId ?? "system",
        },
        create: {
          purchaseRequestUuid: session.purchaseRequestUuid,
          sessionId: session.id,
          transactionRecordId: txnRecord.id,
          customerExternalId: cbsData?.customerCode ?? session.customerCode ?? "UNKNOWN",
          customerName: session.identityVerification?.customerName ?? cbsData?.customerName ?? snapshot?.bankAccount?.user?.first_name ?? snapshot?.client_name ?? "عميل",
          nationalId: session.identityVerification?.nationalId ?? cbsData?.nationalId ?? snapshot?.bankAccount?.user?.nid ?? snapshot?.national_id ?? "N/A",
          passportNumber: session.identityVerification?.passportNumber ?? cbsData?.passportNo ?? snapshot?.bankAccount?.user?.passport_number ?? snapshot?.passport_no ?? "N/A",
          birthDate: session.identityVerification?.birthDate ?? cbsData?.birthDate ?? snapshot?.bankAccount?.user?.birth_date ?? null,
          phone: cbsData?.phoneNumber ?? (snapshot?.bankAccount?.user?.phone || snapshot?.phone || "N/A"),
          requestType: snapshot?.type?.name ?? "CASH_PICKUP",
          currency: txnRecord.currency,
          amountForeign: txnRecord.amountForeign,
          exchangeRate: txnRecord.exchangeRate,
          amountLocal: txnRecord.amountLocal,
          receiptNumber: session.receipt?.receiptNumber ?? "NOT_PRINTED",
          receivedByUserId: userId ?? "system",
        }
      })

      return { txnNumber, rcrId: rcr.id, session }
    })

    // 2. Mark session COMPLETED
    await prisma.executionSession.update({
      where: { id },
      data: {
        status: "COMPLETED",
        serialNumber: serialNumber || "SYSTEM_PROCESSED",
        usedDeviceIds: usedDeviceIds || {},
        sourceMetadata: sourceMetadata || {},
        endedAt: new Date(),
      }
    })

    await writeAuditLog({
      action: "EXECUTION_CONFIRMED",
      entityType: "ExecutionSession",
      entityId: id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { transactionNumber: result.txnNumber },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      transactionNumber: result.txnNumber,
      status: "COMPLETED"
    })
  } catch (err) {
    console.error("[confirm] error:", err)
    return NextResponse.json(toErrorResponse(err), { status: 400 })
  }
}

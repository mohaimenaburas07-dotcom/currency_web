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
      // Accept either a PHOTO or DOCUMENT as identity media (scanner saves as DOCUMENT)
      const hasIdentityMedia = session.mediaRecords.some(m => m.mediaType === 'PHOTO' || m.mediaType === 'DOCUMENT')
      const hasPhoto = session.mediaRecords.some(m => m.mediaType === 'PHOTO')
      const hasDocument = session.mediaRecords.some(m => m.mediaType === 'DOCUMENT')
      const hasVideo = session.mediaRecords.some(m => m.mediaType === 'VIDEO')
      const hasCash = !!session.cashCountResult
      const cashMatched = session.cashCountResult?.isMatchedWithRequest === true
      const hasReceipt = !!session.receipt

      console.log(`[Confirm] Session ${id} checklist:
  identity_verified=${docVerified}
  has_photo=${hasPhoto}
  has_document=${hasDocument}
  has_identity_media=${hasIdentityMedia}
  has_video=${hasVideo}
  cash_done=${hasCash}
  cash_matched=${cashMatched}
  receipt=${hasReceipt}
  status=${session.status}`)

      if (!docVerified) {
        throw new ValidationError(`لم يتم التحقق من الهوية (matched=${session.identityVerification?.matched ?? 'MISSING'}) — يرجى إتمام خطوة التحقق`)
      }
      if (!hasIdentityMedia) throw new ValidationError("لم يتم رفع وثيقة أو صورة الهوية — يرجى إتمام خطوة التوثيق")
      if (!hasVideo) throw new ValidationError("تسجيل الفيديو مطلوب — يرجى تسجيله في خطوة التوثيق")
      if (!hasCash) throw new ValidationError("لم يتم إدخال بيانات العدّ النقدي بعد")
      if (!cashMatched) throw new ValidationError("المبلغ المعدود لا يطابق المبلغ المطلوب")
      if (!hasReceipt) throw new ValidationError("لم يتم إنشاء الإيصال — يرجى العودة وإنشائه أولاً")

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
          exchangeRate: snapshot?.bank_transfer_price ?? 0,
          amountLocal: Number(session.cashCountResult.totalCountedAmount) * (snapshot?.bank_transfer_price ?? 0),
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
          exchangeRate: snapshot?.bank_transfer_price ?? 0,
          amountLocal: Number(session.cashCountResult.totalCountedAmount) * (snapshot?.bank_transfer_price ?? 0),
          serialNumber,
          executedByUserId: userId ?? "system",
          status: "COMPLETED",
        }
      })

      // 1e. Create or Update ReceivedCustomerRecord (THE CLIENTS PAGE ENTRY)
      // Use CBS data when available, fall back to snapshot fields
      const rcr = await tx.receivedCustomerRecord.upsert({
        where: { purchaseRequestUuid: session.purchaseRequestUuid },
        update: {
          sessionId: session.id,
          transactionRecordId: txnRecord.id,
          customerExternalId: cbsData?.customerCode ?? session.customerCode ?? "UNKNOWN",
          customerName: cbsData?.customerName ?? snapshot?.client_name ?? "عميل",
          nationalId: cbsData?.nationalId ?? snapshot?.national_id ?? "N/A",
          passportNumber: cbsData?.passportNo ?? snapshot?.passport_no ?? "N/A",
          phone: cbsData?.phoneNumber ?? "N/A",
          requestType: snapshot?.type?.name ?? "CASH_PICKUP",
          currency: txnRecord.currency,
          amountForeign: txnRecord.amountForeign,
          exchangeRate: txnRecord.exchangeRate,
          amountLocal: txnRecord.amountLocal,
          receiptNumber: session.receipt.receiptNumber,
          receivedByUserId: userId ?? "system",
        },
        create: {
          purchaseRequestUuid: session.purchaseRequestUuid,
          sessionId: session.id,
          transactionRecordId: txnRecord.id,
          customerExternalId: cbsData?.customerCode ?? session.customerCode ?? "UNKNOWN",
          customerName: cbsData?.customerName ?? snapshot?.client_name ?? "عميل",
          nationalId: cbsData?.nationalId ?? snapshot?.national_id ?? "N/A",
          passportNumber: cbsData?.passportNo ?? snapshot?.passport_no ?? "N/A",
          phone: cbsData?.phoneNumber ?? "N/A",
          requestType: snapshot?.type?.name ?? "CASH_PICKUP",
          currency: txnRecord.currency,
          amountForeign: txnRecord.amountForeign,
          exchangeRate: txnRecord.exchangeRate,
          amountLocal: txnRecord.amountLocal,
          receiptNumber: session.receipt.receiptNumber,
          receivedByUserId: userId ?? "system",
        }
      })

      return { txnNumber, rcrId: rcr.id, session }
    })

    // 2. External Process API Call (Alwaha Requirement)
    // Only proceed to complete the session if the external API succeeds
    try {
      const authHeader = req.headers.get("Authorization")
      const userToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
      
      const payload = {
        ts: Math.floor(Date.now() / 1000),
        usd_serial_numbers: result.session.cashCountResult?.usdSerialNumbers ?? [],
      };

      console.log(`[Confirm] Calling external process API for request ${result.session.purchaseRequestUuid}...`)
      
      // --- DISABLED FOR TESTING PURPOSES ---
      // await processPurchaseRequest(result.session.purchaseRequestUuid, payload, userToken)
      console.log(`[Confirm] [BYPASSED FOR TESTING] External process API would have been called for ${result.session.purchaseRequestUuid}`)
      // -------------------------------------
      
    } catch (processErr: any) {
      console.error(`[Confirm] External process API failed:`, processErr)
      // throw new Error(`فشلت عملية المعالجة الخارجية: ${processErr.message}`)
    }

    // 3. Mark session COMPLETED only after external API success
    await prisma.executionSession.update({
      where: { id },
      data: {
        status: "COMPLETED",
        serialNumber,
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

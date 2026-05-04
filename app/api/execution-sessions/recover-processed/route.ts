// app/api/execution-sessions/recover-processed/route.ts
// Safe recovery of FCMS-processed requests that are missing/incomplete locally.
// NEVER calls FCMS /process. Only creates/resumes local documentation sessions.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchPurchaseRequestByUuid } from "@/lib/fxApiClient"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Returns true only if the FCMS request state clearly indicates it was already processed */
function isFcmsRequestProcessed(req: any): boolean {
  const code: string = (req?.state?.code ?? "").toLowerCase()
  const name: string = req?.state?.name ?? ""
  const processedAt = req?.processed_at ?? req?.processedAt ?? null
  return (
    code.includes("process") ||
    name.includes("تمت") ||
    name.includes("منفذ") ||
    name.includes("processed") ||
    !!processedAt
  )
}

export async function POST(req: NextRequest) {
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    const body = await req.json().catch(() => ({}))
    const query: string = (body.query ?? "").trim()

    if (!query) {
      return NextResponse.json(
        { success: false, message: "يرجى إدخال رقم الطلب أو الرقم المرجعي أو الرقم الوطني" },
        { status: 400 }
      )
    }

    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    // ── 1. Search local DB ──────────────────────────────────────────────────
    let localSession: any = null

    // By UUID
    if (UUID_PATTERN.test(query)) {
      localSession = await prisma.executionSession.findFirst({
        where: { purchaseRequestUuid: query },
        orderBy: { createdAt: "desc" },
      })
    }

    // By customerNid or reference if no UUID match
    if (!localSession) {
      localSession = await prisma.executionSession.findFirst({
        where: {
          OR: [
            { customerNid: query },
            { reference: query },
          ],
        },
        orderBy: { createdAt: "desc" },
      })
    }

    if (localSession) {
      if (localSession.status === "COMPLETED") {
        return NextResponse.json({
          success: true,
          message: "الطلب مكتمل محلياً بالفعل",
          sessionId: localSession.id,
          completed: true,
          action: "OPEN_CUSTOMER_OR_SESSION",
        })
      }
      return NextResponse.json({
        success: true,
        message: "تم العثور على جلسة محلية غير مكتملة، يمكنك استكمالها",
        sessionId: localSession.id,
        completed: false,
        action: "RESUME_EXISTING",
      })
    }

    // ── 2. Search FCMS ──────────────────────────────────────────────────────
    if (!UUID_PATTERN.test(query)) {
      return NextResponse.json(
        {
          success: false,
          message: "لم يتم العثور على جلسة محلية. لإجراء البحث في المنظومة، يرجى إدخال UUID الطلب.",
        },
        { status: 404 }
      )
    }

    let fcmsRequest: any
    try {
      fcmsRequest = await fetchPurchaseRequestByUuid(query, token)
    } catch (err: any) {
      return NextResponse.json(
        { success: false, message: `تعذر العثور على الطلب في المنظومة: ${err.message}` },
        { status: 404 }
      )
    }

    // ── 3. Verify FCMS state is processed ──────────────────────────────────
    if (!isFcmsRequestProcessed(fcmsRequest)) {
      return NextResponse.json(
        { success: false, message: "لا يمكن الاسترجاع لأن الطلب غير منفذ في المنظومة" },
        { status: 409 }
      )
    }

    // ── 4. Guard: no duplicate session ────────────────────────────────────
    const existingCheck = await prisma.executionSession.findFirst({
      where: { purchaseRequestUuid: query },
    })
    if (existingCheck) {
      return NextResponse.json({
        success: true,
        message: "تم العثور على جلسة محلية موجودة مسبقاً، يمكنك استكمالها",
        sessionId: existingCheck.id,
        completed: existingCheck.status === "COMPLETED",
        action: existingCheck.status === "COMPLETED" ? "OPEN_CUSTOMER_OR_SESSION" : "RESUME_EXISTING",
      })
    }

    // ── 5. Create recovery session ─────────────────────────────────────────
    const snap = fcmsRequest
    const user = snap?.bankAccount?.user || {}
    const amountRequested = snap?.amount_requested ? parseFloat(snap.amount_requested) : 0
    const currency = snap?.contract?.currency_code ?? snap?.currency ?? "USD"
    const rate = snap?.exchange_rate?.rate ?? snap?.contract?.bank_transfer_price ?? snap?.bank_transfer_price ?? 0

    const fullNameAr = user.full_name ||
      `${user.first_name || ""} ${user.father_name || ""} ${user.grandfather_name || ""} ${user.last_name || ""}`.trim()

    const userId = body.userId ?? "system"

    const session = await prisma.executionSession.create({
      data: {
        purchaseRequestUuid: query,
        requestSnapshot: snap,
        fcmsRequestSnapshot: snap,
        processSnapshot: {
          status: "SUCCESS",
          source: "RECOVERED_FROM_FCMS_PROCESSED",
          processed: true,
          recoveredAt: new Date().toISOString(),
          fcmsResponse: snap,
        },
        status: "RECORDING",
        verificationStatus: "DONE",
        countingStatus: "DONE",
        cameraStatus: "PENDING",
        receiptStatus: "PENDING",
        startedByUserId: userId,
        reference: snap?.reference ?? null,
        amountRequested: amountRequested || null,
        requestStateCode: snap?.state?.code ?? null,
        requestStateName: snap?.state?.name ?? null,
        requestTypeCode: snap?.type?.code ?? null,
        requestTypeName: snap?.type?.name ?? null,
        customerFullNameAr: fullNameAr || null,
        customerFullNameEn: user.full_name_en ?? null,
        customerNid: user.nid ?? null,
        customerPassportNo: user.passport_number ?? null,
        customerPhone: user.phone ?? null,
        customerBirthDate: user.birth_date ? new Date(user.birth_date) : null,
        bankAccountUuid: snap?.bankAccount?.uuid ?? null,
        iban: snap?.bankAccount?.iban ?? null,
        // Create identity verification record (matched = true for recovered sessions)
        identityVerification: {
          create: {
            documentType: "RECOVERED",
            documentNumber: user.nid ?? user.passport_number ?? "RECOVERED",
            customerName: fullNameAr || null,
            nationalId: user.nid ?? null,
            passportNumber: user.passport_number ?? null,
            matched: true,
            verifiedByUserId: userId,
          }
        },
        // Create cash count result from FCMS data so confirm validation passes
        cashCountResult: {
          create: {
            currency,
            totalCountedAmount: amountRequested,
            isMatchedWithRequest: true,
            countedByUserId: userId,
            source: "RECOVERED_FROM_FCMS",
            usdSerialNumbers: [],
          }
        },
      },
    })

    await writeAuditLog({
      action: "FCMS_RECOVERY_SESSION_CREATED",
      entityType: "ExecutionSession",
      entityId: session.id,
      sessionId: session.id,
      performedByUserId: userId,
      newValues: { purchaseRequestUuid: query, source: "RECOVERED_FROM_FCMS_PROCESSED" },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: "تم استرجاع الطلب المنفذ ويمكن استكمال التوثيق المحلي",
      sessionId: session.id,
      action: "RECOVERED",
    })
  } catch (err: any) {
    console.error("[recover-processed] error:", err)
    return NextResponse.json(
      { success: false, message: err.message || "تعذر استرجاع الطلب" },
      { status: 500 }
    )
  }
}

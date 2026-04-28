// app/api/v1/fx-houses/purchase-requests/[uuid]/start-execution/route.ts
// POST — creates an ExecutionSession for this purchase request.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchPurchaseRequestByUuid } from "@/lib/fxApiClient"
import { extractCustomerCode } from "@/lib/extractCustomerCode"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse } from "@/lib/workflowErrors"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    // 1. Check if any session exists for this request (due to unique constraint)
    const existing = await prisma.executionSession.findFirst({
      where: {
        purchaseRequestUuid: uuid,
      },
    })

    if (existing) {
      if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
        // Reset to DRAFT so user can re-execute
        await prisma.$transaction([
          // Clean up related records that have unique constraints on purchaseRequestUuid
          prisma.receivedCustomerRecord.deleteMany({ where: { purchaseRequestUuid: uuid } }),
          prisma.transactionRecord.deleteMany({ where: { purchaseRequestUuid: uuid } }),
          // Reset the session
          prisma.executionSession.update({
            where: { id: existing.id },
            data: {
              status: "DRAFT",
              verificationStatus: "PENDING",
              cameraStatus: "PENDING",
              countingStatus: "PENDING",
              receiptStatus: "PENDING",
              serialNumber: null,
              endedAt: null,
            }
          })
        ])
      }
      
      return NextResponse.json(
        {
          error:     "An execution session already exists for this request",
          code:      "SESSION_ALREADY_EXISTS",
          sessionId: existing.id,
          status:    "DRAFT",
        },
        { status: 409 }
      )
    }

    // 2. Fetch the purchase request from Spring Boot to snapshot it
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
    
    const request = await fetchPurchaseRequestByUuid(uuid, token)

    // 3. Extract customer code from raw account number in the payload
    let customerCode: string | null = null
    try {
      const accountNo = request?.bankAccount?.account_number ?? ""
      customerCode    = extractCustomerCode(accountNo)
    } catch {
      // Customer code extraction is best-effort
    }

    // 4. Create the execution session
    const body = await req.json().catch(() => ({}))
    const userId = body.userId ?? "system"

    let session: any
    try {
      session = await prisma.executionSession.create({
        data: {
          purchaseRequestUuid: uuid,
          customerCode:        customerCode ?? undefined,
          startedByUserId:     userId,
          status:              "DRAFT",
          requestSnapshot:     request as any,
        },
      })
    } catch (createErr: any) {
      // Prisma unique constraint violation (P2002) means a race condition happened
      // (e.g. React Strict Mode firing useEffect twice simultaneously)
      if (createErr.code === "P2002") {
        const existingAfterRace = await prisma.executionSession.findUnique({
          where: { purchaseRequestUuid: uuid }
        })
        return NextResponse.json(
          {
            error:     "An execution session already exists for this request",
            code:      "SESSION_ALREADY_EXISTS",
            sessionId: existingAfterRace?.id,
          },
          { status: 409 }
        )
      }
      throw createErr
    }

    // 5. Audit
    await writeAuditLog({
      action:            "EXECUTION_STARTED",
      entityType:        "ExecutionSession",
      entityId:          session.id,
      performedByUserId: userId,
      sessionId:         session.id,
      newValues:         { purchaseRequestUuid: uuid, customerCode },
      ipAddress,
      userAgent,
    })

    return NextResponse.json(
      {
        sessionId:          session.id,
        purchaseRequestUuid: uuid,
        customerCode,
        status:             session.status,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("[start-execution] POST error:", err)
    return NextResponse.json(toErrorResponse(err), { status: 500 })
  }
}

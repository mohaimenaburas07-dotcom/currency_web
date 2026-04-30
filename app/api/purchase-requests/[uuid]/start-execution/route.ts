// app/api/purchase-requests/[uuid]/start-execution/route.ts
// POST — creates an ExecutionSession for this purchase request.
//         Guards against multiple active sessions per request.

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
    // 1. Check if any session exists for this request
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
      } else {
        return NextResponse.json({ 
          success: true, 
          message: "Session already exists", 
          sessionId: existing.id,
          id: existing.id // fallback
        }, { status: 200 }) // Return 200 to avoid red console errors
      }
      
      return NextResponse.json(
        {
          sessionId: existing.id,
          purchaseRequestUuid: uuid,
          status: "DRAFT",
        },
        { status: 200 }
      )
    }

    // 2. Fetch the purchase request from Spring Boot to snapshot it
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
    
    // Fetch from CBS - but handle failure gracefully if user wants to "stop depending"
    let request: any = null;
    try {
      console.log(`[start-execution] Attempting to fetch request ${uuid} from CBS...`);
      request = await fetchPurchaseRequestByUuid(uuid, token)
    } catch (err) {
      console.warn("[start-execution] fetchPurchaseRequestByUuid failed, trying fallback lists:", err);
      
      // Attempt to find in other possible list endpoints if direct fetch failed
      try {
        const endpoints = [
          "/api/v1/fx-houses/pending-purchase-requests",
          "/api/v1/fx-houses/purchase-requests-queue"
        ];
        
        const FX_BASE = process.env.FX_HOUSE_API || "https://fcms-banks.cbl.gov.ly";
        
        for (const endpoint of endpoints) {
          console.log(`[start-execution] Searching in ${endpoint}...`);
          const res = await fetch(`${FX_BASE}${endpoint}?page=1`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const json = await res.json();
            const found = json.data.find((r: any) => r.uuid === uuid);
            if (found) {
              console.log(`[start-execution] Found request in ${endpoint}`);
              request = found;
              break;
            }
          }
        }
      } catch (fallbackErr) {
        console.error("[start-execution] Fallback list search failed:", fallbackErr);
      }

      if (!request) {
        console.warn("[start-execution] CBS search failed completely, trying local DB fallback");
        // Try to find in local fx_requests as a fallback
        const localReq = await prisma.fx_requests.findFirst({
          where: { id: uuid }
        });
        if (localReq) {
          request = localReq;
        } else {
          console.error("[start-execution] No data found for request:", uuid);
          throw new Error(`تعذر العثور على بيانات الطلب ${uuid} في النظام المركزي أو المحلي`);
        }
      }
    }

    // 3. Extract customer code from raw account number in the payload
    let customerCode: string | null = null
    try {
      const rawJson   = JSON.parse(request.rawJson ?? "{}")
      const accountNo = rawJson?.bankAccount?.account_number ?? ""
      customerCode    = extractCustomerCode(accountNo)
    } catch {
      // Customer code extraction is best-effort
    }

    // 4. Create the execution session
    const body = await req.json().catch(() => ({}))
    const userId = body.userId ?? "system"

    const session = await prisma.executionSession.create({
      data: {
        purchaseRequestUuid: uuid,
        customerCode:        customerCode ?? undefined,
        startedByUserId:     userId,
        status:              "DRAFT",
        requestSnapshot:     request, // Use the object directly as snapshot
      },
    })

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

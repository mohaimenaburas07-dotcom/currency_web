// app/api/purchase-requests/[uuid]/start-execution/route.ts
// POST — creates an ExecutionSession for this purchase request.
//         Guards against multiple active sessions per request.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchPurchaseRequestByUuid } from "@/lib/fxApiClient"
import { findFixturePayloadByPurchaseUuid } from "@/lib/fcmsDbFixtures"
import { extractCustomerCode } from "@/lib/extractCustomerCode"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse } from "@/lib/workflowErrors"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)
  const body = await req.json().catch(() => ({}))

  try {
    // 1. Check if any session exists for this request
    const existing = await prisma.executionSession.findFirst({
      where: {
        purchaseRequestUuid: uuid,
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          sessionId: existing.id,
          purchaseRequestUuid: uuid,
          status: existing.status,
          message: "Session already exists"
        },
        { status: 200 }
      )
    }

    // 2. Fetch or Use provided snapshot
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
    
    let request: any = body.requestSnapshot || null;
    
    if (request) {
      console.log(`[start-execution] Using provided snapshot for ${uuid}`);
    } else {
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
          const fixturePayload = await findFixturePayloadByPurchaseUuid(uuid)
          if (fixturePayload) {
            request = fixturePayload
          } else {
            const localReq = await prisma.fx_requests.findFirst({
              where: { id: uuid },
            })
            if (localReq) {
              request = localReq
            } else {
              console.error("[start-execution] No data found for request:", uuid)
              throw new Error(`تعذر العثور على بيانات الطلب ${uuid} في النظام المركزي أو المحلي`)
            }
          }
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

    // 3. Create the execution session
    const userId = body.userId ?? "system"
    const user = request.bankAccount?.user || {}

    const session = await prisma.executionSession.create({
      data: {
        purchaseRequestUuid: uuid,
        customerCode:        customerCode ?? undefined,
        startedByUserId:     userId,
        status:              "DRAFT",
        requestSnapshot:     request,
        fcmsRequestSnapshot: request,
        
        // Map FCMS Data
        reference:           request.reference,
        amountRequested:     request.amount_requested ? parseFloat(request.amount_requested) : null,
        requestStateCode:    request.state?.code,
        requestStateName:    request.state?.name,
        requestTypeCode:     request.type?.code,
        requestTypeName:     request.type?.name,

        customerFullNameAr:  user.full_name || `${user.first_name || ""} ${user.father_name || ""} ${user.grandfather_name || ""} ${user.last_name || ""}`.trim(),
        customerFullNameEn:  user.full_name_en,
        customerNid:         user.nid,
        customerPassportNo:  user.passport_number,
        customerPhone:       user.phone,
        customerBirthDate:   user.birth_date ? new Date(user.birth_date) : null,
        passportExpiryDate:  user.passport_expiry_date ? new Date(user.passport_expiry_date) : null,

        bankAccountUuid:     request.bankAccount?.uuid,
        iban:                request.bankAccount?.iban,
        bankAccountStateCode: request.bankAccount?.state?.code,
        bankAccountStateName: request.bankAccount?.state?.name,

        companyUuid:         request.company?.uuid,
        companyName:         request.company?.name,
        companyCblKey:       request.company?.cbl_key,
        companyAccountNumber: request.company?.bank_account?.account_number,
        companyIban:         request.company?.bank_account?.iban,

        depositTypeCode:     request.deposit_type?.code,
        depositTypeName:     request.deposit_type?.name,
        passportAttached:    request.passport_attached,
        fcmsTimestamp:       request.timestamp,
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

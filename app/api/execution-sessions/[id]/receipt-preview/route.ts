// app/api/execution-sessions/[id]/receipt-preview/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchCustomerFromCBS } from "@/lib/cbsApiClient"
import { toErrorResponse, ValidationError } from "@/lib/workflowErrors"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await prisma.executionSession.findUniqueOrThrow({
      where: { id },
      include: {
        cashCountResult: { include: { denominations: true } },
      }
    })

    if (!session.customerCode) {
      throw new ValidationError("Customer code not found in session")
    }

    const authHeader = _req.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    const cbsData = await fetchCustomerFromCBS(session.customerCode, token)
    const snapshot = session.requestSnapshot as any

    const preview = {
      receiptNumber: session.receiptStatus === "DONE" ? "EXISTING" : `PRE-${Date.now()}`,
      executionDate: new Date(),
      customer: {
        name: cbsData.customerName,
        nationalId: cbsData.nationalId,
        passportNumber: cbsData.passportNo,
        phone: cbsData.phoneNumber,
      },
      transaction: {
        currency: session.cashCountResult?.currency ?? "USD",
        amountForeign: session.cashCountResult?.totalCountedAmount ?? 0,
        exchangeRate: snapshot?.bank_transfer_price ?? 0,
        amountLocal: Number(session.cashCountResult?.totalCountedAmount ?? 0) * (snapshot?.bank_transfer_price ?? 0),
      },
      denominations: session.cashCountResult?.denominations ?? [],
      executorName: "Current User", // Frontend should replace this
      branchName: cbsData.branch,
    }

    return NextResponse.json(preview)
  } catch (err) {
    return NextResponse.json(toErrorResponse(err), { status: 400 })
  }
}

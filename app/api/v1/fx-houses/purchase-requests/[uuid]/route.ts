// app/api/v1/fx-houses/purchase-requests/[uuid]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { fetchPurchaseRequestByUuid } from "@/lib/fxApiClient"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    const data = await fetchPurchaseRequestByUuid(uuid, token)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[v1/purchase-requests/:uuid] GET error:", err)
    return NextResponse.json(
      { error: "Purchase request not found" },
      { status: 404 }
    )
  }
}

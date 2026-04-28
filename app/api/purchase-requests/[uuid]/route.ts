// app/api/purchase-requests/[uuid]/route.ts
// GET — fetch a single purchase request by UUID from Spring Boot

import { NextRequest, NextResponse } from "next/server"
import { fetchPurchaseRequestByUuid } from "@/lib/fxApiClient"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    const data = await fetchPurchaseRequestByUuid(uuid)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[purchase-requests/:uuid] GET error:", err)
    return NextResponse.json(
      { error: "Purchase request not found" },
      { status: 404 }
    )
  }
}

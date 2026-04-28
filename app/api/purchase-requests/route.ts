// app/api/purchase-requests/route.ts
// GET  — proxies to Spring Boot FX API (no changes to Spring Boot)

import { NextRequest, NextResponse } from "next/server"
import { fetchPurchaseRequests } from "@/lib/fxApiClient"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const params: Record<string, string> = {}
    for (const [key, val] of searchParams.entries()) {
      params[key] = val
    }

    const result = await fetchPurchaseRequests(params)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[purchase-requests] GET error:", err)
    return NextResponse.json(
      { error: "Failed to fetch purchase requests" },
      { status: 502 }
    )
  }
}

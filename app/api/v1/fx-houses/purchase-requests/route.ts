// app/api/v1/fx-houses/purchase-requests/route.ts
// Proxy for purchase requests - captures calls from the existing frontend

import { NextRequest, NextResponse } from "next/server"
import { fetchPurchaseRequests } from "@/lib/fxApiClient"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined

    const { searchParams } = new URL(req.url)

    const params: Record<string, string> = {}
    for (const [key, val] of searchParams.entries()) {
      params[key] = val
    }

    const result = await fetchPurchaseRequests(params, token)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[v1/purchase-requests] GET error:", err)
    return NextResponse.json(
      { error: "Failed to fetch purchase requests" },
      { status: 502 }
    )
  }
}

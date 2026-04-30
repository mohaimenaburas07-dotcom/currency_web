import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = searchParams.get("page") || "1"

  const FX_BASE = process.env.FX_HOUSE_API || "https://fcms-banks.cbl.gov.ly"
  const token = process.env.FX_HOUSE_TOKEN

  try {
    const targetUrl = `${FX_BASE}/api/v1/fx-houses/purchase-requests-queue?page=${page}`
    console.log(`[Queue] Proxying to: ${targetUrl}`)
    
    const res = await fetch(targetUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json({ error: `CBS API error: ${res.status}`, details: errorText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[Queue Proxy Error]", error)
    return NextResponse.json({ error: "Failed to connect to CBS API" }, { status: 500 })
  }
}

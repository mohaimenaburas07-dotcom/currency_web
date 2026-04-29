import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params
  const body = await req.json()
  const { ts, usd_serial_numbers } = body

  const FX_BASE = process.env.FX_HOUSE_API || "https://fcms-banks.cbl.gov.ly"
  const token = process.env.FX_HOUSE_TOKEN

  try {
    const res = await fetch(`${FX_BASE}/api/v1/fx-houses/purchase-requests/${uuid}/process`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        ts: ts || Math.floor(Date.now() / 1000),
        usd_serial_numbers: usd_serial_numbers || []
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      return NextResponse.json({ error: `CBS API error: ${res.status}`, details: errorText }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[ProcessRequest Proxy Error]", error)
    return NextResponse.json({ error: "Failed to connect to CBS API" }, { status: 500 })
  }
}

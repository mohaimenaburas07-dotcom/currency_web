import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params
  const body = await req.json()

  const baseUrl = process.env.FX_HOUSE_API || "https://fcms-banks.cbl.gov.ly"
  const token = process.env.FX_HOUSE_TOKEN

  try {
    const targetUrl = `${baseUrl}/api/v1/fx-houses/purchase-requests/${uuid}/process`
    console.log(`[Process] Proxying to: ${targetUrl}`)
    
    const res = await fetch(
      targetUrl,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: JSON.stringify({
          ts: body.ts || Math.floor(Date.now() / 1000),
          usd_serial_numbers: body.usd_serial_numbers || [],
        }),
      }
    )

    const text = await res.text()

    if (!res.ok) {
      console.error("[Process Proxy Error]", res.status, text)
      return new Response(text || `FX process failed ${res.status}`, { status: res.status })
    }

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("[ProcessRequest Proxy Error]", error)
    return NextResponse.json({ error: "Failed to connect to CBS API" }, { status: 500 })
  }
}

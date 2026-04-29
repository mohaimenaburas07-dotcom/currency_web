import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get("filter[reference]")
  const phone = searchParams.get("filter[phone]")
  const nid = searchParams.get("filter[nid]")
  const page = searchParams.get("page") || "1"

  const FX_BASE = process.env.FX_HOUSE_API || "https://fcms-banks.cbl.gov.ly"
  const token = process.env.FX_HOUSE_TOKEN

  const query = new URLSearchParams()
  if (reference) query.set("filter[reference]", reference)
  if (phone) query.set("filter[phone]", phone)
  if (nid) query.set("filter[nid]", nid)
  query.set("page", page)

  try {
    const res = await fetch(`${FX_BASE}/api/v1/fx-houses/pending-purchase-requests?${query.toString()}`, {
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
    console.error("[PendingRequests Proxy Error]", error)
    return NextResponse.json({ error: "Failed to connect to CBS API" }, { status: 500 })
  }
}

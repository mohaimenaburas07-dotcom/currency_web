import { NextRequest, NextResponse } from "next/server"
import {
  filterFixturePayloads,
  getPendingFixturePayloads,
  paginateFixturePayloads,
} from "@/lib/fcmsDbFixtures"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get("filter[reference]")
  const phone = searchParams.get("filter[phone]")
  const nid = searchParams.get("filter[nid]")
  const page = searchParams.get("page") || "1"

  const useMock =
    process.env.MOCK_FCMS === "1" ||
    process.env.MOCK_FCMS === "true"

  if (useMock) {
    try {
      const raw = await getPendingFixturePayloads()
      const filtered = filterFixturePayloads(raw, reference, phone, nid)
      const body = paginateFixturePayloads(filtered, parseInt(page, 10) || 1)
      return NextResponse.json(body)
    } catch (e) {
      console.error("[PendingRequests] MOCK_FCMS fixture error:", e)
      return NextResponse.json({ error: "Failed to load FCMS fixtures from DB" }, { status: 500 })
    }
  }

  const FX_BASE = process.env.FX_HOUSE_API || "https://fcms-banks.cbl.gov.ly"
  const token = process.env.FX_HOUSE_TOKEN

  const query = new URLSearchParams()
  if (reference) query.set("filter[reference]", reference)
  if (phone) query.set("filter[phone]", phone)
  if (nid) query.set("filter[nid]", nid)
  query.set("page", page)

  try {
    const targetUrl = `${FX_BASE}/api/v1/fx-houses/pending-purchase-requests?${query.toString()}`
    console.log(`[PendingRequests] Proxying to: ${targetUrl}`)
    
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
    console.error("[PendingRequests Proxy Error]", error)
    return NextResponse.json({ error: "Failed to connect to CBS API" }, { status: 500 })
  }
}

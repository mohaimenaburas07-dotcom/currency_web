// lib/cbsApiClient.ts
// Calls the Smart Bank Core Banking System (CBS) to fetch customer identity data.
// The Spring Boot project is NOT modified — this calls CBS directly.

const CBS_BASE = process.env.CBS_API ?? "http://10.30.1.20:3000"

export interface CbsCustomerData {
  customerCode: string
  customerName: string
  nationalId: string
  passportNo: string
  phoneNumber: string
  branch: string
}

export async function fetchCustomerFromCBS(
  customerCode: string,
  token?: string
): Promise<CbsCustomerData> {
  // Strip leading zeros as CBS API rejects them, even if they exist in older DB records
  const cleanCustomerCode = parseInt(customerCode, 10).toString()
  const url = `${CBS_BASE}/api/smart-bank/customer/${cleanCustomerCode}/accounts/query/`

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  
  // Prefer a dedicated CBS machine token from .env, fallback to user token
  const cbsToken = process.env.CBS_AUTH_TOKEN || token
  if (cbsToken) {
    headers["Authorization"] = `Bearer ${cbsToken}`
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
    // Short timeout — if CBS is down we fail fast, not block confirmation
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) {
    throw new Error(`CBS API error ${res.status} for customer ${customerCode}`)
  }

  const json = await res.json()

  if (json.status !== 200 || !Array.isArray(json.data) || json.data.length === 0) {
    throw new Error(`CBS returned no data for customer ${customerCode}`)
  }

  // All account records share the same customer identity — use first record
  const d = json.data[0]
  return {
    customerCode: d.customerCode ?? customerCode,
    customerName: d.customerName ?? "",
    nationalId:   d.nationalId   ?? "",
    passportNo:   d.passportNo   ?? "",
    phoneNumber:  d.phoneNumber  ?? "",
    branch:       d.branch       ?? "",
  }
}

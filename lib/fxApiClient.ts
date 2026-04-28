// lib/fxApiClient.ts
// Proxies requests to the Spring Boot FX API.

const SPRING_BOOT = process.env.SPRING_BOOT_API || process.env.CBS_API || "http://localhost:8080"

function getHeaders(userToken?: string) {
  // Priority: 1. Passed token, 2. Env token
  const token = userToken || process.env.CBS_AUTH_TOKEN;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  }
}

export interface FxPurchaseRequest {
  uuid: string // Using UUID as seen in logs
  reference: string
  currency: string
  amount_requested: string
  state: any
  user_name?: string
  bankAccount?: any
  contract?: any
  rawJson?: string
  created_at: string
}

export interface FxPaginatedResponse {
  data: FxPurchaseRequest[]
  meta?: {
    current_page: number
    last_page: number
    total: number
  }
}

export async function fetchPurchaseRequests(
  params: Record<string, string>,
  userToken?: string
): Promise<FxPaginatedResponse> {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(
    `${SPRING_BOOT}/api/v1/fx-houses/purchase-requests?${qs}`,
    { headers: getHeaders(userToken) }
  )
  if (!res.ok) throw new Error(`FX API error ${res.status}`)
  return res.json()
}

export async function fetchPurchaseRequestByUuid(
  uuid: string,
  userToken?: string
): Promise<FxPurchaseRequest> {
  const res = await fetch(
    `${SPRING_BOOT}/api/v1/fx-houses/purchase-requests/${uuid}`,
    { headers: getHeaders(userToken) }
  )
  if (!res.ok) throw new Error(`FX API error ${res.status} for request ${uuid}`)
  return res.json()
}

export async function processPurchaseRequest(
  uuid: string,
  payload: { ts: number; usd_serial_numbers: string[] },
  _userToken?: string
): Promise<any> {
  const processUrl = process.env.FX_HOUSE_PROCESS_URL || `${SPRING_BOOT}/api/v1/fx-houses/purchase-requests`
  const serviceToken = process.env.FX_HOUSE_TOKEN
  
  console.log(`[FX_API] Processing request ${uuid} at ${processUrl}`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(
      `${processUrl}/${uuid}/process`,
      { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceToken}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        // @ts-ignore - Node fetch specific to allow self-signed on internal IPs
        rejectUnauthorized: false 
      }
    ).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `FX House Process API error ${res.status}`)
    }
    return res.json()
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error("تجاوز الطلب الوقت المحدد (10 ثوانٍ) — تأكد من اتصال الشبكة بالخدمة الخارجية")
    }
    console.error("[FX_API] Fetch error:", err);
    throw new Error(`تعذر الاتصال بخدمة المعالجة الخارجية (${processUrl}): ${err.message}`)
  }
}

// lib/fxApiClient.ts
// Proxies requests to the Spring Boot FX API.

const FX_BASE =
  process.env.FX_HOUSE_API ||
  process.env.SPRING_BOOT_API ||
  "http://localhost:8080"

function getHeaders(userToken?: string) {
  const token = process.env.FX_HOUSE_TOKEN || userToken

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    `${FX_BASE}/api/v1/fx-houses/purchase-requests?${qs}`,
    { headers: getHeaders(userToken) }
  )
  if (!res.ok) throw new Error(`FX API error ${res.status}`)
  return res.json()
}

export async function fetchPurchaseRequestByUuid(
  uuid: string,
  userToken?: string
): Promise<FxPurchaseRequest> {
  const headers = getHeaders(userToken);
  
  // Source 1: Direct fetch by UUID
  try {
    const res = await fetch(`${FX_BASE}/api/v1/fx-houses/purchase-requests/${uuid}`, { headers });
    if (res.ok) return res.json();
  } catch (err) {
    console.warn(`[FX_API] Source 1 (Direct) failed for ${uuid}`);
  }

  // Source 2: Search in queue
  try {
    const res = await fetch(`${FX_BASE}/api/v1/fx-houses/purchase-requests-queue?page=1`, { headers });
    if (res.ok) {
      const json = await res.json();
      const found = json.data.find((r: any) => (r.uuid || r.id) === uuid);
      if (found) return found;
    }
  } catch (err) {
    console.warn(`[FX_API] Source 2 (Queue) failed for ${uuid}`);
  }

  // Source 3: Search in pending
  try {
    const res = await fetch(`${FX_BASE}/api/v1/fx-houses/pending-purchase-requests?page=1`, { headers });
    if (res.ok) {
      const json = await res.json();
      const found = json.data.find((r: any) => (r.uuid || r.id) === uuid);
      if (found) return found;
    }
  } catch (err) {
    console.warn(`[FX_API] Source 3 (Pending) failed for ${uuid}`);
  }

  throw new Error(`تعذر العثور على الطلب ${uuid} في جميع المصادر المتاحة`);
}

export async function processPurchaseRequest(
  uuid: string,
  payload: { ts: number; usd_serial_numbers: string[] },
  _userToken?: string
): Promise<any> {
  const processUrl =
    process.env.FX_HOUSE_PROCESS_URL ||
    `${FX_BASE}/api/v1/fx-houses/purchase-requests`
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

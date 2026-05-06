import { prisma } from "@/lib/prisma"

export type FcmsListKind = "pending" | "queue"

function matchesFilters(row: Record<string, unknown>, reference?: string | null, phone?: string | null, nid?: string | null): boolean {
  const payload = row as {
    reference?: string
    bankAccount?: { user?: { phone?: string; nid?: string } }
  }
  if (reference) {
    const ref = (payload.reference ?? "").toString().toLowerCase()
    if (!ref.includes(reference.toLowerCase())) return false
  }
  if (phone) {
    const p = (payload.bankAccount?.user?.phone ?? "").toString().replace(/\s/g, "")
    if (!p.includes(phone.replace(/\s/g, ""))) return false
  }
  if (nid) {
    const n = (payload.bankAccount?.user?.nid ?? "").toString()
    if (!n.includes(nid)) return false
  }
  return true
}

/** Rows that appear on the pending-purchase-requests list */
export async function getPendingFixturePayloads(): Promise<Record<string, unknown>[]> {
  const rows = await prisma.fcmsRequestFixture.findMany({
    where: {
      OR: [{ listKind: "pending" }, { listKind: "both" }],
    },
    orderBy: { sortOrder: "asc" },
  })
  return rows.map((r) => r.payload as Record<string, unknown>)
}

/** Rows that appear on the purchase-requests-queue list */
export async function getQueueFixturePayloads(): Promise<Record<string, unknown>[]> {
  const rows = await prisma.fcmsRequestFixture.findMany({
    where: {
      OR: [{ listKind: "queue" }, { listKind: "both" }],
    },
    orderBy: { sortOrder: "asc" },
  })
  return rows.map((r) => r.payload as Record<string, unknown>)
}

export function filterFixturePayloads(
  payloads: Record<string, unknown>[],
  reference?: string | null,
  phone?: string | null,
  nid?: string | null
): Record<string, unknown>[] {
  if (!reference && !phone && !nid) return payloads
  return payloads.filter((p) => matchesFilters(p, reference, phone, nid))
}

export function paginateFixturePayloads(
  payloads: Record<string, unknown>[],
  page: number,
  perPage = 15
): { data: Record<string, unknown>[]; meta: { current_page: number; last_page: number; total: number; per_page: number } } {
  const total = payloads.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(1, page), lastPage)
  const start = (currentPage - 1) * perPage
  const data = payloads.slice(start, start + perPage)
  return {
    data,
    meta: {
      current_page: currentPage,
      last_page: lastPage,
      total,
      per_page: perPage,
    },
  }
}

export async function findFixturePayloadByPurchaseUuid(uuid: string): Promise<Record<string, unknown> | null> {
  const row = await prisma.fcmsRequestFixture.findUnique({
    where: { purchaseUuid: uuid },
  })
  if (!row) return null
  return row.payload as Record<string, unknown>
}

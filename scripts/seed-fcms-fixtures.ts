/**
 * Seeds FCMS-shaped JSON fixtures into `fcms_request_fixtures`.
 *
 * Usage: npx tsx scripts/seed-fcms-fixtures.ts
 *
 * To use them instead of the real CBS API, set in `.env`:
 *   MOCK_FCMS=1
 *
 * Then `/api/fx/pending-requests` and `/api/fx/queue` return these rows.
 * `POST /api/purchase-requests/:uuid/start-execution` resolves snapshots from here when CBS is unreachable.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function basePayload(
  purchaseUuid: string,
  reference: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const {
    bankUser: bankUserOverrides,
    bankAccount: bankAccountOverrides,
    company: companyOverrides,
    ...scalarOverrides
  } = overrides as {
    bankUser?: Record<string, string>
    bankAccount?: Record<string, unknown>
    company?: Record<string, unknown>
    [key: string]: unknown
  }

  const bankUser = {
    full_name: "أحمد محمد علي الفيتوري",
    full_name_en: "Ahmed Mohammed Ali Al-Faitouri",
    nid: "11990123456",
    phone: "0913555123",
    birth_date: "1991-06-15",
    passport_number: "LY1234567",
    passport_expiry_date: "2032-03-20",
    ...(bankUserOverrides || {}),
  }

  return {
    uuid: purchaseUuid,
    reference,
    currency: "USD",
    amount_requested: "4000.00",
    rate: "5.150000",
    state: { code: "pending_bank_execution", name: "بانتظار تنفيذ المصرف" },
    type: { code: 1, name: "شراء عملة" },
    timestamp: Math.floor(Date.now() / 1000),
    passport_attached: true,
    bankAccount: {
      uuid: `ba-${purchaseUuid.slice(0, 8)}`,
      iban: "LY83 0021 0012 0000 0012 3456 789",
      state: { code: "verified", name: "حساب موثق" },
      user: bankUser,
      ...(bankAccountOverrides || {}),
    },
    company: {
      uuid: `co-${purchaseUuid.slice(0, 8)}`,
      name: "شركة السند للصرافة",
      cbl_key: "CBL-FX-9001",
      bank_account: {
        account_number: "0210099887766",
        iban: "LY83 0058 0210099887766012",
      },
      ...(companyOverrides || {}),
    },
    deposit_type: { code: "cash_usd", name: "إيداع نقدي USD" },
    rawJson: JSON.stringify({
      bankAccount: { account_number: "0210099887766123456789012345" },
      meta: { seeded: true },
    }),
    ...scalarOverrides,
  }
}

async function main() {
  const fixtures: {
    purchaseUuid: string
    listKind: string
    label: string
    sortOrder: number
    payload: Record<string, unknown>
  }[] = [
    {
      purchaseUuid: "11111111-1111-4111-8111-111111111111",
      listKind: "pending",
      label: "Pending — standard retail",
      sortOrder: 10,
      payload: basePayload(
        "11111111-1111-4111-8111-111111111111",
        "FCMS-PR-2026-01001",
        {
          amount_requested: "2500.00",
          bankUser: { nid: "11990123456", phone: "0913555123" },
        }
      ),
    },
    {
      purchaseUuid: "22222222-2222-4222-8222-222222222222",
      listKind: "pending",
      label: "Pending — larger amount",
      sortOrder: 20,
      payload: basePayload(
        "22222222-2222-4222-8222-222222222222",
        "FCMS-PR-2026-01002",
        {
          amount_requested: "18500.75",
          state: { code: "pending_bank_execution", name: "بانتظار تنفيذ المصرف" },
          bankUser: {
            full_name: "سارة عبد السلام المجرابي",
            full_name_en: "Sara Abdel Salam Al-Megrahi",
            nid: "12004567890",
            phone: "0926123456",
          },
        }
      ),
    },
    {
      purchaseUuid: "33333333-3333-4333-8333-333333333333",
      listKind: "queue",
      label: "Queue — approved, awaiting counter",
      sortOrder: 10,
      payload: basePayload(
        "33333333-3333-4333-8333-333333333333",
        "FCMS-PR-2026-02001",
        {
          amount_requested: "7200.00",
          state: { code: "approved", name: "معتمد" },
          bankUser: {
            nid: "1188776655",
            phone: "0944511223",
            full_name: "خالد عمر المبروك",
            full_name_en: "Khaled Omar Al-Mabrouk",
          },
        }
      ),
    },
    {
      purchaseUuid: "44444444-4444-4444-8444-444444444444",
      listKind: "queue",
      label: "Queue — SME corporate",
      sortOrder: 20,
      payload: basePayload(
        "44444444-4444-4444-8444-444444444444",
        "FCMS-PR-2026-02002",
        {
          amount_requested: "50000.00",
          state: { code: "approved", name: "معتمد" },
          company: {
            uuid: "co-corp-4444",
            name: "مؤسسة النور للاستيراد",
            cbl_key: "CBL-FX-7712",
            bank_account: {
              account_number: "0580099123456",
              iban: "LY83 0058 0580099123456012",
            },
          },
          bankUser: {
            nid: "1122334455",
            phone: "0912009988",
            full_name: "عمر يوسف النوري",
            full_name_en: "Omar Yousef Al-Nouri",
          },
        }
      ),
    },
    {
      purchaseUuid: "55555555-5555-4555-8555-555555555555",
      listKind: "both",
      label: "Appears on pending + queue (demo overlap)",
      sortOrder: 30,
      payload: basePayload(
        "55555555-5555-4555-8555-555555555555",
        "FCMS-PR-2026-03055",
        {
          amount_requested: "3100.50",
          state: { code: "pending_bank_execution", name: "بانتظار تنفيذ المصرف" },
          bankUser: {
            nid: "1199123000",
            phone: "0933344556",
            full_name: "ليلى حسن الزاوي",
            full_name_en: "Layla Hassan Alzawi",
          },
        }
      ),
    },
    {
      purchaseUuid: "66666666-6666-4666-8666-666666666666",
      listKind: "pending",
      label: "Pending — filters: reference/nid search demo",
      sortOrder: 40,
      payload: basePayload(
        "66666666-6666-4666-8666-666666666666",
        "FCMS-SEARCH-DEMO-99",
        {
          amount_requested: "950.25",
          bankUser: {
            nid: "99001122334",
            phone: "0911223344",
            full_name: "منير الصادق الحاسي",
            full_name_en: "Munir Al-Sadiq Al-Hasi",
          },
        }
      ),
    },
  ]

  for (const f of fixtures) {
    await prisma.fcmsRequestFixture.upsert({
      where: { purchaseUuid: f.purchaseUuid },
      create: {
        purchaseUuid: f.purchaseUuid,
        listKind: f.listKind,
        label: f.label,
        sortOrder: f.sortOrder,
        payload: f.payload,
      },
      update: {
        listKind: f.listKind,
        label: f.label,
        sortOrder: f.sortOrder,
        payload: f.payload,
      },
    })
    console.log(`Upserted fixture ${f.purchaseUuid} (${f.listKind}) — ${f.label}`)
  }

  console.log("")
  console.log("Done. Set MOCK_FCMS=1 in .env to serve these from /api/fx/pending-requests and /api/fx/queue.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

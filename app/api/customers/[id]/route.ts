import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchCustomerFromCBS } from "@/lib/cbsApiClient"
import { serializeBigInt } from "@/lib/serialize"
import { filePathToUrl } from "@/lib/mediaStorage"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let { id } = await params
    let customerCode = id

    console.log(`[CUSTOMER_API] Looking up customer: ${id}`);

    let record = null;
    // 1. Try to resolve CUID to customerCode if applicable
    if (id.startsWith('c') && id.length > 10) {
      record = await prisma.receivedCustomerRecord.findUnique({
        where: { id },
        include: { session: true }
      }) as any // Cast to avoid TS issues if types aren't fully generated
      if (record?.session?.customerCode) {
        customerCode = record.session.customerCode
        console.log(`[CUSTOMER_API] Resolved CUID ${id} to customerCode ${customerCode}`);
      }
    }

    // 2. Fetch live identity data from CBS
    const cbsData = await fetchCustomerFromCBS(customerCode).catch(err => {
      console.warn(`[CUSTOMER_API] CBS Fetch failed for ${customerCode}:`, err.message)
      return null
    })

    // 3. Fetch local transaction/session history
    // IMPORTANT: Avoid lumping all "unknown" customers together.
    const sessions = await prisma.executionSession.findMany({
      where: { 
        AND: [
          { customerCode: customerCode },
          { customerCode: { not: "unknown" } },
          { customerCode: { not: "" } },
          { customerCode: { not: null } }
        ]
      },
      include: {
        mediaRecords: true,
        cashCountResult: true,
        receipt: true,
      },
      orderBy: { createdAt: "desc" }
    })

    // If we have a specific record, and the sessions list doesn't include its session, add it
    if (record?.sessionId) {
      const exists = sessions.find(s => s.id === record.sessionId);
      if (!exists) {
        const specificSession = await prisma.executionSession.findUnique({
          where: { id: record.sessionId },
          include: {
            mediaRecords: true,
            cashCountResult: true,
            receipt: true,
          }
        });
        if (specificSession) sessions.unshift(specificSession);
      }
    }

    if (!cbsData && sessions.length === 0) {
      console.warn(`[CUSTOMER_API] No data found for ${customerCode} in CBS or local DB`);
      return NextResponse.json({ message: "Customer not found" }, { status: 404 })
    }

    // 4. Map to the expected format for CustomerDetailDialog
    const snap = sessions[0]?.requestSnapshot as any
    const snapUser = snap?.bankAccount?.user

    const customer = {
      id,
      name: record?.customerName || cbsData?.customerName || snapUser?.full_name_en || snapUser?.first_name || "عميل غير معروف",
      nationalId: record?.nationalId || cbsData?.nationalId || snapUser?.nid || "—",
      passportNumber: record?.passportNumber || cbsData?.passportNo || snap?.bankAccount?.passport_number || "—",
      phone: record?.phone || cbsData?.phoneNumber || snapUser?.phone || "—",
      email: snapUser?.email || "—",
      address: record?.address || cbsData?.branch || snap?.bankAccount?.address || "طرابلس - ليبيا",
      createdAt: sessions[sessions.length - 1]?.createdAt || new Date(),
      reservations: sessions.map(s => {
        const sSnap = s.requestSnapshot as any
        const amount = sSnap?.amount_requested || sSnap?.amount || 0
        const rate = sSnap?.bank_transfer_price || 0
        return {
          id: s.id,
          uuid: s.purchaseRequestUuid,
          reservationNumber: sSnap?.request_number || `RES-${s.id.split('-')[0].toUpperCase()}`,
          amountRequested: amount,
          currencyCode: sSnap?.currency?.name || sSnap?.bankAccount?.currency?.code || "USD",
          equivalentLyd: amount * rate,
          status: s.status.toLowerCase(),
          createdAt: s.createdAt,
          media: s.mediaRecords.map(m => ({
            id: m.id,
            type: m.mediaType,
            filePath: m.filePath,
            url: filePathToUrl(m.filePath)
          }))
        }
      })
    }

    return NextResponse.json(serializeBigInt(customer))
  } catch (error: any) {
    console.error("[CUSTOMER_API_ERROR]", error);
    return NextResponse.json({ message: error.message || "Error fetching customer details" }, { status: 500 })
  }
}

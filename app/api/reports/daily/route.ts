import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import * as xlsx from "xlsx"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date")

  if (!dateStr) {
    return NextResponse.json({ success: false, message: "Date is required" }, { status: 400 })
  }

  try {
    const startDate = new Date(dateStr)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(dateStr)
    endDate.setHours(23, 59, 59, 999)

    // Fetch transaction records with all related data resolved via sessionId
    const records = await prisma.transactionRecord.findMany({
      where: {
        executedAt: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
      include: {
        // Prisma relation: ReceivedCustomerRecord — contains customerName, nationalId, phone, receiptNumber
        receivedCustomerRecord: true,
        // Resolve the session for fallback fields and to fetch receipt + cash count
        session: {
          select: {
            customerFullNameAr: true,
            customerFullNameEn: true,
            customerNid: true,
            customerPhone: true,
            serialNumber: true,
            // Receipt (1-to-1 on sessionId)
            receipt: {
              select: { receiptNumber: true }
            },
            // Cash count (1-to-1 on sessionId)
            cashCountResult: {
              select: { usdSerialNumbers: true }
            },
          }
        }
      },
      orderBy: { executedAt: "asc" },
    })

    if (records.length === 0) {
      if (searchParams.get("format") === "xlsx") {
        return NextResponse.json({ success: false, message: "لا توجد عمليات مكتملة لهذا اليوم" }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        message: "تم تحميل تقرير اليوم",
        summary: { date: dateStr, customersCount: 0, transactionsCount: 0, totalUsd: 0, totalLyd: 0 },
        rows: []
      })
    }

    // Helper: resolve a single row's enriched fields
    const resolveRow = (r: typeof records[number]) => {
      const rcr = r.receivedCustomerRecord
      const sess = r.session

      // Customer name: RCR → session Arabic → session English → N/A
      const customerName =
        rcr?.customerName ||
        sess?.customerFullNameAr ||
        sess?.customerFullNameEn ||
        "N/A"

      // National ID: RCR → session NID → N/A
      const nationalId =
        rcr?.nationalId ||
        sess?.customerNid ||
        "N/A"

      // Phone: RCR → session phone → N/A
      const phone =
        rcr?.phone ||
        sess?.customerPhone ||
        "N/A"

      // Receipt number: RCR.receiptNumber → session.receipt.receiptNumber → N/A
      const receiptNumber =
        rcr?.receiptNumber ||
        sess?.receipt?.receiptNumber ||
        "N/A"

      // Serial number: TransactionRecord.serialNumber → first USD serial from cash count → session.serialNumber → N/A
      const serialNumber =
        r.serialNumber ||
        (sess?.cashCountResult?.usdSerialNumbers?.length
          ? sess.cashCountResult.usdSerialNumbers[0]
          : null) ||
        sess?.serialNumber ||
        "N/A"

      return { customerName, nationalId, phone, receiptNumber, serialNumber }
    }

    const totalUsd = records.reduce((sum, r) => sum + Number(r.amountForeign), 0)
    const totalLyd = records.reduce((sum, r) => sum + Number(r.amountLocal), 0)

    // Unique customers: prefer nationalId for deduplication, fall back to record id
    const uniqueCustomers = new Set(
      records.map(r => r.receivedCustomerRecord?.nationalId || r.session?.customerNid || r.id)
    )

    if (searchParams.get("format") === "xlsx") {
      const data = records.map(r => {
        const { customerName, nationalId, phone, receiptNumber, serialNumber } = resolveRow(r)
        return {
          "رقم العملية": r.transactionNumber,
          "اسم العميل": customerName,
          "الرقم الوطني": nationalId,
          "الهاتف": phone,
          "رقم الإيصال": receiptNumber,
          "المبلغ (دولار)": Number(r.amountForeign),
          "المبلغ (دينار)": Number(r.amountLocal),
          "الرقم التسلسلي": serialNumber,
          "تاريخ وتوقت التنفيذ": r.executedAt.toLocaleString("ar-LY"),
        }
      })

      const ws = xlsx.utils.json_to_sheet(data)
      const wb = xlsx.utils.book_new()
      xlsx.utils.book_append_sheet(wb, ws, "التقرير اليومي")
      const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" })

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="daily-report-${dateStr}.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "تم تحميل تقرير اليوم",
      summary: {
        date: dateStr,
        customersCount: uniqueCustomers.size,
        transactionsCount: records.length,
        totalUsd,
        totalLyd,
      },
      rows: records.map(r => {
        const { customerName, nationalId, phone, receiptNumber, serialNumber } = resolveRow(r)
        return {
          id: r.id,
          transactionNumber: r.transactionNumber,
          customerName,
          nationalId,
          phone,
          receiptNumber,
          amountForeign: Number(r.amountForeign),
          amountLocal: Number(r.amountLocal),
          serialNumber,
          executedAt: r.executedAt.toISOString(),
        }
      })
    })
  } catch (err: any) {
    console.error("[daily-report] error:", err)
    return NextResponse.json({ success: false, message: "فشل إنشاء التقرير اليومي" }, { status: 500 })
  }
}

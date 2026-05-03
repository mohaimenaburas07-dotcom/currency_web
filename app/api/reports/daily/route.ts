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

    const records = await prisma.receivedCustomerRecord.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        transactionRecord: {
          status: "COMPLETED",
        }
      },
      include: {
        transactionRecord: true
      }
    })

    if (records.length === 0) {
      return NextResponse.json({ success: false, message: "لا توجد عمليات مكتملة لهذا اليوم" }, { status: 404 })
    }

    const data = records.map(r => ({
      "رقم العملية": r.transactionRecord?.transactionNumber || "N/A",
      "اسم العميل": r.customerName,
      "الرقم الوطني": r.nationalId,
      "رقم الإيصال": r.receiptNumber,
      "المبلغ (دولار)": Number(r.amountForeign),
      "المبلغ (دينار)": Number(r.amountLocal),
      "الرقم التسلسلي (Hardware)": r.transactionRecord?.serialNumber || "N/A",
      "تاريخ وتوقت التنفيذ": r.createdAt.toLocaleString("ar-LY")
    }))

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
  } catch (err: any) {
    console.error("[daily-report] error:", err)
    return NextResponse.json({ success: false, message: "فشل إنشاء التقرير اليومي" }, { status: 500 })
  }
}

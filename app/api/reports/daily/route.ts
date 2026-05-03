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

    const records = await prisma.transactionRecord.findMany({
      where: {
        executedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
      },
      include: {
        receivedCustomerRecord: true
      }
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

    const totalUsd = records.reduce((sum, r) => sum + Number(r.amountForeign), 0)
    const totalLyd = records.reduce((sum, r) => sum + Number(r.amountLocal), 0)
    // Unique customers by nationalId if available, fallback to tracking ID
    const uniqueCustomers = new Set(records.map(r => r.receivedCustomerRecord?.nationalId || r.id))
    
    if (searchParams.get("format") === "xlsx") {
      const data = records.map(r => ({
        "رقم العملية": r.transactionNumber || "N/A",
        "اسم العميل": r.receivedCustomerRecord?.customerName || "N/A",
        "الرقم الوطني": r.receivedCustomerRecord?.nationalId || "N/A",
        "رقم الإيصال": r.receivedCustomerRecord?.receiptNumber || "N/A",
        "المبلغ (دولار)": Number(r.amountForeign),
        "المبلغ (دينار)": Number(r.amountLocal),
        "الرقم التسلسلي (Hardware)": r.serialNumber || "N/A",
        "تاريخ وتوقت التنفيذ": r.executedAt.toLocaleString("ar-LY")
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
    }

    return NextResponse.json({
      success: true,
      message: "تم تحميل تقرير اليوم",
      summary: {
        date: dateStr,
        customersCount: uniqueCustomers.size,
        transactionsCount: records.length,
        totalUsd,
        totalLyd
      },
      rows: records.map(r => ({
        id: r.id,
        transactionNumber: r.transactionNumber || "N/A",
        customerName: r.receivedCustomerRecord?.customerName || "N/A",
        nationalId: r.receivedCustomerRecord?.nationalId || "N/A",
        receiptNumber: r.receivedCustomerRecord?.receiptNumber || "N/A",
        amountForeign: Number(r.amountForeign),
        amountLocal: Number(r.amountLocal),
        serialNumber: r.serialNumber || "N/A",
        executedAt: r.executedAt.toISOString()
      }))
    })
  } catch (err: any) {
    console.error("[daily-report] error:", err)
    return NextResponse.json({ success: false, message: "فشل إنشاء التقرير اليومي" }, { status: 500 })
  }
}

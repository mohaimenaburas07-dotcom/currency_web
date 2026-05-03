import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sessions = await prisma.executionSession.findMany({
      where: {
        status: {
          in: ["DRAFT", "COUNTING_CASH", "RECORDING"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        purchaseRequestUuid: true,
        customerFullNameAr: true,
        customerFullNameEn: true,
        customerNid: true,
        customerPhone: true,
        status: true,
        verificationStatus: true,
        countingStatus: true,
        cameraStatus: true,
        receiptStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "تم تحميل العمليات التي تحتاج إلى استكمال",
      sessions,
    })
  } catch (error) {
    console.error("[PendingLocalCompletion] Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحميل العمليات التي تحتاج إلى استكمال",
      },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sessions = await prisma.executionSession.findMany({
      where: {
        // Exclude DRAFT — only return sessions that have already started meaningful work
        status: {
          in: ["COUNTING_CASH", "RECORDING"],
        },
        // Require at least one real customer identifier
        OR: [
          { customerFullNameAr: { not: null } },
          { customerNid: { not: null } },
          { customerPhone: { not: null } },
        ],
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

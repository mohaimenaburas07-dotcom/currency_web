// app/api/execution-sessions/stale-pending/route.ts
// Health-check: finds sessions where processSnapshot.status = "PENDING"
// and the snapshot was started more than 5 minutes ago.
// These sessions likely had FCMS called but the final DB update failed.
// Operators should manually investigate and reset processSnapshot to null to allow retry.

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PENDING_TIMEOUT_MINUTES = 5

export async function GET() {
  try {
    const cutoff = new Date(Date.now() - PENDING_TIMEOUT_MINUTES * 60 * 1000)

    // Prisma cannot filter inside a JSON field, so we load RECORDING/COUNTING_CASH
    // sessions and filter in memory (expected to be a small set in production).
    const candidates = await prisma.executionSession.findMany({
      where: {
        status: { in: ["COUNTING_CASH", "RECORDING"] },
        processSnapshot: { not: null },
      },
      select: {
        id: true,
        purchaseRequestUuid: true,
        status: true,
        countingStatus: true,
        updatedAt: true,
        processSnapshot: true,
      },
      orderBy: { updatedAt: "asc" },
    })

    const stalePending = candidates.filter((s) => {
      const snap = s.processSnapshot as any
      if (!snap || snap.status !== "PENDING") return false
      const startedAt = snap.startedAt ? new Date(snap.startedAt) : s.updatedAt
      return startedAt < cutoff
    })

    return NextResponse.json({
      success: true,
      message:
        stalePending.length > 0
          ? `يوجد ${stalePending.length} جلسة بحالة PENDING تجاوزت ${PENDING_TIMEOUT_MINUTES} دقائق`
          : "لا توجد جلسات معلقة قديمة",
      staleSessions: stalePending.map((s) => {
        const snap = s.processSnapshot as any
        return {
          id: s.id,
          purchaseRequestUuid: s.purchaseRequestUuid,
          status: s.status,
          countingStatus: s.countingStatus,
          snapshotStartedAt: snap?.startedAt ?? null,
          sessionUpdatedAt: s.updatedAt,
          recommendation:
            "Set processSnapshot = null in DB to allow employee to retry cash count",
        }
      }),
    })
  } catch (err: any) {
    console.error("[stale-pending] error:", err)
    return NextResponse.json(
      { success: false, message: "فشل التحقق من الجلسات المعلقة" },
      { status: 500 }
    )
  }
}

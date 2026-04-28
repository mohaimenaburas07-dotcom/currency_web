// app/api/execution-sessions/[id]/route.ts
// GET — loads the full execution session with all relations (for the execution page)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { toErrorResponse } from "@/lib/workflowErrors"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await prisma.executionSession.findUniqueOrThrow({
      where: { id },
      include: {
        identityVerification: true,
        mediaRecords:         true,
        cashCountResult: {
          include: { denominations: true },
        },
        receipt:              true,
        transactionRecord:    true,
      },
    })

    return NextResponse.json(session)
  } catch {
    return NextResponse.json(
      { error: "Execution session not found", code: "SESSION_NOT_FOUND" },
      { status: 404 }
    )
  }
}

// app/api/execution-sessions/[id]/upload-video/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveSessionFile } from "@/lib/mediaStorage"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse, SessionAlreadyCompletedError } from "@/lib/workflowErrors"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    const session = await prisma.executionSession.findUniqueOrThrow({ where: { id } })
    console.log(`[VIDEO_UPLOAD] Session ${id} | Customer: ${session.customerCode}`)
 
    if (["COMPLETED", "CANCELLED"].includes(session.status)) {
      throw new SessionAlreadyCompletedError()
    }
 
    const formData = await req.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string ?? "system"
 
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
 
    // Fallback customer code extraction from snapshot if missing
    let customerCode = session.customerCode
    if (!customerCode && session.requestSnapshot) {
       try {
          const snap = session.requestSnapshot as any
          const accountNo = snap?.bankAccount?.account_number || ""
          if (accountNo.length >= 9) {
             const code = accountNo.substring(3, 9)
             customerCode = parseInt(code, 10).toString()
             console.log(`[VIDEO_UPLOAD] Extracted customerCode from snapshot: ${customerCode}`)
          }
       } catch (e) {}
    }
 
    const buffer = Buffer.from(await file.arrayBuffer())
    const saved = await saveSessionFile(
      buffer,
      id,
      customerCode || "unknown",
      "videos",
      file.name,
      file.type
    )

    const record = await prisma.mediaRecord.create({
      data: {
        sessionId: id,
        mediaType: "VIDEO",
        filePath: saved.filePath,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        fileSizeBytes: saved.fileSizeBytes,
        capturedByUserId: userId,
      }
    })

    // Video usually follows photo in recording step
    await prisma.executionSession.update({
      where: { id },
      data: { status: "RECORDING" }
    })

    await writeAuditLog({
      action: "VIDEO_UPLOADED",
      entityType: "MediaRecord",
      entityId: record.id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { filePath: saved.filePath },
      ipAddress,
      userAgent,
    })

    return NextResponse.json(record)
  } catch (err) {
    return NextResponse.json(toErrorResponse(err), { status: 400 })
  }
}

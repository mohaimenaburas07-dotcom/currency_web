// app/api/execution-sessions/[id]/upload-photo/route.ts
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
    console.log(`[PHOTO_UPLOAD] Session ${id} | Customer: ${session.customerCode}`)
 
    if (session.status === "CANCELLED") {
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
             console.log(`[PHOTO_UPLOAD] Extracted customerCode from snapshot: ${customerCode}`)
          }
       } catch (e) {}
    }
 
    const buffer = Buffer.from(await file.arrayBuffer())
    const saved = await saveSessionFile(
      buffer,
      id,
      customerCode || "unknown",
      "photos",
      file.name,
      file.type
    )

    const record = await prisma.mediaRecord.create({
      data: {
        sessionId: id,
        mediaType: "PHOTO",
        filePath: saved.filePath,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        fileSizeBytes: saved.fileSizeBytes,
        capturedByUserId: userId,
      }
    })

    const sessionWithMedia = await prisma.executionSession.findUnique({
      where: { id },
      include: { mediaRecords: true }
    })
    const hasVideo = sessionWithMedia?.mediaRecords.some(m => m.mediaType === 'VIDEO')

    await prisma.executionSession.update({
      where: { id },
      data: { 
        cameraStatus: hasVideo ? "DONE" : session.cameraStatus,
        status: session.status !== "COMPLETED" ? "RECORDING" : session.status
      }
    })

    await writeAuditLog({
      action: "PHOTO_UPLOADED",
      entityType: "MediaRecord",
      entityId: record.id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { filePath: saved.filePath },
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true, message: "تم رفع الصورة بنجاح", data: record })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "تعذر رفع الصورة", error: err.message }, { status: 400 })
  }
}

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
    console.log(`[DOCUMENT_UPLOAD] Session ${id} | Customer: ${session.customerCode}`)
 
    if (session.status === "CANCELLED") {
      throw new SessionAlreadyCompletedError()
    }
 
    const formData = await req.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string ?? "system"
    const documentType = formData.get("documentType") as string ?? (file.type.includes("pdf") ? "PDF" : "IMAGE")
    const documentNumber = formData.get("documentNumber") as string ?? "UNKNOWN"
    const customerName = formData.get("customerName") as string ?? null
    const birthDate = formData.get("birthDate") as string ?? null
 
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
             console.log(`[DOCUMENT_UPLOAD] Extracted customerCode from snapshot: ${customerCode}`)
          }
       } catch (e) {}
    }
 
    const buffer = Buffer.from(await file.arrayBuffer())
    const saved = await saveSessionFile(
      buffer,
      id,
      customerCode || "unknown",
      "documents",
      file.name,
      file.type
    )

    // Perform updates in a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.mediaRecord.create({
        data: {
          sessionId: id,
          mediaType: "DOCUMENT", 
          filePath: saved.filePath,
          fileName: saved.fileName,
          mimeType: saved.mimeType,
          fileSizeBytes: saved.fileSizeBytes,
          capturedByUserId: userId,
        }
      })

      // Update session verification status
      await tx.executionSession.update({
        where: { id },
        data: { 
          verificationStatus: "DONE",
          status: "RECORDING" 
        }
      })

      // Create or update IdentityVerification record
      const verification = await tx.identityVerification.upsert({
        where: { sessionId: id },
        update: {
          documentType,
          documentNumber,
          documentImagePath: saved.filePath,
          matched: true,
          verifiedByUserId: userId,
          verifiedAt: new Date(),
          customerName,
          birthDate,
        },
        create: {
          sessionId: id,
          documentType,
          documentNumber,
          documentImagePath: saved.filePath,
          matched: true,
          verifiedByUserId: userId,
          customerName,
          birthDate,
        }
      })

      return { record, verification }
    })

    await writeAuditLog({
      action: "DOCUMENT_UPLOADED",
      entityType: "MediaRecord",
      entityId: result.record.id,
      sessionId: id,
      performedByUserId: userId,
      newValues: { filePath: saved.filePath, verified: true },
      ipAddress,
      userAgent,
    })

    console.log(`[UploadDoc] Transaction complete for session ${id}. Media=${result.record.id}, Verification=${result.verification.id}`);

    return NextResponse.json(result.record)
  } catch (err) {
    console.error("[upload-document] error:", err)
    return NextResponse.json(toErrorResponse(err), { status: 400 })
  }
}

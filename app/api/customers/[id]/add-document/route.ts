import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveSessionFile } from "@/lib/mediaStorage"
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger"
import { toErrorResponse } from "@/lib/workflowErrors"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params // This 'id' is the customer ID (cuid from ReceivedCustomerRecord)
  const { ipAddress, userAgent } = extractRequestMeta(req)

  try {
    // 1. Find the customer record
    const customer = await prisma.receivedCustomerRecord.findUniqueOrThrow({
      where: { id },
      include: { session: true }
    })

    const sessionId = customer.sessionId
    if (!sessionId) {
      return NextResponse.json({ error: "Customer has no associated session" }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string ?? "system"
    const documentType = formData.get("documentType") as string ?? "DOCUMENT"
 
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
 
    const buffer = Buffer.from(await file.arrayBuffer())
    const saved = await saveSessionFile(
      buffer,
      sessionId,
      customer.customerExternalId || "unknown", // Using customerExternalId as customerCode
      "documents",
      file.name,
      file.type
    )

    // 2. Create the media record
    const record = await prisma.mediaRecord.create({
      data: {
        sessionId: sessionId,
        mediaType: "DOCUMENT", 
        filePath: saved.filePath,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        fileSizeBytes: saved.fileSizeBytes,
        capturedByUserId: userId,
      }
    })

    // 3. Update or create IdentityVerification if needed
    // Since this is manual addition, we just link it
    await prisma.identityVerification.upsert({
      where: { sessionId: sessionId },
      update: {
        documentImagePath: saved.filePath,
        verifiedByUserId: userId,
        verifiedAt: new Date(),
      },
      create: {
        sessionId: sessionId,
        documentType: "MANUAL_UPLOAD",
        documentImagePath: saved.filePath,
        matched: true,
        verifiedByUserId: userId,
      }
    })

    await writeAuditLog({
      action: "DOCUMENT_ADDED_POST_EXECUTION",
      entityType: "MediaRecord",
      entityId: record.id,
      sessionId: sessionId,
      performedByUserId: userId,
      newValues: { filePath: saved.filePath, source: "customer_page" },
      ipAddress,
      userAgent,
    })

    return NextResponse.json(record)
  } catch (err) {
    console.error("[customer-add-document] error:", err)
    return NextResponse.json(toErrorResponse(err), { status: 400 })
  }
}

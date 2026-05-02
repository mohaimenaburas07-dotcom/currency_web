/** Force Rebuild 2 **/
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger";
import fs from "fs";
import path from "path";

// Define the root directory for uploads
const UPLOADS_ROOT = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads");

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const { ipAddress, userAgent } = extractRequestMeta(req)

    // Read role from request header (set by client from localStorage)
    const userRaw = req.headers.get("x-user-role") ?? ""
    const isAdmin = ["ADMIN", "admin", "ROLE_ADMIN", "Administrator"].some(r => userRaw.includes(r))

    console.log(`[MEDIA_DELETE] >>> STARTING DELETION FOR ID: ${id} | role=${userRaw}`);

    if (!id) {
      return NextResponse.json({ error: "Missing media ID", message: "يرجى تحديد الملف المراد حذفه" }, { status: 400 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized", message: "غير مسموح — هذه العملية متاحة للمدير فقط" }, { status: 403 });
    }

    // 1. Fetch record
    const media = await prisma.mediaRecord.findUnique({ where: { id } });

    if (!media) {
      return NextResponse.json({ error: "Media record not found", message: "لم يتم العثور على الملف" }, { status: 404 });
    }

    // 2. Attempt to delete the physical file
    try {
      const relativePath = media.filePath.replace(/^\//, '').replace(/\\/g, path.sep).replace(/\//g, path.sep);
      const absolutePath = path.join(UPLOADS_ROOT, relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`[MEDIA_DELETE] Physical file deleted: ${relativePath}`);
      }
    } catch (fsError: any) {
      console.error(`[MEDIA_DELETE] Filesystem error: ${fsError.message}`);
    }

    // 3. Delete from database
    await prisma.mediaRecord.delete({ where: { id } });

    // 4. Write audit log
    await writeAuditLog({
      action: "MEDIA_DELETED",
      entityType: "MediaRecord",
      entityId: id,
      sessionId: media.sessionId,
      performedByUserId: req.headers.get("x-user-id") ?? "unknown",
      oldValues: { filePath: media.filePath, mediaType: media.mediaType },
      newValues: { deleted: true },
      ipAddress,
      userAgent,
    })

    console.log(`[MEDIA_DELETE] Database record deleted successfully: ${id}`);
    return NextResponse.json({ success: true, message: "تم حذف الملف بنجاح" });

  } catch (error: any) {
    console.error("[MEDIA_DELETE_CRITICAL_ERROR]", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: "حدث خطأ داخلي أثناء الحذف",
      details: error.message 
    }, { status: 500 });
  }
}

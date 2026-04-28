/** Force Rebuild 1 **/
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    console.log(`[MEDIA_DELETE] >>> STARTING DELETION FOR ID: ${id}`);

    if (!id) {
      console.error(`[MEDIA_DELETE] ERROR: No ID provided`);
      return NextResponse.json({ error: "Missing media ID" }, { status: 400 });
    }

    // 1. Fetch record
    console.log(`[MEDIA_DELETE] STEP 1: Fetching record from DB...`);
    const media = await prisma.mediaRecord.findUnique({
      where: { id }
    });

    if (!media) {
      console.warn(`[MEDIA_DELETE] Record not found in database: ${id}`);
      return NextResponse.json({ error: "Media record not found" }, { status: 404 });
    }

    // 2. Attempt to delete the physical file
    try {
      // Normalize path for Windows/Linux compatibility
      // Ensure we remove leading slashes to prevent path.join from treating it as root
      const relativePath = media.filePath.replace(/^\//, '').replace(/\\/g, path.sep).replace(/\//g, path.sep);
      const absolutePath = path.join(UPLOADS_ROOT, relativePath);

      console.log(`[MEDIA_DELETE] Target file: ${absolutePath}`);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`[MEDIA_DELETE] Physical file deleted: ${relativePath}`);
      } else {
        console.warn(`[MEDIA_DELETE] Physical file already missing from disk: ${absolutePath}`);
      }
    } catch (fsError: any) {
      // Log FS error but don't stop the DB deletion
      console.error(`[MEDIA_DELETE] Filesystem error: ${fsError.message}`);
    }

    // 3. Delete the record from the database
    await prisma.mediaRecord.delete({
      where: { id }
    });

    console.log(`[MEDIA_DELETE] Database record deleted successfully: ${id}`);
    return NextResponse.json({ success: true, message: "Media deleted successfully" });

  } catch (error: any) {
    console.error("[MEDIA_DELETE_CRITICAL_ERROR]", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message 
    }, { status: 500 });
  }
}

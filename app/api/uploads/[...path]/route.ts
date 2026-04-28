// app/api/uploads/[...path]/route.ts
// Serves files saved by saveSessionFile() from the UPLOADS_DIR.
// This replaces the unreliable /uploads/ static path in Next.js dev mode.

import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const UPLOADS_ROOT = process.env.UPLOADS_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads")

const MIME_MAP: Record<string, string> = {
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".mp4":  "video/mp4",
  ".webm": "video/webm",
  ".pdf":  "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls":  "application/vnd.ms-excel",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params

    // Sanitize each segment to prevent path traversal
    const clean = segments.map((s) => path.basename(s))
    const filePath = path.join(UPLOADS_ROOT, ...clean)

    // Belt-and-suspenders: ensure resolved path is inside UPLOADS_ROOT
    const resolved = path.resolve(filePath)
    if (!resolved.startsWith(path.resolve(UPLOADS_ROOT))) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    if (!fs.existsSync(resolved)) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const stat = fs.statSync(resolved)
    if (!stat.isFile()) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const buffer = fs.readFileSync(resolved)
    const ext = path.extname(resolved).toLowerCase()
    const contentType = MIME_MAP[ext] ?? "application/octet-stream"

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":  contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control":  "private, max-age=3600",
      },
    })
  } catch (err) {
    console.error("[/api/uploads] error:", err)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

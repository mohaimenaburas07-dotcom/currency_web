// lib/mediaStorage.ts
// Handles saving files to local disk and generating storage paths.
// Upgrade path: swap writeFile calls for S3 PUT calls without changing callers.

import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"

const UPLOADS_ROOT = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads")

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export interface SavedFile {
  filePath: string       // Relative path from uploads root (stored in DB)
  absolutePath: string   // Full disk path
  fileName: string
  mimeType: string
  fileSizeBytes: number
}

/**
 * Save an uploaded file buffer to disk inside the session folder.
 * @param buffer    Raw file buffer
 * @param sessionId Execution session ID (used for folder organisation)
 * @param subFolder "photos" | "videos" | "documents" | "signatures" | "fingerprints"
 * @param originalName Original file name from upload
 * @param mimeType  MIME type string
 */
export async function saveSessionFile(
  buffer: Buffer,
  sessionId: string,
  customerCode: string,
  subFolder: string,
  originalName: string,
  mimeType: string
): Promise<SavedFile> {
  const ext = path.extname(originalName) || mimeTypeToExt(mimeType)
  const uuid = randomUUID()
  const fileName = `${uuid}${ext}`
  const dir = path.join(UPLOADS_ROOT, "customers", customerCode, "sessions", sessionId, subFolder)
  ensureDir(dir)

  const absolutePath = path.join(dir, fileName)
  fs.writeFileSync(absolutePath, buffer)

  // Store relative path in DB so the app is portable
  // Use forward slashes for DB consistency even on Windows
  const filePath = `customers/${customerCode}/sessions/${sessionId}/${subFolder}/${fileName}`
  console.log(`[STORAGE] File saved. Relative path: ${filePath} | Absolute path: ${absolutePath}`)
 
  return {
    filePath,
    absolutePath,
    fileName,
    mimeType,
    fileSizeBytes: buffer.length,
  }
}

/**
 * Save a receipt PDF to the receipts folder.
 */
export async function saveReceiptFile(
  buffer: Buffer,
  receiptNumber: string,
  copyType: "customer" | "archive"
): Promise<string> {
  const now = new Date()
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const dir   = path.join(UPLOADS_ROOT, "receipts", String(year), month)
  ensureDir(dir)

  const fileName = `${copyType}-copy-${receiptNumber}.pdf`
  const absolutePath = path.join(dir, fileName)
  fs.writeFileSync(absolutePath, buffer)

  return path.join("receipts", String(year), month, fileName)
}

/**
 * Save an Excel file from the money counting machine.
 */
export async function saveExcelFile(
  buffer: Buffer,
  sessionId: string,
  customerCode: string,
  originalName: string
): Promise<string> {
  const dir = path.join(UPLOADS_ROOT, "customers", customerCode, "sessions", sessionId, "counting")
  ensureDir(dir)
  const fileName = `count-${Date.now()}-${originalName}`
  fs.writeFileSync(path.join(dir, fileName), buffer)
  return `customers/${customerCode}/sessions/${sessionId}/counting/${fileName}`
}

/**
 * Returns the public URL for a stored file path (for frontend use).
 */
export function filePathToUrl(filePath: string): string {
  // Replace backslashes on Windows
  return "/uploads/" + filePath.replace(/\\/g, "/")
}

function mimeTypeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png":  ".png",
    "image/webp": ".webp",
    "video/mp4":  ".mp4",
    "video/webm": ".webm",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-excel": ".xls",
    "application/pdf": ".pdf",
  }
  return map[mimeType] ?? ".bin"
}

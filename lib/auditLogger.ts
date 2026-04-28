// lib/auditLogger.ts
// Writes entries to WorkflowAuditLog via Prisma.
// Call this from any API route or service that mutates critical state.

import { prisma } from "@/lib/prisma"

export type AuditAction =
  | "EXECUTION_STARTED"
  | "IDENTITY_VERIFIED"
  | "DOCUMENT_UPLOADED"
  | "PHOTO_UPLOADED"
  | "VIDEO_UPLOADED"
  | "CASH_COUNT_SAVED"
  | "RECEIPT_GENERATED"
  | "SIGNATURE_SAVED"
  | "FINGERPRINT_SAVED"
  | "EXECUTION_CONFIRMED"
  | "TRANSACTION_CREATED"
  | "CLIENT_RECORD_CREATED"
  | "SESSION_CANCELLED"
  | "SESSION_STATUS_CHANGED"
  | "HARDWARE_CAMERA_SNAPSHOT"
  | "HARDWARE_CAMERA_RECORD_START"
  | "HARDWARE_CAMERA_RECORD_STOP"
  | "HARDWARE_COUNTER_READ"
  | "HARDWARE_PRINTER_PRINT"

interface AuditEntry {
  action: AuditAction
  entityType: string
  entityId: string
  performedByUserId?: string
  sessionId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.workflowAuditLog.create({
      data: {
        action:            entry.action,
        entityType:        entry.entityType,
        entityId:          entry.entityId,
        performedByUserId: entry.performedByUserId,
        sessionId:         entry.sessionId,
        oldValuesJson:     entry.oldValues ?? undefined,
        newValuesJson:     entry.newValues ?? undefined,
        ipAddress:         entry.ipAddress,
        userAgent:         entry.userAgent,
      },
    })
  } catch (err) {
    // Audit failure must never break the main flow — log to console only
    console.error("[AuditLogger] Failed to write audit log:", err)
  }
}

export function extractRequestMeta(req: Request) {
  return {
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
  }
}

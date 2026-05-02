// app/api/audit-logs/record/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeAuditLog, extractRequestMeta } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const { action, entityType, entityId, userId, sessionId, details } = await req.json();
    const { ipAddress, userAgent } = extractRequestMeta(req);

    await writeAuditLog({
      action: action as any,
      entityType: entityType || "User",
      entityId: entityId || userId || "system",
      performedByUserId: userId || "unknown",
      sessionId: sessionId,
      newValues: details,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

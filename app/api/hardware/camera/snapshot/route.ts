import { NextRequest, NextResponse } from 'next/server';
import { cameraService } from '@/lib/hardware/services/cameraService';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { fetchWithDigest } from '@/lib/hardware/digestFetch';
import { resolveBranchId } from '@/lib/hardware/branchResolver';
import { prisma } from '@/lib/prisma';
import { saveSessionFile } from '@/lib/mediaStorage';
import { writeAuditLog, extractRequestMeta } from '@/lib/auditLogger';

export async function GET(req: NextRequest) {
  const branchId = await resolveBranchId(req);

  if (!branchId) {
    return NextResponse.json({ error: 'Missing branchId' }, { status: 400 });
  }

  try {
    const config = await getBranchHardwareConfig(branchId);
    if (!config || !config.cameraIp || !config.cameraEnabled) {
      return NextResponse.json({ error: 'Camera not configured' }, { status: 404 });
    }

    const port = config.cameraHttpPort || 80;
    const path = config.cameraSnapshotPath || '/snap.jpg';
    const url = `http://${config.cameraIp}:${port}${path}`;

    const response = await fetchWithDigest(url, {}, config.cameraUsername || undefined, config.cameraPassword || undefined);

    if (!response.ok) {
      return NextResponse.json({ error: 'Camera unavailable', status: response.status }, { status: 502 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Camera snapshot proxy error:', error);
    return NextResponse.json({ error: 'Camera unavailable' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const { ipAddress, userAgent } = extractRequestMeta(req);
  try {
    const branchId = await resolveBranchId(req);
    const body = await req.json();
    const sessionId = body.sessionId || body.sessionId;
    const operatorId = body.operatorId || 'SYSTEM';

    if (!branchId || !sessionId) {
      return NextResponse.json({ success: false, error: 'Missing required context (branchId or sessionId)' }, { status: 400 });
    }

    // 1. Take the snapshot
    const result = await cameraService.takeSnapshot({ branchId, sessionId, operatorId });
    
    if (!result.success || !result.data?.url) {
      return NextResponse.json(result, { status: 502 });
    }

    // 2. Extract buffer from Data URL
    const dataUrl = result.data.url;
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid data URL from camera adapter');
    }
    const buffer = Buffer.from(base64Data, 'base64');

    // 3. Get session info for storage path
    const session = await prisma.executionSession.findUnique({
      where: { id: sessionId },
      select: { customerCode: true }
    });

    // 4. Save to filesystem
    const fileName = `hardware_snapshot_${Date.now()}.jpg`;
    const saved = await saveSessionFile(
      buffer,
      sessionId,
      session?.customerCode || 'unknown',
      'photos',
      fileName,
      'image/jpeg'
    );

    // 5. Create MediaRecord
    const record = await prisma.mediaRecord.create({
      data: {
        sessionId: sessionId,
        mediaType: 'PHOTO',
        filePath: saved.filePath,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        fileSizeBytes: saved.fileSizeBytes,
        capturedByUserId: operatorId,
        capturedAt: new Date(result.data.timestamp)
      }
    });

    // 6. Audit Log
    await writeAuditLog({
      action: 'PHOTO_UPLOADED',
      entityType: 'MediaRecord',
      entityId: record.id,
      sessionId: sessionId,
      performedByUserId: operatorId,
      newValues: { filePath: saved.filePath, source: 'HARDWARE' },
      ipAddress,
      userAgent
    });

    return NextResponse.json({
      success: true,
      data: record
    });
  } catch (error: any) {
    console.error('[Snapshot API] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

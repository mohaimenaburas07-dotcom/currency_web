import { NextRequest, NextResponse } from 'next/server';
import { cameraService } from '@/lib/hardware/services/cameraService';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { fetchWithDigest } from '@/lib/hardware/digestFetch';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId');

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
  try {
    const body = await req.json();
    const { branchId, transactionId, operatorId } = body;

    if (!branchId || !operatorId) {
      return NextResponse.json({ success: false, error: 'Missing required context' }, { status: 400 });
    }

    const result = await cameraService.takeSnapshot({ branchId, transactionId, operatorId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

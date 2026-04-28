import { NextRequest, NextResponse } from 'next/server';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { hardwareRegistry } from '@/lib/hardware/hardwareRegistry';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || 'DEFAULT_BRANCH';

  try {
    const config = await getBranchHardwareConfig(branchId);
    let cameraIp = config?.camera_ip || config?.cameraIp;

    if (!cameraIp) {
      return new NextResponse('Camera IP not configured', { status: 404 });
    }

    const camera = hardwareRegistry.getCamera(branchId, config);
    const snapshot = await camera.getSnapshot();

    if (!snapshot.success || !snapshot.data?.url) {
      return new NextResponse(`Camera error: ${snapshot.error?.message || 'Unknown error'}`, { status: 502 });
    }

    // Parse the data URL back to binary
    const base64Data = snapshot.data.url.split(',')[1];
    const arrayBuffer = Buffer.from(base64Data, 'base64');
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error("Stream Proxy Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}

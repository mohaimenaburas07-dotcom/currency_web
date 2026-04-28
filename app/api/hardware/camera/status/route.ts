import { NextRequest, NextResponse } from 'next/server';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { fetchWithDigest } from '@/lib/hardware/digestFetch';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId');

  if (!branchId) {
    return NextResponse.json({ 
      available: false, 
      message: "الكاميرا غير متاحة أو غير مهيأة لهذا الفرع" 
    });
  }

  try {
    const config = await getBranchHardwareConfig(branchId);
    
    if (!config || !config.cameraIp || !config.cameraEnabled) {
      return NextResponse.json({ 
        available: false, 
        message: "الكاميرا غير متاحة أو غير مهيأة لهذا الفرع" 
      });
    }

    const port = config.cameraHttpPort || 80;
    const path = config.cameraSnapshotPath || '/snap.jpg';
    const url = `http://${config.cameraIp}:${port}${path}`;

    // Quick check with 5s timeout
    const response = await fetchWithDigest(url, { signal: AbortSignal.timeout(5000) } as any, config.cameraUsername || undefined, config.cameraPassword || undefined);

    if (response.ok) {
      return NextResponse.json({ 
        available: true, 
        message: "تم الاتصال بالكاميرا بنجاح",
        cameraName: config.cameraName || "Main Camera"
      });
    } else {
      return NextResponse.json({ 
        available: false, 
        message: "الكاميرا غير متاحة أو غير مهيأة لهذا الفرع" 
      });
    }
  } catch (error) {
    console.error('Camera status check error:', error);
    return NextResponse.json({ 
      available: false, 
      message: "الكاميرا غير متاحة أو غير مهيأة لهذا الفرع" 
    });
  }
}

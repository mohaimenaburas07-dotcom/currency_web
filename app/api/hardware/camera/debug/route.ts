import { NextRequest, NextResponse } from 'next/server';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { hardwareRegistry } from '@/lib/hardware/hardwareRegistry';
import { NetworkCameraAdapter } from '@/lib/hardware/adapters/networkCamera';
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchIdParam = searchParams.get('branchId');

  try {
    let config = null;
    
    if (branchIdParam) {
      config = await getBranchHardwareConfig(branchIdParam);
    } else {
      // Try DEFAULT_BRANCH first
      config = await getBranchHardwareConfig('DEFAULT_BRANCH');
      
      // If DEFAULT_BRANCH has no camera, try to find ANY branch with a camera IP
      if (!config || (!config.camera_ip && !config.cameraIp)) {
         config = await prisma.branchHardwareConfig.findFirst({
           where: {
             cameraIp: { not: null }
           }
         });
      }
    }

    let cameraIp = config?.camera_ip || config?.cameraIp;

    if (!cameraIp) {
      return NextResponse.json({ error: 'No camera IP configured in the database for any branch. Please configure a camera IP first.' }, { status: 404 });
    }

    const branchId = config?.branchCode || 'UNKNOWN';
    const camera = hardwareRegistry.getCamera(branchId, config) as NetworkCameraAdapter;
    
    // Force a fresh diagnostic run
    const diagnostics = await camera.runDiagnostics();

    return NextResponse.json({
      success: true,
      branchId,
      diagnostics
    });
  } catch (error: any) {
    console.error("Camera Debug API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

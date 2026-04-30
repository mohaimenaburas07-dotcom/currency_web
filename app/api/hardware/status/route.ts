import { NextRequest, NextResponse } from 'next/server';
import { hardwareRegistry } from '@/lib/hardware/hardwareRegistry';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { resolveBranchId } from '@/lib/hardware/branchResolver';

export async function GET(req: NextRequest) {
  const branchId = await resolveBranchId(req);

  try {
    const config = await getBranchHardwareConfig(branchId);
    
    const cameraRes = config?.cameraEnabled !== false 
      ? await hardwareRegistry.getCamera(branchId, config).getStatus(branchId)
      : { status: 'DISABLED' };
      
    const counter = await hardwareRegistry.getCounter(branchId, config).getStatus(branchId);
    const printer = await hardwareRegistry.getPrinter(branchId, config).getStatus(branchId);
    const scanner = await hardwareRegistry.getScanner(branchId, config).getStatus();

    return NextResponse.json({
      success: true,
      devices: {
        camera: cameraRes.status,
        counter: counter.status,
        printer: printer.status,
        scanner: scanner.status
      },
      config: {
        cameraIp: config?.cameraIp || config?.camera_ip || null,
        cameraEnabled: config?.cameraEnabled !== false,
        cameraName: config?.cameraName || "Main Camera",
        branchCode: config?.branchCode || branchId,
        branchName: config?.branchName || config?.branch_name || null,
        devicesCollection: config?.devices || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

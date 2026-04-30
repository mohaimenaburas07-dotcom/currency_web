import { NextRequest, NextResponse } from 'next/server';
import { hardwareRegistry } from '@/lib/hardware/hardwareRegistry';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { resolveBranchId } from '@/lib/hardware/branchResolver';

export async function GET(req: NextRequest) {
  const branchId = await resolveBranchId(req);

  try {
    const config = await getBranchHardwareConfig(branchId);
    const scanner = hardwareRegistry.getScanner(branchId, config);
    const status = await scanner.getStatus();
    
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      status: 'ERROR', 
      error: { code: 'SCANNER_ERROR', message: error.message } 
    }, { status: 500 });
  }
}

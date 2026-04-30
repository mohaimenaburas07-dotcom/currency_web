import { NextRequest, NextResponse } from 'next/server';
import { hardwareRegistry } from '@/lib/hardware/hardwareRegistry';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { resolveBranchId } from '@/lib/hardware/branchResolver';

export async function POST(req: NextRequest) {
  const branchId = await resolveBranchId(req);

  try {
    const context = await req.json().catch(() => ({}));
    const config = await getBranchHardwareConfig(branchId);
    const counter = hardwareRegistry.getCounter(branchId, config);
    
    const result = await counter.readCount(context);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      status: 'ERROR', 
      error: { code: 'COUNTER_READ_FAILED', message: error.message } 
    }, { status: 500 });
  }
}

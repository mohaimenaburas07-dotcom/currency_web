import { NextRequest, NextResponse } from 'next/server';
import { hardwareRegistry } from '@/lib/hardware/hardwareRegistry';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || 'DEFAULT_BRANCH';

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

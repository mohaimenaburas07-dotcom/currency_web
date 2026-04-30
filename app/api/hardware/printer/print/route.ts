import { NextRequest, NextResponse } from 'next/server';
import { printerService } from '@/lib/hardware/services/printerService';
import { resolveBranchId } from '@/lib/hardware/branchResolver';

export async function POST(req: NextRequest) {
  try {
    const branchId = await resolveBranchId(req);
    const body = await req.json();
    const { transactionId, operatorId, job } = body;

    // Detailed Validation for Phase 1
    const missing = [];
    if (!branchId) missing.push('branchId');
    if (!operatorId) missing.push('operatorId');
    if (!job) missing.push('job');
    
    if (missing.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Missing required fields: ${missing.join(', ')}`,
        schema: {
          branchId: 'string',
          operatorId: 'string',
          transactionId: 'string (optional)',
          job: {
            copyType: 'CUSTOMER | ARCHIVE',
            data: 'object',
            transactionId: 'string (fallback to top-level)'
          }
        }
      }, { status: 400 });
    }

    // Ensure job has required fields for the service
    const finalJob = {
      ...job,
      transactionId: job.transactionId || transactionId || 'N/A',
      data: job.data || {},
      copyType: job.copyType || 'CUSTOMER'
    };

    const result = await printerService.printReceipt({ 
      branchId, 
      transactionId: transactionId || finalJob.transactionId, 
      operatorId 
    }, finalJob);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { hardwareRegistry } from '../hardwareRegistry';
import { writeAuditLog } from '../../auditLogger';
import { HardwareContext, HardwareResponse } from '../types/common';
import { PrinterJob } from '../types/printer';
import { getBranchHardwareConfig } from '../dbConfig';

export const printerService = {
  async printReceipt(context: HardwareContext, job: PrinterJob): Promise<HardwareResponse<{ jobId: string }>> {
    const config = await getBranchHardwareConfig(context.branchId);
    const enrichedContext = { ...context, branchConfig: config };
    const adapter = hardwareRegistry.getPrinter(context.branchId);
    const result = await adapter.printReceipt({ ...enrichedContext, job });

    await writeAuditLog({
      action: 'HARDWARE_PRINTER_PRINT',
      entityType: 'EXECUTION_SESSION',
      entityId: context.transactionId || 'UNKNOWN',
      performedByUserId: context.operatorId,
      newValues: { ...context, success: result.success, copyType: job.copyType }
    });

    return result;
  }
};

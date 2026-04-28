import { hardwareRegistry } from '../hardwareRegistry';
import { writeAuditLog } from '../../auditLogger';
import { HardwareContext, HardwareResponse } from '../types/common';
import { CounterResult } from '../types/counter';
import { getBranchHardwareConfig } from '../dbConfig';

export const counterService = {
  async readCount(context: HardwareContext, expectedAmount?: number): Promise<HardwareResponse<CounterResult>> {
    const config = await getBranchHardwareConfig(context.branchId);
    const enrichedContext = { ...context, branchConfig: config };
    const adapter = hardwareRegistry.getCounter(context.branchId);
    const result = await adapter.readCount({ ...enrichedContext, expectedAmount });

    await writeAuditLog({
      action: 'HARDWARE_COUNTER_READ',
      entityType: 'EXECUTION_SESSION',
      entityId: context.transactionId || 'UNKNOWN',
      performedByUserId: context.operatorId,
      newValues: { ...context, success: result.success, total: result.data?.total }
    });

    return result;
  }
};

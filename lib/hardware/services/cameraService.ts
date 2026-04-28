import { hardwareRegistry } from '../hardwareRegistry';
import { writeAuditLog } from '../../auditLogger';
import { HardwareContext, HardwareResponse } from '../types/common';
import { CameraSnapshot, CameraRecordingStatus } from '../types/camera';
import { getBranchHardwareConfig } from '../dbConfig';

export const cameraService = {
  async takeSnapshot(context: HardwareContext): Promise<HardwareResponse<CameraSnapshot>> {
    const config = await getBranchHardwareConfig(context.branchId);
    const enrichedContext = { ...context, branchConfig: config };
    const adapter = hardwareRegistry.getCamera(context.branchId, config);
    const result = await adapter.getSnapshot(enrichedContext as any);
    
    await writeAuditLog({
      action: 'HARDWARE_CAMERA_SNAPSHOT',
      entityType: 'EXECUTION_SESSION',
      entityId: context.transactionId || 'UNKNOWN',
      performedByUserId: context.operatorId,
      newValues: { ...context, success: result.success, status: result.status }
    });

    return result;
  },

  async startRecording(context: HardwareContext): Promise<HardwareResponse<CameraRecordingStatus>> {
    const config = await getBranchHardwareConfig(context.branchId);
    const enrichedContext = { ...context, branchConfig: config };
    const adapter = hardwareRegistry.getCamera(context.branchId, config);
    const result = await adapter.startRecording(enrichedContext as any);

    await writeAuditLog({
      action: 'HARDWARE_CAMERA_RECORD_START',
      entityType: 'EXECUTION_SESSION',
      entityId: context.transactionId || 'UNKNOWN',
      performedByUserId: context.operatorId,
      newValues: { ...context, success: result.success }
    });

    return result;
  },

  async stopRecording(context: HardwareContext): Promise<HardwareResponse<CameraRecordingStatus>> {
    const config = await getBranchHardwareConfig(context.branchId);
    const enrichedContext = { ...context, branchConfig: config };
    const adapter = hardwareRegistry.getCamera(context.branchId, config);
    const result = await adapter.stopRecording(enrichedContext as any);

    await writeAuditLog({
      action: 'HARDWARE_CAMERA_RECORD_STOP',
      entityType: 'EXECUTION_SESSION',
      entityId: context.transactionId || 'UNKNOWN',
      performedByUserId: context.operatorId,
      newValues: { ...context, success: result.success, duration: result.data?.duration }
    });

    return result;
  }
};

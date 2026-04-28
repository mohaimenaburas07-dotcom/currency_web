import { HardwareResponse } from './common';

export interface CameraSnapshot {
  url: string;
  timestamp: string;
  format: 'jpg' | 'png';
}

export interface CameraRecordingStatus {
  isRecording: boolean;
  startTime?: string;
  duration?: number;
  filePath?: string;
}

export interface ICameraAdapter {
  getSnapshot(context: { branchId: string; transactionId: string; deviceId?: string }): Promise<HardwareResponse<CameraSnapshot>>;
  startRecording(context: { branchId: string; transactionId: string; deviceId?: string }): Promise<HardwareResponse<CameraRecordingStatus>>;
  stopRecording(context: { branchId: string; transactionId: string; deviceId?: string }): Promise<HardwareResponse<CameraRecordingStatus>>;
  getStatus(branchId: string, deviceId?: string): Promise<HardwareResponse<any>>;
}

import { ICameraAdapter, CameraSnapshot, CameraRecordingStatus } from '../types/camera';
import { ICounterAdapter, CounterResult } from '../types/counter';
import { IPrinterAdapter, PrinterJob } from '../types/printer';
import { HardwareResponse } from '../types/common';

export class MockCameraAdapter implements ICameraAdapter {
  async getSnapshot(): Promise<HardwareResponse<CameraSnapshot>> {
    return {
      success: true,
      status: 'CONNECTED',
      data: {
        url: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=800',
        timestamp: new Date().toISOString(),
        format: 'jpg'
      }
    };
  }

  async startRecording(): Promise<HardwareResponse<CameraRecordingStatus>> {
    return {
      success: true,
      status: 'BUSY',
      data: { isRecording: true, startTime: new Date().toISOString() }
    };
  }

  async stopRecording(): Promise<HardwareResponse<CameraRecordingStatus>> {
    return {
      success: true,
      status: 'CONNECTED',
      data: { isRecording: false, duration: 15 }
    };
  }

  async getStatus(branchId: string, deviceId?: string): Promise<HardwareResponse<void>> {
    return { success: true, status: 'CONNECTED' };
  }
}

export class MockCounterAdapter implements ICounterAdapter {
  async readCount(context: { expectedAmount?: number }): Promise<HardwareResponse<CounterResult>> {
    const total = context.expectedAmount || 2000;
    return {
      success: true,
      status: 'CONNECTED',
      data: {
        total,
        currency: 'USD',
        denominations: [
          { denomination: 100, notesCount: Math.floor(total / 100), subtotal: Math.floor(total / 100) * 100 }
        ],
        mismatchWarning: false
      }
    };
  }

  async getStatus(branchId: string, deviceId?: string): Promise<HardwareResponse<void>> {
    return { success: true, status: 'CONNECTED' };
  }
}

export class MockPrinterAdapter implements IPrinterAdapter {
  async printReceipt(): Promise<HardwareResponse<{ jobId: string }>> {
    return {
      success: true,
      status: 'CONNECTED',
      data: { jobId: `MOCK_JOB_${Date.now()}` }
    };
  }

  async getStatus(branchId: string, deviceId?: string): Promise<HardwareResponse<void>> {
    return { success: true, status: 'CONNECTED' };
  }
}

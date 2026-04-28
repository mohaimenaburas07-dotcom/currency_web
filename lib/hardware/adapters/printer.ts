import { IPrinterAdapter, PrinterJob } from '../types/printer';
import { HardwareResponse } from '../types/common';
import { HARDWARE_CONFIG } from '../config';

export class USBPrinterAdapter implements IPrinterAdapter {
  private gatewayUrl = HARDWARE_CONFIG.GATEWAY_URL;

  async getStatus(): Promise<HardwareResponse<void>> {
    try {
      const res = await fetch(`${this.gatewayUrl}/hardware/printer/status`, {
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return {
        success: true,
        status: data.connected ? 'CONNECTED' : 'OFFLINE'
      };
    } catch (e) {
      return {
        success: false,
        status: 'OFFLINE',
        error: { code: 'GATEWAY_UNREACHABLE', message: 'Printer gateway not responding' }
      };
    }
  }

  async printReceipt(data: any): Promise<HardwareResponse<{ jobId: string }>> {
    try {
      const res = await fetch(`${this.gatewayUrl}/hardware/printer/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error('Printing failed at gateway');
      
      const result = await res.json();
      return {
        success: true,
        status: 'CONNECTED',
        data: { jobId: result.jobId }
      };
    } catch (e: any) {
      return {
        success: false,
        status: 'CONNECTED',
        error: { code: 'PRINT_ERROR', message: e.message }
      };
    }
  }
}

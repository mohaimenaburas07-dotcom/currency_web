import { ICounterAdapter, CounterResult } from '../types/counter';
import { HardwareResponse } from '../types/common';
import { HARDWARE_CONFIG } from '../config';

export class USBCounterAdapter implements ICounterAdapter {
  private gatewayUrl = HARDWARE_CONFIG.GATEWAY_URL;

  async getStatus(branchId: string, deviceId?: string): Promise<HardwareResponse<any>> {
    try {
      const url = new URL(`${this.gatewayUrl}/hardware/counter/status`);
      if (deviceId) url.searchParams.append('deviceId', deviceId);
      
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return {
        success: true,
        status: data.connected ? 'CONNECTED' : 'OFFLINE',
        data: data
      };
    } catch (e) {
      return {
        success: false,
        status: 'OFFLINE',
        error: { code: 'GATEWAY_UNREACHABLE', message: 'Counter gateway not responding' }
      };
    }
  }

  async readCount(context: { branchId: string; expectedAmount?: number; deviceId?: string }): Promise<HardwareResponse<CounterResult>> {
    try {
      const res = await fetch(`${this.gatewayUrl}/hardware/counter/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
        signal: AbortSignal.timeout(10000) // Wait up to 10s for counting to finish
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Counter read failed at gateway');
      }

      const result = await res.json();
      
      // Ensure structured response even if hardware returns limited data
      const normalizedData: CounterResult = {
        total: result.total || 0,
        currency: result.currency || 'USD',
        denominations: Array.isArray(result.denominations) ? result.denominations : [],
        usd_serial_numbers: Array.isArray(result.usd_serial_numbers) ? result.usd_serial_numbers : [],
        mismatchWarning: context.expectedAmount ? (result.total !== context.expectedAmount) : false
      };

      return {
        success: true,
        status: 'CONNECTED',
        data: normalizedData
      };
    } catch (e: any) {
      return {
        success: false,
        status: 'CONNECTED',
        error: { code: 'COUNTER_ERROR', message: e.message }
      };
    }
  }
}

import { HardwareResponse } from './common';

export interface DenominationBreakdown {
  denomination: number;
  notesCount: number;
  subtotal: number;
}

export interface CounterResult {
  total: number;
  currency: string;
  denominations: DenominationBreakdown[];
  usd_serial_numbers?: string[];
  mismatchWarning?: boolean;
}

export interface ICounterAdapter {
  readCount(context: { branchId: string; expectedAmount?: number; deviceId?: string }): Promise<HardwareResponse<CounterResult>>;
  getStatus(branchId: string, deviceId?: string): Promise<HardwareResponse<any>>;
}

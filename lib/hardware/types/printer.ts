import { HardwareResponse } from './common';

export type ReceiptType = 'CUSTOMER' | 'ARCHIVE';

export interface PrinterJob {
  transactionId: string;
  data: any;
  copyType: ReceiptType;
}

export interface IPrinterAdapter {
  printReceipt(context: { branchId: string; job: PrinterJob; deviceId?: string }): Promise<HardwareResponse<{ jobId: string }>>;
  getStatus(branchId: string, deviceId?: string): Promise<HardwareResponse<any>>;
}

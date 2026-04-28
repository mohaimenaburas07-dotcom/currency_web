export type DeviceStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'BUSY' | 'PAPER_OUT' | 'OFFLINE';

export interface HardwareContext {
  branchId: string;
  operatorId: string;
  transactionId?: string;
  deviceId?: string;
  branchConfig?: any; // To store DB-fetched IPs
}

export interface HardwareResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  status: DeviceStatus;
}

export interface DeviceConfig {
  id: string;
  type: 'CAMERA' | 'COUNTER' | 'PRINTER';
  brand: string;
  model: string;
  connection: {
    type: 'USB' | 'SERIAL' | 'NETWORK' | 'HID';
    address: string;
  };
}

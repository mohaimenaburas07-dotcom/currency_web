import { HardwareResponse } from './camera';

export interface IScannerAdapter {
  getStatus(deviceId?: string): Promise<HardwareResponse<{ 
    connected: boolean, 
    deviceName?: string,
    capabilities?: string[] 
  }>>;
  
  scan(options?: {
    deviceId?: string;
    resolution?: number;
    colorMode?: 'color' | 'grayscale' | 'bw';
    source?: 'flatbed' | 'adf';
  }): Promise<HardwareResponse<{
    imageData: string; // Base64 or URL
    format: 'jpg' | 'png' | 'pdf';
  }>>;
  
  getDevices(): Promise<HardwareResponse<{
    devices: { id: string, name: string }[]
  }>>;
}

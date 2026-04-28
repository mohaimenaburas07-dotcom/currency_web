import { IScannerAdapter } from '../types/scanner';
import { HardwareResponse } from '../types/camera';
import { HARDWARE_CONFIG } from '../config';

export class USBScannerAdapter implements IScannerAdapter {
  private gatewayUrl = HARDWARE_CONFIG.GATEWAY_URL;

  async getStatus(): Promise<HardwareResponse<{ connected: boolean; deviceName?: string; capabilities?: string[]; devices?: any[] }>> {
    try {
      // Explicitly check status through the local Hardware Agent (port 5001)
      const res = await fetch(`${this.gatewayUrl}/hardware/scanner/status`, {
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) throw new Error('Agent returned error');
      const data = await res.json();
      
      // Requirement: Show as connected ONLY if agent detects actual scanner-capable device
      const hasDevices = Array.isArray(data.devices) && data.devices.length > 0;
      const isActualScannerPresent = data.connected === true && (data.deviceName || hasDevices);
      
      return {
        success: true,
        status: isActualScannerPresent ? 'CONNECTED' : 'OFFLINE',
        data: {
          ...data,
          connected: isActualScannerPresent,
          devices: data.devices || []
        }
      };
    } catch (e) {
      return {
        success: false,
        status: 'OFFLINE',
        error: { 
          code: 'GATEWAY_UNREACHABLE', 
          message: 'Scanner Agent (localhost:5001) is not running or no WIA/TWAIN devices detected. Ensure the agent is active and your scanner is connected via USB.' 
        }
      };
    }
  }

  async scan(options?: any): Promise<HardwareResponse<{ imageData: string; format: 'jpg' | 'png' | 'pdf' }>> {
    try {
      const res = await fetch(`${this.gatewayUrl}/hardware/scanner/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
        signal: AbortSignal.timeout(120000) // Scans can be slow (2 minutes)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Scanning failed at gateway');
      }
      
      const result = await res.json();
      return {
        success: true,
        status: 'CONNECTED',
        data: {
          imageData: result.imageData, // Expected to be base64 data URL
          format: result.format || 'jpg'
        }
      };
    } catch (e: any) {
      return {
        success: false,
        status: 'CONNECTED',
        error: { code: 'SCAN_ERROR', message: e.message }
      };
    }
  }

  async getDevices(): Promise<HardwareResponse<{ devices: { id: string; name: string }[] }>> {
    try {
      const res = await fetch(`${this.gatewayUrl}/hardware/scanner/devices`);
      const data = await res.json();
      return { success: true, status: 'CONNECTED', data: { devices: data } };
    } catch (e) {
      return { success: false, status: 'OFFLINE', data: { devices: [] } };
    }
  }
}

/**
 * Fallback Mock Adapter for development/demo
 */
export class MockScannerAdapter implements IScannerAdapter {
  async getStatus(): Promise<HardwareResponse<{ connected: boolean; deviceName?: string; capabilities?: string[] }>> {
    return {
      success: true,
      status: 'CONNECTED',
      data: { connected: true, deviceName: 'Generic USB Scanner (Mock)', capabilities: ['color', 'jpg'] }
    };
  }

  async scan(): Promise<HardwareResponse<{ imageData: string; format: 'jpg' | 'png' | 'pdf' }>> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      success: true,
      status: 'CONNECTED',
      data: {
        // Using a more "technical" looking placeholder for mock mode
        imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4QAAAFKAQMAAAB6N96FAAAABlBMVEUAAAD///+l2Z/dAAABF0lEQVR42u3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOA8QX6AAAF7pS9AAAAAElFTkSuQmCC', 
        format: 'jpg'
      }
    };
  }

  async getDevices(): Promise<HardwareResponse<{ devices: { id: string; name: string }[] }>> {
    return { success: true, status: 'CONNECTED', data: { devices: [{ id: 'mock-1', name: 'Mock Scanner' }] } };
  }
}

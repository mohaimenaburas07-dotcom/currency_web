import { IScannerAdapter } from './types/scanner';
import { MockCameraAdapter, MockPrinterAdapter } from './adapters/mock';
import { USBScannerAdapter } from './adapters/scanner';
import { USBCounterAdapter } from './adapters/counter';
import { USBPrinterAdapter } from './adapters/printer';
import { NetworkCameraAdapter } from './adapters/networkCamera';

class HardwareRegistry {
  private static instance: HardwareRegistry;
  
  private mockCameraAdapter: ICameraAdapter = new MockCameraAdapter();
  private counterAdapter: ICounterAdapter = new USBCounterAdapter();
  private printerAdapter: IPrinterAdapter = new USBPrinterAdapter();
  private scannerAdapter: IScannerAdapter = new USBScannerAdapter();
  
  private cameraAdapters: Map<string, ICameraAdapter> = new Map();

  private constructor() {}

  public static getInstance(): HardwareRegistry {
    if (!HardwareRegistry.instance) {
      HardwareRegistry.instance = new HardwareRegistry();
    }
    return HardwareRegistry.instance;
  }

  getCamera(branchId: string, branchConfig?: any, deviceId?: string): ICameraAdapter {
    const devices = branchConfig?.devices || [];
    const device = deviceId ? devices.find((d: any) => d.id === deviceId) : null;
    
    let ip = device?.connectionInfo?.ip;
    let username = device?.connectionInfo?.username;
    let password = device?.connectionInfo?.password;

    if (!ip) {
      ip = branchConfig?.cameraIp || branchConfig?.camera_ip;
      username = branchConfig?.cameraUsername;
      password = branchConfig?.cameraPassword;
    }
    
    if (ip) {
      let adapterKey = ip;
      // If we have credentials separately, encode them into the adapter key if not already there
      if (username && password && !ip.includes('@')) {
        const cleanIp = ip.replace(/^https?:\/\//, '');
        adapterKey = `${username}:${password}@${cleanIp}`;
      }

      if (!this.cameraAdapters.has(adapterKey)) {
        this.cameraAdapters.set(adapterKey, new NetworkCameraAdapter(adapterKey));
      }
      return this.cameraAdapters.get(adapterKey)!;
    }
    return this.mockCameraAdapter;
  }

  getCounter(branchId: string, branchConfig?: any, deviceId?: string): ICounterAdapter {
    // For now, adapters are singletons but we can pass the deviceId/config to their methods
    return this.counterAdapter;
  }

  getPrinter(branchId: string, branchConfig?: any, deviceId?: string): IPrinterAdapter {
    return this.printerAdapter;
  }

  getScanner(branchId: string, branchConfig?: any, deviceId?: string): IScannerAdapter {
    return this.scannerAdapter;
  }
}

export const hardwareRegistry = HardwareRegistry.getInstance();

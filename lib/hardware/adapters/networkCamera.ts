import { ICameraAdapter, CameraSnapshot, CameraRecordingStatus } from '../types/camera';
import { HardwareResponse } from '../types/common';
import { fetchWithDigest } from '../digestFetch';

export interface CameraDiagnosticResult {
  path: string;
  statusCode: number | null;
  authChallenge: string | null;
  error: string | null;
  durationMs: number;
  success: boolean;
}

export interface CameraDiagnosticsReport {
  deviceIp: string;
  reachable: boolean;
  authPassed: boolean;
  authType: string | null;
  resolvedEndpoint: string | null;
  rootCheck: CameraDiagnosticResult | null;
  endpointChecks: CameraDiagnosticResult[];
  fallbackReason: string | null;
}

export class NetworkCameraAdapter implements ICameraAdapter {
  private cameraIp: string;
  private resolvedEndpoint: string | null = null;
  public lastDiagnostics: CameraDiagnosticsReport | null = null;

  constructor(cameraIp: string) {
    let ip = cameraIp.replace(/\/$/, ''); // remove trailing slash
    // If the database string is something like admin:123456@10.12.21.11, it lacks a protocol.
    // Node.js fetch will treat "admin:" as a custom protocol and crash instantly with "fetch failed".
    if (!ip.startsWith('http://') && !ip.startsWith('https://')) {
      ip = `http://${ip}`;
    }
    this.cameraIp = ip;
  }

  private parseCredentials(urlStr: string) {
    let username = '';
    let password = '';
    let safeUrl = urlStr;
    try {
      const parsedUrl = new URL(urlStr);
      if (parsedUrl.username && parsedUrl.password) {
        username = parsedUrl.username;
        password = decodeURIComponent(parsedUrl.password);
        safeUrl = urlStr.replace(`${parsedUrl.username}:${parsedUrl.password}@`, '');
      }
    } catch (e) {
      // Ignore
    }
    return { username, password, safeUrl };
  }

  private async testEndpoint(path: string, isRoot: boolean = false): Promise<CameraDiagnosticResult> {
    const fullUrl = `${this.cameraIp}${path}`;
    const { username, password, safeUrl } = this.parseCredentials(fullUrl);
    const startTime = Date.now();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    let statusCode: number | null = null;
    let authChallenge: string | null = null;
    let errorMsg: string | null = null;
    let success = false;
    let attemptedUrl = '';

    try {
      const testUrl = isRoot ? safeUrl : `${safeUrl}?t=${Date.now()}`;
      attemptedUrl = testUrl;
      const response = await fetchWithDigest(testUrl, { method: 'GET', signal: controller.signal }, username, password);
      
      statusCode = response.status;
      authChallenge = response.headers.get('www-authenticate') || null;
      
      if (isRoot) {
        success = response.ok || statusCode === 401;
      } else {
        success = response.ok;
      }

      try { await response.arrayBuffer(); } catch(e) {}

    } catch (error: any) {
      errorMsg = error.message || 'Unknown Error';
      if (error.cause) {
        errorMsg += ` (Cause: ${error.cause.message || error.cause.code})`;
      }
      if (error.code) {
        errorMsg += ` [Code: ${error.code}]`;
      }
      // Log it directly to console as well to bypass Next.js masking
      console.error(`[Camera Debug] Fetch failed for ${attemptedUrl}:`, error);
    } finally {
      clearTimeout(timeoutId);
    }

    return {
      path: isRoot ? '/' : path,
      statusCode,
      authChallenge,
      error: errorMsg,
      durationMs: Date.now() - startTime,
      success
    };
  }

  public async runDiagnostics(): Promise<CameraDiagnosticsReport> {
    const report: CameraDiagnosticsReport = {
      deviceIp: this.cameraIp.replace(/\/\/.*@/, '//***:***@'),
      reachable: false,
      authPassed: false,
      authType: null,
      resolvedEndpoint: null,
      rootCheck: null,
      endpointChecks: [],
      fallbackReason: null
    };

    // 1. Root Check
    report.rootCheck = await this.testEndpoint('', true);
    report.reachable = report.rootCheck.success || report.rootCheck.statusCode !== null;
    if (report.rootCheck.authChallenge) {
      report.authType = report.rootCheck.authChallenge.split(' ')[0];
    }

    if (!report.reachable) {
      report.fallbackReason = 'Device entirely unreachable on port 80/443 (timeout/refused)';
      this.lastDiagnostics = report;
      return report;
    }

    // 2. Endpoint Discovery
    const endpointsToTry = [
      '/images/snapshot.jpg',
      // Official Uniview LAPI Stream 0 (Main Stream)
      '/LAPI/V1.0/Channels/1/Media/Video/Streams/0/Snapshot',
      '/LAPI/V1.0/Channels/1/Media/Video/Streams/1/Snapshot',
      '/LAPI/V1.0/Channels/1/Media/Video/Streams/2/Snapshot',
      '/ISAPI/Streaming/channels/101/picture',
      '/cgi-bin/snapshot.cgi',
      '/images/snapshot.jpg?cam=1',
      '/images/snapshot.jpg?cam=2'
    ];
    
    // NOTE for future RTSP Integration:
    // Uniview SDK specifies LiveStreamURL at: 
    // /LAPI/V1.0/Channels/1/Media/Video/Streams/0/LiveStreamURL

    let authFailedCount = 0;
    let notFoundCount = 0;

    for (const ep of endpointsToTry) {
      const result = await this.testEndpoint(ep, false);
      report.endpointChecks.push(result);
      
      if (result.statusCode === 401) authFailedCount++;
      if (result.statusCode === 404) notFoundCount++;

      if (result.success) {
        this.resolvedEndpoint = ep;
        report.resolvedEndpoint = ep;
        report.authPassed = true;
        break;
      }
    }

    if (!report.resolvedEndpoint) {
      if (authFailedCount > 0) {
         report.fallbackReason = 'Reachable but authentication failed (401). Check password or Digest/Basic auth compatibility.';
      } else if (notFoundCount === endpointsToTry.length) {
         report.fallbackReason = 'Reachable and auth OK, but snapshot endpoint not found (404). Snapshot feature might be disabled in camera config.';
      } else {
         report.fallbackReason = 'All endpoint attempts failed. Snapshot may be disabled or model unsupported.';
      }
    }

    this.lastDiagnostics = report;
    return report;
  }

  public async resolveEndpoint(controller: AbortController): Promise<string | null> {
    if (this.resolvedEndpoint) return this.resolvedEndpoint;
    const diag = await this.runDiagnostics();
    return diag.resolvedEndpoint;
  }

  async getSnapshot(context?: any): Promise<HardwareResponse<CameraSnapshot>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const endpoint = await this.resolveEndpoint(controller);
      if (!endpoint) {
         clearTimeout(timeoutId);
         throw new Error('No valid snapshot endpoint found. Check diagnostics.');
      }

      const snapshotUrl = `${this.cameraIp}${endpoint}`;
      const { username, password, safeUrl } = this.parseCredentials(snapshotUrl);

      const fetchOptions: RequestInit = {
        signal: controller.signal
      };

      const response = await fetchWithDigest(`${safeUrl}?t=${Date.now()}`, fetchOptions, username, password);

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Camera responded with status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Data}`;

      return {
        success: true,
        status: 'CONNECTED',
        data: {
          url: dataUrl,
          timestamp: new Date().toISOString(),
          format: 'jpg'
        }
      };
    } catch (error: any) {
      console.error('[NetworkCameraAdapter] Error taking snapshot:', error);
      return {
        success: false,
        status: 'ERROR',
        error: {
          code: 'CAMERA_UNREACHABLE',
          message: `فشل الاتصال بالكاميرا: ${error.message}`
        }
      };
    }
  }

  async getLiveStreamConfig(streamId: number = 1): Promise<HardwareResponse<{ rtspUrl: string, streamId: number }>> {
    try {
      const { username, password, safeUrl } = this.parseCredentials(this.cameraIp);
      
      // Standard Uniview RTSP path: rtsp://username:password@ip:554/media/video[X]
      // Stream 1: Main Stream (often H.265/HEVC)
      // Stream 2: Sub Stream (often H.264, better for WebRTC)
      const ipOnly = safeUrl.replace(/^https?:\/\//, '');
      const rtspUrl = `rtsp://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${ipOnly}:554/media/video${streamId}`;
      
      return {
        success: true,
        status: 'CONNECTED',
        data: {
          rtspUrl,
          streamId
        }
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'ERROR',
        error: { code: 'RTSP_UNAVAILABLE', message: 'Failed to build RTSP URL' }
      };
    }
  }

  async startRecording(context?: any): Promise<HardwareResponse<CameraRecordingStatus>> {
    return {
      success: false,
      status: 'ERROR',
      error: { code: 'NOT_IMPLEMENTED', message: 'Recording not implemented for this IP' }
    };
  }

  async stopRecording(context?: any): Promise<HardwareResponse<CameraRecordingStatus>> {
    return {
      success: false,
      status: 'ERROR',
      error: { code: 'NOT_IMPLEMENTED', message: 'Recording not implemented for this IP' }
    };
  }

  async getStatus(branchId: string, deviceId?: string): Promise<HardwareResponse<void>> {
    try {
      const controller = new AbortController();
      const endpoint = await this.resolveEndpoint(controller);
      
      if (endpoint) {
        return { success: true, status: 'CONNECTED' };
      }
      return { success: false, status: 'OFFLINE' };
    } catch {
      return { success: false, status: 'OFFLINE' };
    }
  }
}

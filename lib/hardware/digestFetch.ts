import crypto from 'crypto';
import http from 'http';

function parseDigestHeader(header: string) {
  const parts = header.substring(7).split(/,\s*/);
  const result: Record<string, string> = {};
  parts.forEach(part => {
    const [key, val] = part.split('=');
    if (key && val) {
      result[key] = val.replace(/^"(.*)"$/, '$1');
    }
  });
  return result;
}

function md5(data: string) {
  return crypto.createHash('md5').update(data).digest('hex');
}

// Emulate fetch Response interface for the adapter
export interface MockResponse {
  ok: boolean;
  status: number;
  headers: {
    get: (name: string) => string | null;
  };
  arrayBuffer: () => Promise<ArrayBuffer>;
}

function performHttpRequest(urlStr: string, options: any): Promise<MockResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    
    // We strictly only support HTTP port 80 for this Uniview path per requirements
    const reqOptions: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      insecureHTTPParser: true, // Crucial for Uniview non-compliant headers
      timeout: 5000
    };

    const req = http.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', chunk => chunks.push(chunk));
      
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          ok: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
          status: res.statusCode || 500,
          headers: {
            get: (name: string) => {
              const val = res.headers[name.toLowerCase()];
              return val ? (Array.isArray(val) ? val[0] : val) : null;
            }
          },
          arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request Timeout'));
    });

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        req.destroy();
        reject(new Error('AbortError'));
      });
    }

    req.end();
  });
}

export async function fetchWithDigest(url: string, options: RequestInit = {}, username?: string, password?: string): Promise<MockResponse> {
  const method = options.method || 'GET';
  
  // Try normal http request first
  let response = await performHttpRequest(url, options);

  // If 401, try to parse WWW-Authenticate
  if (response.status === 401 && username && password) {
    const authHeader = response.headers.get('www-authenticate');
    
    if (authHeader && authHeader.toLowerCase().startsWith('digest')) {
      const parsedUrl = new URL(url);
      const uri = parsedUrl.pathname + parsedUrl.search;
      const digestInfo = parseDigestHeader(authHeader);
      
      const cnonce = crypto.randomBytes(8).toString('hex');
      const nc = '00000001';
      
      const ha1 = md5(`${username}:${digestInfo.realm}:${password}`);
      const ha2 = md5(`${method}:${uri}`);
      
      let responseHash = '';
      if (digestInfo.qop === 'auth' || digestInfo.qop === 'auth-int') {
        responseHash = md5(`${ha1}:${digestInfo.nonce}:${nc}:${cnonce}:${digestInfo.qop}:${ha2}`);
      } else {
        responseHash = md5(`${ha1}:${digestInfo.nonce}:${ha2}`);
      }

      const authValues = [
        `username="${username}"`,
        `realm="${digestInfo.realm}"`,
        `nonce="${digestInfo.nonce}"`,
        `uri="${uri}"`,
        `response="${responseHash}"`
      ];

      if (digestInfo.opaque) {
        authValues.push(`opaque="${digestInfo.opaque}"`);
      }
      if (digestInfo.qop) {
        authValues.push(`qop=${digestInfo.qop}`);
        authValues.push(`nc=${nc}`);
        authValues.push(`cnonce="${cnonce}"`);
      }

      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Digest ${authValues.join(', ')}`
        }
      };

      // Retry the request with Digest Auth
      response = await performHttpRequest(url, newOptions);
      
    } else if (authHeader && authHeader.toLowerCase().startsWith('basic')) {
      // Automatic fallback to Basic Auth if the camera requires it
      const base64Auth = Buffer.from(`${username}:${password}`).toString('base64');
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Basic ${base64Auth}`
        }
      };
      response = await performHttpRequest(url, newOptions);
    }
  }

  return response;
}

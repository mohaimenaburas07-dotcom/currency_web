export const HARDWARE_CONFIG = {
  // Global toggle to enable/disable hardware checks and features
  ENABLE_HARDWARE_INTEGRATION: true,
  
  // Default branch UUID for testing or fallback
  DEFAULT_BRANCH_ID: '6ea54323-2236-4c29-888d-9a1edf295c29',
  GATEWAY_URL: 'http://localhost:5001', // Local Windows Hardware Agent port
  /** Next.js rewrites /local-agent/* → 127.0.0.1:5088 (client must use this path, not :5088 directly) */
  LOCAL_AGENT_PROXY_BASE: '/local-agent',
  TIMEOUT_MS: 5000,
  RETRY_ATTEMPTS: 2,
};

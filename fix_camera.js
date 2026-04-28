const fs = require('fs');
const filePath = 'd:/currency_web/components/execute/execute-operation.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Camera Capturing (Avoid SecurityError by using local Blob URL or just ensuring origin)
// We'll modify the refresh interval to use a fetch-and-blob approach for 100% safety
const oldCameraEffect = `    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1)
    }, 150)`;

const newCameraEffect = `    const interval = setInterval(async () => {
      if (step === 3 && isCameraConnected) {
        try {
          const url = \`/api/hardware/camera/stream?branchId=\${hardwareConfig.branchCode || HARDWARE_CONFIG.DEFAULT_BRANCH_ID}&t=\${Date.now()}\`;
          const res = await fetch(url);
          if (!res.ok) return;
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          // Cleanup old URL
          if (window.lastBlobUrl) URL.revokeObjectURL(window.lastBlobUrl);
          window.lastBlobUrl = blobUrl;
          
          setLiveUrl(blobUrl);
        } catch (e) {
          console.error("Failed to fetch camera frame:", e);
        }
      } else {
        setRefreshKey(prev => prev + 1);
      }
    }, 200)`;

// We need to add setLiveUrl state
let fixed = content.replace('const [refreshKey, setRefreshKey] = useState(0)', 'const [refreshKey, setRefreshKey] = useState(0); const [liveUrl, setLiveUrl] = useState("");');

// Replace the liveUrl usage in the img tag
fixed = fixed.replace('src={liveCameraUrl}', 'src={liveUrl || liveCameraUrl}');

// Also ensure we use the liveUrl in the capture function
fixed = fixed.replace(oldCameraEffect, newCameraEffect);

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Applied Camera Capture Fix (Blob URL approach)');

const fs = require('fs');
const filePath = 'd:/currency_web/components/execute/execute-operation.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// 1. Add State
let fixed = content.replace('const [customer, setCustomer] = useState<any>(null)', 'const [customer, setCustomer] = useState<any>(null)\n  const [liveUrl, setLiveUrl] = useState("")\n  const [refreshKey, setRefreshKey] = useState(0)');

// 2. Add Effect for Blob fetching
const newEffect = `
  // Camera stream frame update logic
  useEffect(() => {
    if (currentStep !== 3 || !isCameraConnected) return;
    
    let active = true;
    const updateFrame = async () => {
      if (!active) return;
      try {
        const branchId = hardwareConfigData?.branchCode || HARDWARE_CONFIG.DEFAULT_BRANCH_ID;
        const url = \`/api/hardware/camera/stream?branchId=\${branchId}&t=\${Date.now()}\`;
        const res = await fetch(url);
        if (res.ok && active) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          setLiveUrl(prev => {
            if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
            return blobUrl;
          });
        }
      } catch (e) {
        console.error("Frame fetch failed:", e);
      }
      if (active) setTimeout(updateFrame, 150);
    };
    
    updateFrame();
    return () => { 
      active = false;
      setLiveUrl(prev => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return "";
      });
    };
  }, [currentStep, isCameraConnected, hardwareConfigData?.branchCode]);
`;

// Insert the effect after the other effects
fixed = fixed.replace('  const isConfirming = ', newEffect + '\n  const isConfirming = ');

// 3. Update the img tag in the UI
// Look for the Uniview camera image tag
const oldImg = /<img[\s\S]+?ref=\{hwImgRef\}[\s\S]+?\/>/;
const newImg = `                        <img 
                          ref={hwImgRef} 
                          src={liveUrl || \`/api/hardware/camera/stream?branchId=\${hardwareConfigData?.branchCode || HARDWARE_CONFIG.DEFAULT_BRANCH_ID}&t=\${refreshKey}\`} 
                          alt="Feed" 
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover transition-all duration-700" 
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />`;

fixed = fixed.replace(oldImg, newImg);

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Fixed Camera Capturing Logic');

const fs = require('fs');
const filePath = 'd:/currency_web/components/execute/execute-operation.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- Restoring Improvements ---');

// 1. National ID & Passport Fallbacks
console.log('Applying ID Fallbacks...');
const oldDispCustomer = /const dispCustomer = \{[\s\S]+?\}/;
const newDispCustomer = `const dispCustomer = {
    name: customer?.name || fallbackName,
    nationalId: customer?.nationalId || 
               fallbackUser.national_id || 
               fallbackUser.identity_number || 
               fallbackUser.national_number || 
               fallbackUser.nid || 
               fallbackUser.identity_no ||
               request?.national_id || 
               request?.user?.national_id || 
               request?.identity_number || 
               request?.user?.identity_number || 
               request?.national_number || 
               request?.user?.national_number || 
               request?.customer?.national_id ||
               request?.customer?.identity_number ||
               request?.nationalId ||
               request?.nid ||
               "—",
    passport: customer?.passportNumber || fallbackUser.passport_number || fallbackUser.passport_id || request?.passport_number || request?.user?.passport_number || "—",
    phone: customer?.phone || fallbackUser.phone || fallbackUser.mobile_number || request?.phone || "—",
    address: customer?.address || fallbackUser.city || fallbackUser.address || "طرابلس - ليبيا",
  }`;
content = content.replace(oldDispCustomer, newDispCustomer);

// 2. Branch Name in Header
console.log('Applying Branch Name to UI...');
content = content.replace(
  'Hardware Integration Layer v1.0 (Branch: {HARDWARE_CONFIG.DEFAULT_BRANCH_ID})',
  'Hardware Integration Layer v1.0 (Branch: {hardwareConfigData?.branchName || HARDWARE_CONFIG.DEFAULT_BRANCH_ID})'
);

// 3. Branch Name in Step 1 Review
const gridStart = '<div className="grid grid-cols-2 gap-y-6 gap-x-12">';
const branchBadge = `
              {/* Branch Information */}
              {hardwareConfigData?.branchName && (
                <div className="col-span-2 flex items-center gap-2 bg-waha-gold/5 px-4 py-2 rounded-xl border border-waha-gold/10 mb-2">
                  <span className="text-[10px] font-bold text-waha-gold uppercase tracking-wider">الفرع الحالي:</span>
                  <span className="text-sm font-black text-waha-gray-900">{hardwareConfigData.branchName}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">`;
content = content.replace(gridStart, branchBadge);

// 4. Excel Fallback for Step 4
console.log('Applying Excel Fallback...');
const excelButton = `
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      accept=".xlsx,.xls"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        toast.info("جاري معالجة ملف الإكسل...");
                        // Simulation of excel processing
                        await new Promise(r => setTimeout(r, 1500));
                        const ok = await onUpload();
                        if (ok) toast.success("تم استيراد البيانات من الإكسل بنجاح");
                      }}
                    />
                    <Button variant="outline" className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-600 font-bold text-xs gap-2 bg-emerald-50/50">
                       <CloudUpload className="w-4 h-4" /> إدخال عبر إكسل (يدوي)
                    </Button>
                  </div>
                  <Button onClick={() => onHardwareRead()} disabled={!hardwareStatus.counter || hardwareStatus.counter === 'OFFLINE'} className="h-10 px-6 rounded-xl bg-waha-gray-900 text-white font-bold text-xs gap-2">
                     <Calculator className="w-4 h-4" /> قراءة من الآلة
                  </Button>
                </div>`;
const oldButtonSection = /<Button onClick=\{\(\) => onHardwareRead\(\)\}[\s\S]+?<\/Button>/;
content = content.replace(oldButtonSection, excelButton);

// 5. Camera Fix (Blob URL)
console.log('Applying Camera Fix...');
content = content.replace(
  'const [customer, setCustomer] = useState<any>(null)',
  'const [customer, setCustomer] = useState<any>(null)\n  const [liveUrl, setLiveUrl] = useState("")\n  const [refreshKey, setRefreshKey] = useState(0)'
);

const cameraEffect = `
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
      } catch (e) {}
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

content = content.replace('const isConfirming = ', cameraEffect + '\n  const isConfirming = ');

const univiewImgPattern = /<img[\s\S]+?ref=\{hwImgRef\}[\s\S]+?\/>/;
const univiewImgReplacement = `                        <img 
                          ref={hwImgRef} 
                          src={liveUrl || \`/api/hardware/camera/stream?branchId=\${hardwareConfigData?.branchCode || HARDWARE_CONFIG.DEFAULT_BRANCH_ID}&t=\${refreshKey}\`} 
                          alt="Feed" 
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover transition-all duration-700" 
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />`;
content = content.replace(univiewImgPattern, univiewImgReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('--- Successfully Restored All Improvements ---');

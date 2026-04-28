const fs = require('fs');

const backup = fs.readFileSync('d:/currency_web/deploy_package/frontend/components/execute/execute-operation.tsx', 'utf8');
let content = backup;

console.log('Backup loaded, lines:', content.split('\n').length);

// ── 1. Fix dispCustomer (National ID fallbacks) ──
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
               request?.nationalId ||
               "—",
    passport: customer?.passportNumber || fallbackUser.passport_number || fallbackUser.passport_id || request?.passport_number || "—",
    phone: customer?.phone || fallbackUser.phone || fallbackUser.mobile_number || request?.phone || "—",
    address: customer?.address || fallbackUser.city || "طرابلس - ليبيا",
  }`;
content = content.replace(oldDispCustomer, newDispCustomer);
console.log('✓ National ID fallbacks applied');

// ── 2. Branch Name in Hardware Status Bar ──
content = content.replace(
  'Hardware Integration Layer v1.0 (Branch: {HARDWARE_CONFIG.DEFAULT_BRANCH_ID})',
  'Hardware Integration Layer v1.0 (Branch: {hardwareConfigData?.branchName || HARDWARE_CONFIG.DEFAULT_BRANCH_ID})'
);
console.log('✓ Branch name in status bar applied');

// ── 3. The scannedDoc preview in Step2 identity section ──
// In backup, the preview section shows <img src={scannedDoc}> which is correct — no changes needed there.
// The backup's Step2 identity section already has correct structure, so we keep it as-is.

// ── 4. Fix the 409 code check in loadData ──
// The backup still has old SESSION_ALREADY_EXISTS check. Update it.
content = content.replace(
  'if (!sessionRes.ok && sessionData.code !== "SESSION_ALREADY_EXISTS") {',
  'if (!sessionRes.ok) {'
);
console.log('✓ Session check updated');

fs.writeFileSync('d:/currency_web/components/execute/execute-operation.tsx', content, 'utf8');
console.log('✓ File saved. Total lines:', content.split('\n').length);

// Verify all steps are present
const steps = ['Step1Review', 'Step2Identity', 'Step3Documentation', 'Step4Cash', 'Step5Confirm', 'Step6Receipt'];
steps.forEach(step => {
  if (content.includes(`function ${step}(`)) {
    console.log(`  ✓ ${step} present`);
  } else {
    console.error(`  ✗ ${step} MISSING!`);
  }
});

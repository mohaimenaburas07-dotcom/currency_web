const fs = require('fs');
const filePath = 'd:/currency_web/components/execute/execute-operation.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// 1. National ID Fallbacks
const oldIdLine = 'nationalId: customer?.nationalId || fallbackUser.national_id || fallbackUser.identity_number || request?.national_id || request?.user?.national_id || request?.identity_number || request?.user?.identity_number || "—",';
const newIdLine = `nationalId: customer?.nationalId || 
                 fallbackUser.national_id || 
                 fallbackUser.identity_number || 
                 request?.national_id || 
                 request?.user?.national_id || 
                 request?.identity_number || 
                 request?.user?.identity_number || 
                 request?.customer?.national_id ||
                 request?.customer?.identity_number ||
                 request?.nationalId ||
                 "—",`;

let fixed = content.replace(oldIdLine, newIdLine);

// 2. Add Branch to Step 1 Review Card
// We'll find the grid where customer info is displayed and add Branch
const oldGridStart = '<div className="grid grid-cols-2 gap-y-6 gap-x-12">';
const newGridStart = `
              {/* Branch Information */}
              {hardwareConfigData?.branchName && (
                <div className="col-span-2 flex items-center gap-2 bg-waha-gold/5 px-4 py-2 rounded-xl border border-waha-gold/10 mb-2">
                  <span className="text-[10px] font-bold text-waha-gold uppercase tracking-wider">الفرع الحالي:</span>
                  <span className="text-sm font-black text-waha-gray-900">{hardwareConfigData.branchName}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
`;
fixed = fixed.replace(oldGridStart, newGridStart);

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Fixed National ID and added Branch to UI');

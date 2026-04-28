const fs = require('fs');
const filePath = 'd:/currency_web/components/execute/execute-operation.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// 1. More aggressive National ID searching
const oldIdStart = 'nationalId: customer?.nationalId ||';
const newIdBlock = `nationalId: customer?.nationalId || 
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
                 "—",`;

// We'll replace the whole dispCustomer object for safety
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

let fixed = content.replace(oldDispCustomer, newDispCustomer);

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Applied aggressive National ID fallbacks');

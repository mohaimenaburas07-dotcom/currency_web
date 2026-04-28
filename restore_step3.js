const fs = require('fs');

// Read the current (broken) file
const currentFile = fs.readFileSync('d:/currency_web/components/execute/execute-operation.tsx', 'utf8');

// Read the backup (complete) file
const backupFile = fs.readFileSync('d:/currency_web/deploy_package/frontend/components/execute/execute-operation.tsx', 'utf8');

// Extract Step3Documentation from backup
const step3Start = backupFile.indexOf('function Step3Documentation(');
const step4Start = backupFile.indexOf('\nfunction Step4Cash(');
const step3Code = backupFile.substring(step3Start, step4Start);

// Find where to insert in current file — between end of Step2 closing and start of Step4
const insertPoint = currentFile.indexOf('\nfunction Step4Cash(');
if (insertPoint === -1) {
  console.error('FATAL: Could not find Step4Cash in current file!');
  process.exit(1);
}

// Also check Step3 is not already there
if (currentFile.includes('function Step3Documentation(')) {
  console.log('Step3Documentation already exists!');
  process.exit(0);
}

// Insert Step3 before Step4
const newContent = currentFile.slice(0, insertPoint) + '\n\n' + step3Code + currentFile.slice(insertPoint);

fs.writeFileSync('d:/currency_web/components/execute/execute-operation.tsx', newContent, 'utf8');
console.log('✓ Step3Documentation restored successfully!');
console.log('New file line count:', newContent.split('\n').length);

const fs = require('fs');
const filePath = 'd:/currency_web/components/execute/execute-operation.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = 'alt="Feed"';
const replacement = 'alt="Feed"\n                    crossOrigin="anonymous"';

if (content.includes(target) && !content.includes('crossOrigin="anonymous"')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully added crossOrigin="anonymous"');
} else if (content.includes('crossOrigin="anonymous"')) {
    console.log('crossOrigin="anonymous" already exists');
} else {
    console.log('Target not found');
}

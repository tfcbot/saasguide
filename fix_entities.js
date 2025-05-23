const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/dashboard/components/marketing-campaigns.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of "don't" with "don&apos;t"
content = content.replace(/don't/g, "don&apos;t");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed unescaped entities in marketing-campaigns.tsx');

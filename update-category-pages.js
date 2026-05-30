const fs = require('fs');
const path = require('path');

const categories = [
  'app/tools/pdf-tools/page.jsx',
  'app/tools/image-tools/page.jsx',
  'app/tools/text-tools/page.jsx',
  'app/tools/media-tools/page.jsx',
  'app/tools/file-tools/page.jsx',
  'app/tools/qr-barcodes-tools/page.jsx',
  'app/tools/converter-tools/page.jsx',
  'app/tools/developer-tools/page.jsx',
  'app/tools/math-tools/page.jsx',
  'app/tools/ai-tools/page.jsx',
];

categories.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/bg-neutral-950 text-neutral-100/g, 'bg-neutral-100');
  content = content.replace(/bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-indigo-500/g, 'bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md');
  content = content.replace(/text-neutral-400 text-sm/g, 'text-neutral-500 text-sm');
  content = content.replace(/text-neutral-400 text-center mb-10/g, 'text-neutral-500 text-center mb-10');
  content = content.replace(/text-neutral-100 p-6/g, 'text-neutral-800 p-6');
  content = content.replace(/group-hover:text-indigo-400/g, 'group-hover:text-indigo-600');
  content = content.replace(/font-bold text-lg mb-1/g, 'font-bold text-lg mb-1 text-neutral-800');
  content = content.replace(/text-neutral-400 text-sm\b/g, 'text-neutral-500 text-sm');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated: ' + filePath);
});

console.log('All category pages updated!');
const fs = require('fs');
const path = require('path');

const getAllFiles = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (item === 'page.jsx') {
      files.push(fullPath);
    }
  });
  return files;
};

const files = getAllFiles('app/tools');
let updated = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = content.replace(/min-h-screen bg-neutral-950 text-neutral-100/g, 'min-h-screen bg-neutral-100');
  content = content.replace(/bg-neutral-900 rounded-xl/g, 'bg-white border border-neutral-200 rounded-xl shadow-sm');
  content = content.replace(/bg-neutral-800 border border-neutral-700/g, 'bg-neutral-50 border border-neutral-200');
  content = content.replace(/bg-neutral-800 rounded-xl/g, 'bg-neutral-50 rounded-xl border border-neutral-200');
  content = content.replace(/bg-neutral-800 rounded-lg/g, 'bg-neutral-50 rounded-lg border border-neutral-200');
  content = content.replace(/border-neutral-700/g, 'border-neutral-200');
  content = content.replace(/text-neutral-400 text-center mb-8/g, 'text-neutral-500 text-center mb-8');
  content = content.replace(/text-neutral-400 text-center mb-2/g, 'text-neutral-500 text-center mb-2');
  content = content.replace(/text-neutral-100/g, 'text-neutral-800');
  content = content.replace(/text-neutral-400\b/g, 'text-neutral-500');
  content = content.replace(/text-neutral-500 text-sm mt-1/g, 'text-neutral-400 text-sm mt-1');
  content = content.replace(/hover:bg-neutral-700/g, 'hover:bg-neutral-100');
  content = content.replace(/hover:bg-neutral-600/g, 'hover:bg-neutral-200');
  content = content.replace(/bg-neutral-700\b/g, 'bg-neutral-200');
  content = content.replace(/font-mono text-sm break-all text-indigo-400/g, 'font-mono text-sm break-all text-indigo-600');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
    updated++;
  }
});

console.log('Done! ' + updated + ' files updated.');
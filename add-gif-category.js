const fs = require('fs');
let content = fs.readFileSync('app/page.jsx', 'utf8');

const gifCategory = `  {
    icon: '🎞️',
    color: 'text-purple-500',
    title: 'GIF Tools',
    description: 'Convert videos and images to GIF format',
    href: '/tools/gif-tools',
    tools: ['Video to GIF', 'MP4 to GIF', 'GIF to MP4'],
    count: 9,
  },
`;

// Find the position of the AI Tools entry
const idx = content.indexOf("'🤖'");
if (idx === -1) { console.log('Not found!'); process.exit(1); }

// Find the start of that object
const start = content.lastIndexOf('{', idx);

// Insert before it
content = content.slice(0, start) + gifCategory + content.slice(start);

fs.writeFileSync('app/page.jsx', content, 'utf8');
console.log('Done! GIF Tools added.');
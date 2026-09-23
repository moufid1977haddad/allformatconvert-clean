// Generates public/og-image.png (1200x630) from an SVG built with the exact
// logo mark/colors used in app/components/Navbar.jsx (blue #185fa5, pink dots).
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// The number printed on the image is counted here, with the same rule as
// lib/toolCounts.js and scripts/check-tool-links.js (a tool page whose layout is
// noindex is a "Coming Soon" placeholder, not a working tool). It is also
// written to scripts/og-image.count so the build fails if the image goes stale
// (it said "225" for weeks while the site said 222).
const TOOLS_DIR = path.join(__dirname, '..', 'app', 'tools');
const NOINDEX_RE = /robots\s*:\s*\{[^}]*index\s*:\s*false/;
let TOOL_COUNT = 0;
for (const cat of fs.readdirSync(TOOLS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  for (const slug of fs.readdirSync(path.join(TOOLS_DIR, cat.name), { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const dir = path.join(TOOLS_DIR, cat.name, slug.name);
    if (!['page.jsx', 'page.js', 'page.tsx'].some((p) => fs.existsSync(path.join(dir, p)))) continue;
    const layout = ['layout.tsx', 'layout.ts', 'layout.jsx', 'layout.js'].map((p) => path.join(dir, p)).find((p) => fs.existsSync(p));
    if (layout && NOINDEX_RE.test(fs.readFileSync(layout, 'utf8'))) continue;
    TOOL_COUNT++;
  }
}

const BLUE = '#185fa5';
const BLACK = '#171717';
const GRAY = '#52525b';
const LIGHT_GRAY = '#94a3b8';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glowBlue" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${BLUE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowPink" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#D4537E" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#D4537E" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="#ffffff"/>
  <circle cx="80" cy="70" r="260" fill="url(#glowBlue)"/>
  <circle cx="1140" cy="580" r="280" fill="url(#glowPink)"/>

  <!-- Logo mark (scaled copy of the navbar SVG, 64x64 viewBox -> 150x150) -->
  <g transform="translate(525,66) scale(2.34375)">
    <rect x="4" y="4" width="56" height="56" rx="14" fill="${BLUE}"/>
    <rect x="16" y="16" width="18" height="18" rx="4" fill="#F4C0D1"/>
    <circle cx="42" cy="20" r="2.5" fill="#F4C0D1"/>
    <circle cx="48" cy="26" r="2" fill="#ED93B1"/>
    <circle cx="44" cy="34" r="1.5" fill="#D4537E"/>
    <circle cx="20" cy="42" r="2.5" fill="#F4C0D1"/>
    <circle cx="28" cy="46" r="2" fill="#ED93B1"/>
  </g>

  <text x="600" y="298" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="72" fill="${BLACK}"><tspan fill="${BLUE}">O</tspan>nline<tspan fill="${BLUE}">C</tspan>onver<tspan fill="${BLUE}">T</tspan>ools</text>

  <text x="600" y="358" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="31" fill="${GRAY}">${TOOL_COUNT} free online tools &#8212; convert, compress &amp; edit files</text>

  <line x1="500" y1="410" x2="700" y2="410" stroke="#e2e8f0" stroke-width="2"/>

  <text x="600" y="470" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="21" letter-spacing="3" fill="${LIGHT_GRAY}">PDF   IMAGE   VIDEO   AUDIO   GIF   TEXT   AI</text>

  <text x="600" y="570" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="22" fill="${LIGHT_GRAY}">onlineconvertools.com</text>
</svg>
`;

const outPath = path.join(__dirname, '..', 'public', 'og-image.png');

sharp(Buffer.from(svg))
  .png()
  .toFile(outPath)
  .then(() => {
    fs.writeFileSync(path.join(__dirname, 'og-image.count'), `${TOOL_COUNT}\n`);
    console.log('Wrote', outPath, 'with', TOOL_COUNT, 'tools');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

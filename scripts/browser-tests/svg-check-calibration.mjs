// Calibrates the SVG render check of image-compressor (page.jsx svgMaxPixelDiff) in real browsers:
// SVGO outputs must stay under SVG_MAX_PIXEL_DIFF, a copy with one shape deleted must go above it.
// Usage: node scripts/browser-tests/svg-check-calibration.mjs <dir with tux.svg, map.svg, ours-tux.svg>
import { chromium, firefox } from '@playwright/test';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/');
const { optimize } = require('svgo');
const dir = process.argv[2];
const pairs = [];
for (const f of ['tux.svg', 'map.svg']) { const s = fs.readFileSync(dir + '/' + f, 'utf8'); pairs.push([f + ' svgo', s, optimize(s, { multipass: true }).data]); pairs.push([f + ' svgo1', s, optimize(s).data]); }
const t = fs.readFileSync(dir + '/ours-tux.svg', 'utf8'); const ps = t.match(/<path[^>]*\/>/g);
for (const i of [44, 46, 33]) pairs.push(['tux minus path ' + i, t, t.replace(ps[i], '')]);
const src = fs.readFileSync('app/tools/image-tools/image-compressor/page.jsx', 'utf8');
const fn = src.slice(src.indexOf('const loadImg'), src.indexOf('// 78 = the setting'));
for (const eng of [chromium, firefox]) {
  const b = await eng.launch(); const p = await b.newPage(); await p.goto('about:blank');
  const res = await p.evaluate(async ([code, pairs]) => {
    const f = new Function(code.replace('async function svgMaxPixelDiff', 'return async function') );
    const g = f(); const out = [];
    for (const [n, a, c] of pairs) out.push(n + ': ' + await g(new Blob([a], { type: 'image/svg+xml' }), new Blob([c], { type: 'image/svg+xml' })));
    return out;
  }, [fn, pairs]);
  console.log(eng.name(), JSON.stringify(res)); await b.close();
  const limit = Number(src.match(/SVG_MAX_PIXEL_DIFF = (\d+)/)[1]);
  for (const r of res) { const v = Number(r.split(': ')[1]); const bad = /minus path (44|33)/.test(r) ? v < limit : !/minus/.test(r) && v >= limit; if (bad) { console.log('FAIL', eng.name(), r, 'limit', limit); process.exitCode = 1; } }
}

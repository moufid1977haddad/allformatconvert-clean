// P15 checks on a deployed site for defects H and I of the owner's iPhone pass (29/09):
//  H. sizes in decimal units, as Apple's Files: a 5 151 217-byte file shows "5.2 MB" (it showed "4.91 MB");
//  I. Image Upscaler's phrase: "Running on your device: your image is not uploaded." shipped in the page's code,
//     the obscure "made on your device" gone.
// Usage: node scripts/browser-tests/p15-units-upscaler-text.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };

const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'p15-h-')), 'IMG_5151217.mp4');
fs.writeFileSync(f, Buffer.alloc(5151217, 7));
const b = await engine.launch();
try {
  const p = await (await b.newContext()).newPage();
  await p.goto(`${origin}/tools/video-tools/video-rotator`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(f);
  const shown = await p.getByText(/IMG_5151217\.mp4 — /).innerText({ timeout: 15000 }).catch(() => '');
  check(`H. 5 151 217 bytes shown in decimal units: "${shown}"`, /5\.2 MB/.test(shown) && !/4\.91/.test(shown));

  const scripts = [];
  p.on('response', async (r) => { if (/\/_next\/static\/.*\.js/.test(r.url())) scripts.push(r.text().catch(() => '')); });
  await p.goto(`${origin}/tools/ai-tools/image-upscaler`, { waitUntil: 'networkidle' });
  const code = (await Promise.all(scripts)).join('\n') + (await p.content());
  check('I. Image Upscaler says "Running on your device: your image is not uploaded."', code.includes('Running on your device: your image is not uploaded.') && !/made on your device/i.test(code));
} finally {
  await b.close();
}
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);

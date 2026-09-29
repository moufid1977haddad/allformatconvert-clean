// HEIC to JPG / PNG (30/09): (1) a real HEIC in Chromium/Firefox, which cannot decode HEIC -> heic2any path; (2) the
// Safari path (the browser decodes the file itself) exercised with a photo the browser CAN decode under a .heic
// name -> encoded at full size by lib/imageOutput.js. Each download reopened with sharp.
// Usage: node scripts/browser-tests/heic-tools.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iosCanvasCapInit, applyIosCanvasCap, iosCapHits, iosCapLabel } from './lib/ios-canvas-cap.mjs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'heic-'));
const real = path.resolve('scripts/audit/fixtures/files/sample.heic');
const fake = path.join(dir, 'IMG_5000.heic');
fs.writeFileSync(fake, await sharp({ create: { width: 4032, height: 3024, channels: 3, background: '#3366cc' } }).jpeg().toBuffer());
const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function run(tool, file) {
  const ctx = await b.newContext({ acceptDownloads: true });
  await applyIosCanvasCap(ctx); // P16: the iPhone's canvas limit, always (lib/ios-canvas-cap.mjs)
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/image-tools/${tool}`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const link = p.locator('a[download]').filter({ hasText: /Download/ }).first();
  const ok = await link.waitFor({ timeout: 120000 }).then(() => true, () => false);
  if (!ok) { const t = await p.locator('body').innerText(); await ctx.close(); return { error: (t.match(/Error:[^\n]*/) || ['no result'])[0] }; }
  const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const out = path.join(dir, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(out);
  await ctx.close();
  return { out, name: d.suggestedFilename(), meta: await sharp(out).metadata() };
}
for (const [tool, fmt] of [['heic-to-jpg', 'jpeg'], ['heic-to-png', 'png']]) {
  if (engine !== webkit) {
    const r = await run(tool, real);
    check(`${tool}: real HEIC (heic2any path)`, !r.error && r.meta.format === fmt, r.error || `${r.meta.format} ${r.meta.width}x${r.meta.height} ${r.name}`);
  }
  const s = await run(tool, fake);
  check(`${tool}: file the browser decodes itself (Safari path), full size`, !s.error && s.meta.format === fmt && s.meta.width === 4032 && s.meta.height === 3024, s.error || `${s.meta.format} ${s.meta.width}x${s.meta.height} ${s.name}`);
}
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);

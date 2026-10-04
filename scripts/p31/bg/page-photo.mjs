// P31 (03/10) — the REAL page on one real photo, the service played with a mask computed locally by the production
// model (scripts/p31/bg/masks-photo.py → mask_isnet.png at the upload size). No paid call, nothing sent anywhere.
// Saves the page's PNG as <out>. Usage: node scripts/p31/bg/page-photo.mjs <origin> <photo> <mask.png> <out.png> [--browser=webkit]
import fs from 'node:fs';
import { chromium, webkit } from '@playwright/test';
import sharp from 'sharp';

const [origin, photo, maskFile, out] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const engine = process.argv.includes('--browser=webkit') ? webkit : chromium;
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.route('**/api/report-error**', (r) => { errors.push('reportToolError: ' + r.request().postData()); r.fulfill({ status: 200, body: '{}' }); });
await p.route('**/api/remove-bg', async (r) => {
  const { image } = JSON.parse(r.request().postData());
  const m = await sharp(Buffer.from(image, 'base64')).metadata();
  const mask = (await sharp(maskFile).resize(m.width, m.height, { fit: 'fill' }).grayscale().png().toBuffer()).toString('base64');
  await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mask }) });
});
await p.goto(origin + '/tools/ai-tools/background-remover', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').first().setInputFiles(photo);
const t0 = Date.now();
await p.getByRole('button', { name: /Remove Background/ }).click();
const dl = p.locator('a[data-download]').first();
await Promise.race([dl.waitFor({ timeout: 120000 }), p.locator('.text-red-400').first().waitFor({ timeout: 120000 })]);
if (!(await dl.count())) { console.log('NO RESULT:', await p.locator('.text-red-400').allInnerTexts(), errors); await b.close(); process.exit(1); }
const [d] = await Promise.all([p.waitForEvent('download'), dl.click()]);
fs.copyFileSync(await d.path(), out);
console.log(engine.name(), 'done in', ((Date.now() - t0) / 1000).toFixed(1), 's', errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no page error / no refinement failure reported');
await b.close();

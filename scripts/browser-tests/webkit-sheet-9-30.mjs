// Owner's Safari sheet, tests 9-30 (claude/tests-safari-proprietaire.md), the gestures that other suites do not replay
// as written, with the sheet's own files (docs/audit/fixtures-safari/). Made for Playwright's WebKit (NOT Safari),
// runs in any engine. Paid route (Background Remover) PLAYED BY THIS TEST: no call to the AI service.
//  9  QR Scanner: safari-qr.png uploaded, dropped on the page, pasted (clipboard event) → SAFARI-QR-OK-2026
// 11  Image Upscaler: a 12-Mpx photo refused before any work, with the "up to 6 megapixels" wording
// 16  GIF Maker: 3 photos (different shapes), "Fit (keep proportions, add background)" → an animated GIF of 3 frames
// 25  Background Remover (route played): full-resolution PNG, transparent background, opaque subject
// Usage: node scripts/browser-tests/webkit-sheet-9-30.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=webkit').slice(10);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const FX = path.resolve('docs/audit/fixtures-safari');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet930-'));
const photo = async (file, w, h, color) => { const p = path.join(tmp, file); await sharp({ create: { width: w, height: h, channels: 3, background: color } }).jpeg().toFile(p); return p; };
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
const open = async (url) => { const p = await ctx.newPage(); p.setDefaultTimeout(90000); await p.goto(origin + url, { waitUntil: 'networkidle' }); return p; };

// 9 — QR Scanner
{
  const p = await open('/tools/qr-barcodes-tools/qr-scanner');
  const read = () => p.waitForFunction(() => /SAFARI-QR-OK-2026/.test(document.body.innerText), null, { timeout: 30000 }).then(() => true, () => false);
  await p.locator('input[type=file]').first().setInputFiles(`${FX}/safari-qr.png`);
  check('9b upload safari-qr.png → SAFARI-QR-OK-2026', await read());
  const b64 = fs.readFileSync(`${FX}/safari-qr.png`).toString('base64');
  await p.reload({ waitUntil: 'networkidle' });
  await p.evaluate(async (b64) => {
    const f = new File([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], 'safari-qr.png', { type: 'image/png' });
    const dt = new DataTransfer(); dt.items.add(f);
    const zone = [...document.querySelectorAll('div')].find((d) => d.ondrop || d.getAttribute('class')?.includes('border-dashed')) || document.body;
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, b64);
  check('9d drop safari-qr.png on the page → same text', await read());
  await p.reload({ waitUntil: 'networkidle' });
  await p.evaluate(async (b64) => {
    const f = new File([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], 'image.png', { type: 'image/png' });
    const dt = new DataTransfer(); dt.items.add(f);
    const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
    window.dispatchEvent(ev);
  }, b64);
  check('9c paste the image (clipboard event) → same text', await read());
  await p.close();
}
// 11 — Image Upscaler: 12-Mpx photo refused, 6-Mpx wording (since 28/09)
{
  const p = await open('/tools/ai-tools/image-upscaler');
  await p.locator('input[type=file]').first().setInputFiles(await photo('photo12.jpg', 4032, 3024, '#7799bb'));
  const msg = await p.locator('text=/accepts images up to 6 megapixels/').first().innerText({ timeout: 15000 }).catch(() => '');
  check('11a 12-Mpx photo refused before any work: "up to 6 megapixels"', /4032×3024/.test(msg) && /12\.2 megapixels/.test(msg), msg.slice(0, 120));
  await p.close();
}
// 16 — GIF Maker: 3 photos of different shapes, Fit
{
  const p = await open('/tools/gif-tools/gif-maker');
  await p.locator('input[type=file]').first().setInputFiles([await photo('a.jpg', 1200, 800, '#cc3333'), await photo('b.jpg', 800, 1200, '#33cc33'), await photo('c.jpg', 1000, 1000, '#3333cc')]);
  await p.locator('#gm-fit').selectOption('fit');
  await p.getByRole('button', { name: /Create GIF/ }).click();
  const dl = p.locator('a[download="animated.gif"]');
  await dl.waitFor({ timeout: 120000 });
  const [d] = await Promise.all([p.waitForEvent('download'), dl.click()]);
  const meta = await sharp(fs.readFileSync(await d.path()), { animated: true }).metadata();
  check('16 GIF Maker, Fit: an animated GIF of 3 frames', meta.format === 'gif' && meta.pages === 3, `${meta.format} ${meta.width}×${meta.pageHeight} ${meta.pages} frames`);
  await p.close();
}
// 25 — Background Remover, route played: a mask (white ellipse on black, at the uploaded size) comes back
{
  const p = await open('/tools/ai-tools/background-remover');
  await p.route('**/api/remove-bg', async (r) => {
    const { image } = JSON.parse(r.request().postData());
    const m = await sharp(Buffer.from(image, 'base64')).metadata();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}"><rect width="100%" height="100%" fill="black"/><ellipse cx="50%" cy="50%" rx="30%" ry="30%" fill="white"/></svg>`;
    const mask = (await sharp(Buffer.from(svg)).grayscale().png().toBuffer()).toString('base64');
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mask }) });
  });
  await p.locator('input[type=file]').first().setInputFiles(await photo('subject.jpg', 4032, 3024, '#dd8844'));
  await p.getByRole('button', { name: /Remove Background/ }).click();
  const dl = p.locator('a[download="no-background.png"]');
  const ok = await dl.waitFor({ timeout: 120000 }).then(() => true, () => false);
  if (!ok) check('25 background remover (route played): a result', false, (await p.locator('.text-red-400').allInnerTexts()).join(' '));
  else {
    const [d] = await Promise.all([p.waitForEvent('download'), dl.click()]);
    const img = sharp(fs.readFileSync(await d.path()));
    const meta = await img.metadata();
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const alphaAt = (x, y) => data[(y * info.width + x) * 4 + 3];
    check('25 background remover (route played): PNG at full resolution, corners transparent, centre opaque', meta.width === 4032 && meta.height === 3024 && alphaAt(5, 5) === 0 && alphaAt(2016, 1512) === 255, `${meta.width}×${meta.height} corner α ${alphaAt(5, 5)} centre α ${alphaAt(2016, 1512)}`);
  }
  await p.close();
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${name})`);
process.exit(fails ? 1 : 0);

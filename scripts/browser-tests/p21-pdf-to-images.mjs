// P21 phase 3 (02/10): PDF to Image / PDF to JPG at the level of iLovePDF ("Page to JPG" / "Extract images", quality)
// and CloudConvert (DPI, page range). A real 3-page PDF (pdf-lib): page 1 text, page 2 an 800×600 JPEG photo, page 3
// text; checks every format's first bytes and size in pixels, the page range, 300 dpi, the extraction of the photo at
// its own resolution, and a clear message for a password-protected PDF.
// Usage: node scripts/browser-tests/p21-pdf-to-images.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[name];
const dir = path.join(os.tmpdir(), 'p21-pdf-images'); fs.mkdirSync(dir, { recursive: true });
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };

const pdfPath = path.join(dir, 'three-pages.pdf');
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const raw = Buffer.alloc(800 * 600 * 3); for (let i = 0; i < raw.length; i += 3) { raw[i] = (i / 3) % 800 / 3; raw[i + 1] = 120; raw[i + 2] = 200; }
  const jpg = await doc.embedJpg(await sharp(raw, { raw: { width: 800, height: 600, channels: 3 } }).jpeg({ quality: 90 }).toBuffer());
  for (let p = 1; p <= 3; p++) {
    const page = doc.addPage([612, 792]); // US Letter, 8.5 × 11 in
    page.drawText(`Page ${p}`, { x: 72, y: 700, size: 36, font });
    if (p === 2) page.drawImage(jpg, { x: 106, y: 200, width: 400, height: 300 });
  }
  fs.writeFileSync(pdfPath, await doc.save());
}
const lockedPath = path.join('scripts', 'converter-tests', 'fixtures', 'encrypted-user-password.pdf'); // opens only with its password

const MAGIC = { jpg: (b) => b[0] === 0xff && b[1] === 0xd8, png: (b) => b[1] === 0x50 && b[2] === 0x4e, webp: (b) => b.subarray(8, 12).toString() === 'WEBP', tiff: (b) => (b[0] === 0x49 && b[1] === 0x49) || (b[0] === 0x4d && b[1] === 0x4d), bmp: (b) => b[0] === 0x42 && b[1] === 0x4d };

const b = await engine.launch();
async function run(slug, opts) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${origin}/tools/pdf-tools/${slug}`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(opts.file || pdfPath);
  if (opts.mode) await p.getByLabel('Mode').selectOption(opts.mode);
  if (opts.format) await p.getByLabel('Format').selectOption(opts.format);
  if (opts.dpi) await p.getByLabel('Resolution').selectOption(String(opts.dpi));
  if (opts.range !== undefined) await p.getByLabel('Pages').fill(opts.range);
  await p.getByRole('button', { name: opts.mode === 'images' ? 'Extract images' : 'Convert pages' }).click();
  const done = await Promise.race([
    p.locator('[data-file-download]').first().waitFor({ timeout: 240000 }).then(() => 'rows'),
    p.locator('[data-p2i-message]').first().waitFor({ timeout: 240000 }).then(() => 'message'),
  ]).catch(() => 'timeout');
  await p.waitForTimeout(800);
  const rows = [];
  for (const r of await p.locator('[data-file-download]').elementHandles()) {
    rows.push(await r.evaluate(async (el) => {
      const a = el.querySelector('a[data-download]');
      const blob = await (await fetch(a.href)).blob();
      const b64 = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
      return { name: el.dataset.name, b64 };
    }));
  }
  const message = (await p.locator('[data-p2i-message]').allInnerTexts()).join(' ');
  await ctx.close();
  for (const r of rows) r.bytes = Buffer.from(r.b64, 'base64');
  return { done, rows, message, errors };
}
// sharp has no BMP reader: its header gives the size (BITMAPINFOHEADER, height negative when stored top-down)
const dims = async (bytes) => { if (MAGIC.bmp(bytes)) return [bytes.readInt32LE(18), Math.abs(bytes.readInt32LE(22))]; const m = await sharp(bytes).metadata(); return [m.width, m.height]; };

// PDF to JPG: pages 1 and 3, 150 dpi → 1275 × 1650
{
  const r = await run('pdf-to-jpg', { range: '1, 3' });
  const ok = r.rows.length === 2 && r.rows.every((x) => MAGIC.jpg(x.bytes)) && r.rows[0].name === 'three-pages-page-1.jpg' && r.rows[1].name === 'three-pages-page-3.jpg';
  const d = ok ? await dims(r.rows[0].bytes) : [];
  check('PDF to JPG: pages "1, 3" → 2 real JPGs named after the pages', ok, JSON.stringify(r.rows.map((x) => x.name)) + r.message);
  check('PDF to JPG: Normal = 150 dpi (Letter → 1275×1650)', d[0] === 1275 && d[1] === 1650, d.join('×'));
  check('PDF to JPG: no page error', !r.errors.length, r.errors.join(' | '));
}
// PDF to JPG: extract images → the 800×600 photo at its own resolution
{
  const r = await run('pdf-to-jpg', { mode: 'images' });
  const d = r.rows.length ? await dims(r.rows[0].bytes) : [];
  check('PDF to JPG: "Extract images" gives the embedded photo at its own 800×600', r.rows.length === 1 && d[0] === 800 && d[1] === 600 && MAGIC.jpg(r.rows[0].bytes), `${r.rows.length} rows ${d.join('×')} ${r.message}`);
}
// PDF to Image: every format, page 2, 300 dpi → 2550 × 3300
for (const f of ['png', 'jpg', 'webp', 'tiff', 'bmp']) {
  const r = await run('pdf-to-image', { format: f, dpi: 300, range: '2' });
  const ok = r.rows.length === 1 && MAGIC[f](r.rows[0].bytes) && r.rows[0].name === `three-pages-page-2.${f}`;
  const d = ok ? await dims(r.rows[0].bytes) : [];
  check(`PDF to Image: ${f.toUpperCase()} at 300 dpi, page 2 → a real ${f.toUpperCase()} of 2550×3300`, ok && d[0] === 2550 && d[1] === 3300, `${r.done} rows=${r.rows.map((x) => x.name)} ${d.join("x")} msg=${r.message} err=${r.errors.join("|")}`);
}
// Bad range, and a text-only page in extract mode: a sentence, no crash
{
  const r = await run('pdf-to-image', { range: '7' });
  check('PDF to Image: page 7 of a 3-page PDF → a clear message', /has 3 pages/.test(r.message) && !r.rows.length, r.message);
  const t = await run('pdf-to-image', { mode: 'images', range: '1' });
  check('PDF to Image: "Extract images" on a text-only page says there are no pictures', /No pictures were found/.test(t.message), t.message);
}
if (fs.existsSync(lockedPath)) {
  const r = await run('pdf-to-jpg', { file: lockedPath });
  check('PDF to JPG: a password-protected PDF → says to unlock it first', /password/i.test(r.message) && !r.rows.length, r.message);
} else console.log('SKIP no encrypted PDF fixture found');

await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);

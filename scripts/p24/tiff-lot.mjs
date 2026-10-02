// P24 (03/10): TIFF orientation and pages. A 2-page TIFF written here (baseline, uncompressed RGB): page 1 is 4×2 red
// with Orientation 6 (shown rotated 90° clockwise, so 2×4), page 2 is 3×3 blue. Before: page 1 came out lying down
// (4×2) and page 2 was never mentioned (TIFF to PNG) nor added (JPG to PDF / Image to PDF).
// Usage: node scripts/p24/tiff-lot.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { ok ? passes++ : fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };

function tiff(pages) { // pages: [{ w, h, rgb: [r,g,b], orientation }]
  const parts = []; let offset = 8;
  const header = Buffer.alloc(8); header.write('II', 0); header.writeUInt16LE(42, 2);
  const layout = pages.map((pg) => { const data = Buffer.alloc(pg.w * pg.h * 3); for (let i = 0; i < pg.w * pg.h; i++) data.set(pg.rgb, i * 3); return { pg, data }; });
  let pos = 8; const placed = [];
  for (const { pg, data } of layout) {
    const tags = [[256, 3, pg.w], [257, 3, pg.h], [258, 3, 8], [259, 3, 1], [262, 3, 2], [273, 4, 0], [274, 3, pg.orientation || 1], [277, 3, 3], [278, 3, pg.h], [279, 4, data.length]];
    const ifdSize = 2 + tags.length * 12 + 4;
    placed.push({ tags, data, ifdAt: pos, dataAt: pos + ifdSize + 8 /* bps array space */ });
    pos += ifdSize + 8 + data.length; if (pos % 2) pos++;
  }
  header.writeUInt32LE(placed[0].ifdAt, 4);
  const out = Buffer.alloc(pos); header.copy(out, 0);
  placed.forEach((p, k) => {
    let o = p.ifdAt; out.writeUInt16LE(p.tags.length, o); o += 2;
    for (const [tag, type, val] of p.tags) {
      out.writeUInt16LE(tag, o); out.writeUInt16LE(type, o + 2);
      if (tag === 258) { out.writeUInt32LE(3, o + 4); out.writeUInt32LE(p.dataAt - 8, o + 8); out.writeUInt16LE(8, p.dataAt - 8); out.writeUInt16LE(8, p.dataAt - 6); out.writeUInt16LE(8, p.dataAt - 4); }
      else { out.writeUInt32LE(1, o + 4); if (type === 3) out.writeUInt16LE(val, o + 8); else out.writeUInt32LE(tag === 273 ? p.dataAt : val, o + 8); }
      o += 12;
    }
    out.writeUInt32LE(k + 1 < placed.length ? placed[k + 1].ifdAt : 0, o);
    p.data.copy(out, p.dataAt);
  });
  return out;
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-tiff-'));
const file = path.join(dir, 'two-pages.tif');
fs.writeFileSync(file, tiff([{ w: 4, h: 2, rgb: [255, 0, 0], orientation: 6 }, { w: 3, h: 3, rgb: [0, 0, 255] }]));

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
const grab = async (p) => p.locator('a[download], [data-file-download] a').first().evaluate(async (a) => { const blob = await (await fetch(a.href)).blob(); return await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); }); }).then((s) => Buffer.from(s, 'base64'));
{
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/image-tools/tiff-to-png`, { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  await p.locator('[data-tiff-pages]').waitFor({ timeout: 30000 }).catch(() => {});
  const png1 = await grab(p); const m1 = await sharp(png1).metadata(); const s1 = await sharp(png1).stats();
  const note = await p.locator('[data-tiff-pages]').innerText().catch(() => '');
  await p.getByLabel('Page to convert').fill('2');
  const before = await p.locator('a[download]').first().getAttribute('href');
  await p.getByRole('button', { name: /Convert/ }).first().click();
  await p.waitForFunction((h) => document.querySelector('a[download]')?.getAttribute('href') !== h, before, { timeout: 30000 }).catch(() => {});
  const png2 = await grab(p); const s2 = await sharp(png2).stats();
  check('tiff-to-png: page 1 upright (Orientation 6 → 2×4) and red; "2 pages" said; page 2 converted on request (blue)', m1.width === 2 && m1.height === 4 && s1.channels[0].mean > 250 && s1.channels[2].mean < 5 && /2 pages/.test(note) && s2.channels[2].mean > 250 && s2.channels[0].mean < 5, `${m1.width}×${m1.height} | ${note.slice(0, 50)}`);
  await p.close();
}
{
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/jpg-to-pdf`, { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  await p.locator('a[download]').first().waitFor({ timeout: 60000 });
  const pdf = await PDFDocument.load(await grab(p));
  const sizes = pdf.getPages().map((pg) => `${Math.round(pg.getWidth())}×${Math.round(pg.getHeight())}`);
  check('jpg-to-pdf: the 2-page TIFF gives 2 PDF pages, the first upright (2×4)', sizes.join(',') === '2×4,3×3', sizes.join(','));
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exitCode = fails ? 1 : 0;

// P21 phase 3 (02/10): Image Converter takes Photoshop PSD, like iLoveIMG / CloudConvert / Convertio. A PSD written
// here with ag-psd (flattened image = known colours) converted to JPG by the real page: right size and colours; a PSD
// without its flattened image → a sentence saying how to save it. (A RAW folder can be given as 2nd argument for the
// day camera RAW is added — see the plan; not handled today.)
// Usage: node scripts/browser-tests/p21-psd.mjs <origin> [--browser=…] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import { writePsd } from 'ag-psd';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, rawDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[name];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p21-rawpsd-'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };

// PSD 400×300: left half red, right half blue (flattened image), one layer
const W = 400, H = 300, px = new Uint8ClampedArray(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; px[i] = x < W / 2 ? 220 : 20; px[i + 1] = 30; px[i + 2] = x < W / 2 ? 20 : 220; px[i + 3] = 255; }
const imageData = { width: W, height: H, data: px };
const psdPath = path.join(tmp, 'two-halves.psd');
fs.writeFileSync(psdPath, Buffer.from(writePsd({ width: W, height: H, imageData, children: [{ name: 'Layer 1', imageData }] }, { noBackground: true })));
const noCompositePath = path.join(tmp, 'no-composite.psd');
fs.writeFileSync(noCompositePath, Buffer.from(writePsd({ width: W, height: H, children: [{ name: 'Layer 1', imageData }] }, { noBackground: true })));

const raws = rawDir ? fs.readdirSync(rawDir).filter((f) => /\.(cr2|cr3|nef|arw|dng|raf|orf|rw2|pef|srw)$/i.test(f) && fs.statSync(path.join(rawDir, f)).size <= 100 * 1024 * 1024).map((f) => path.join(rawDir, f)) : [];
if (name === 'webkit') { console.log('SKIP webkit: Image Converter needs OffscreenCanvas in its worker, absent from the WebKit of Playwright (real Safari 16.4+ has it)'); process.exit(0); }
const b = await engine.launch();
async function convert(file) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${origin}/tools/image-tools/image-converter`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.getByLabel('Output format').selectOption('jpg');
  const t0 = Date.now();
  await p.getByRole('button', { name: /^Convert 1 file to JPG/ }).click();
  const r = await Promise.race([
    p.locator('[data-file-download]').first().waitFor({ timeout: 240000 }).then(() => 'ok'),
    p.getByText(/failed to convert/).first().waitFor({ timeout: 240000 }).then(() => 'error'),
  ]).catch(() => 'timeout');
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  let bytes = null, message = '';
  if (r === 'ok') {
    const b64 = await p.locator('[data-file-download] a[data-download]').first().evaluate(async (a) => {
      const blob = await (await fetch(a.href)).blob();
      return new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
    });
    bytes = Buffer.from(b64, 'base64');
  } else message = (await p.locator('body').innerText()).match(/failed to convert[\s\S]{0,400}/)?.[0] || '';
  await ctx.close();
  return { r, secs, bytes, message, errors };
}

for (const f of raws) {
  const out = await convert(f);
  if (out.r !== 'ok') { check(`${path.basename(f)} → JPG`, false, `${out.r} ${out.message} ${out.errors.join(' | ')}`); continue; }
  const img = sharp(out.bytes); const m = await img.metadata(); const st = await img.stats();
  const mean = st.channels.slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3, sd = st.channels.slice(0, 3).reduce((s, c) => s + c.stdev, 0) / 3;
  check(`${path.basename(f)} → JPG ${m.width}×${m.height}, mean ${mean.toFixed(0)}, spread ${sd.toFixed(0)} (${out.secs} s)`,
    m.format === 'jpeg' && Math.max(m.width, m.height) >= 3000 && mean > 25 && mean < 230 && sd > 15 && !out.errors.length, out.errors.join(' | '));
}
{
  const out = await convert(psdPath);
  let ok = false, info = `${out.r} ${out.message}`;
  if (out.r === 'ok') {
    const { data, info: inf } = await sharp(out.bytes).raw().toBuffer({ resolveWithObject: true });
    const at = (x, y) => [...data.subarray((y * inf.width + x) * 3, (y * inf.width + x) * 3 + 3)];
    const l = at(50, 150), r = at(350, 150);
    ok = inf.width === W && inf.height === H && l[0] > 180 && l[2] < 60 && r[2] > 180 && r[0] < 60;
    info = `${inf.width}×${inf.height} left ${l} right ${r}`;
  }
  check('PSD → JPG with the flattened image\'s exact colours and size', ok, info);
  const nc = await convert(noCompositePath);
  check('PSD without a flattened image → says how to save it', nc.r === 'error' && /Maximize compatibility/.test(nc.message), `${nc.r} ${nc.message}`);
}
{
  // SVG in (iLoveIMG takes it): drawn at its own size, colours kept
  const svgPath = path.join(tmp, 'drawing.svg');
  fs.writeFileSync(svgPath, '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="150" height="200" fill="#e01010"/><rect x="150" width="150" height="200" fill="#1010e0"/></svg>');
  const out = await convert(svgPath);
  let ok = false, info = `${out.r} ${out.message}`;
  if (out.r === 'ok') {
    const { data, info: inf } = await sharp(out.bytes).raw().toBuffer({ resolveWithObject: true });
    const at = (x, y) => [...data.subarray((y * inf.width + x) * 3, (y * inf.width + x) * 3 + 3)];
    ok = inf.width === 300 && inf.height === 200 && at(40, 100)[0] > 180 && at(260, 100)[2] > 180;
    info = `${inf.width}×${inf.height} ${at(40, 100)} ${at(260, 100)}`;
  }
  check('SVG → JPG at its own size, colours kept', ok, info);
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);

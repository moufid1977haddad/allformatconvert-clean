// P21 phase 1 (02/10) — the three defects seen on the owner's real iPhone, checked on the real pages.
//   1. JPG to PDF: the "Download" link is a blob: of the PDF retyped application/octet-stream with the download
//      attribute (P31, 03/10 — it was the /zipdl/f/ attachment until then), and touching it saves the PDF.
//   2. Background Remover: a white disc on blue-violet plastic, the service PLAYED with a mask a few pixels too wide
//      and soft (what IS-Net stretched from 1024 px gives): the edge of the cut-out must not keep the blue (background
//      share in the edge ring < 10 %; it is ~40 % without the P21 refinement), the centre stays the photo's own white,
//      corners transparent, full resolution, no canvas above 4.1 MP (iPhone canvas limit simulated). No paid call.
//   3. Image Converter: JPG → PNG larger than the original shows the percentage AND one line saying why.
// Usage: node scripts/browser-tests/p21-phase1.mjs <origin> [--browser=chromium|firefox|webkit] [--device=iphone]
//        [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyIosCanvasCap } from './lib/ios-canvas-cap.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const name = arg('browser') || 'chromium';
const device = arg('device') || '';
const engine = { chromium, firefox, webkit }[name];
const dir = path.join(os.tmpdir(), 'p21-phase1'); fs.mkdirSync(dir, { recursive: true });
let fails = 0, passes = 0;
const tag = `${name}${device ? ` [${device}]` : ''}`;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1';

const b = await engine.launch();
async function newPage() {
  const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, viewport: { width: 390, height: 844 } } : {}) });
  await applyIosCanvasCap(ctx);
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  await ctx.addInitScript(() => {
    window.__maxCanvas = 0;
    for (const k of ['width', 'height']) {
      const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, k);
      Object.defineProperty(HTMLCanvasElement.prototype, k, { ...d, set(v) { d.set.call(this, v); window.__maxCanvas = Math.max(window.__maxCanvas, this.width * this.height); } });
    }
  });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  return { ctx, p, errors };
}

// ---- 1. JPG to PDF on iPhone ---------------------------------------------------------------------------------
if (device === 'iphone') {
  const jpg = path.join(dir, 'portrait.jpg');
  if (!fs.existsSync(jpg)) await sharp({ create: { width: 3024, height: 4032, channels: 3, background: '#88aacc' } }).jpeg({ quality: 90 }).toFile(jpg);
  const { ctx, p, errors } = await newPage();
  const navs = []; p.on('request', (r) => { if (r.url().includes('/zipdl/')) navs.push(r.url()); });
  await p.goto(`${origin}/tools/pdf-tools/jpg-to-pdf`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.locator('input[type=file]').first().setInputFiles(jpg);
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  const link = p.locator('a[data-download]').first();
  await link.waitFor({ timeout: 60000 });
  // P31 (03/10): the P21 design (link to /zipdl/f/ served by the service worker) failed on the real iPhone (PDF opened,
  // M4R saved as .m4r.html). Now: a blob: of the file retyped application/octet-stream, download="portrait.pdf".
  await p.locator('a[data-download][data-retyped="1"]').first().waitFor({ timeout: 15000 }).catch(() => {});
  const href = await link.getAttribute('href');
  const info = await link.evaluate(async (a) => ({ download: a.getAttribute('download'), type: (await (await fetch(a.href)).blob()).type }));
  check('JPG to PDF: Download link is a blob: retyped application/octet-stream with download="portrait.pdf"', /^blob:/.test(href || '') && info.download === 'portrait.pdf' && info.type === 'application/octet-stream', `${href} ${JSON.stringify(info)}`);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null), link.click({ noWaitAfter: true })]);
  const buf = dl ? fs.readFileSync(await dl.path()) : Buffer.alloc(0);
  check('JPG to PDF: the tap saves portrait.pdf (a real PDF), no navigation to /zipdl/', !!dl && dl.suggestedFilename() === 'portrait.pdf' && buf.subarray(0, 5).toString() === '%PDF-' && navs.length === 0, `${dl && dl.suggestedFilename()} ${buf.length} bytes, ${navs.join(' ')}`);
  check('JPG to PDF: no page error', !errors.length, errors.join(' | '));
  await ctx.close();
}

// ---- 2. Background Remover edges --------------------------------------------------------------------------------
{
  const W = 3000, H = 2000, R = 600, cx = 1500, cy = 1000;
  const BG = [92, 78, 205], FG = [250, 250, 250];
  const photo = path.join(dir, 'disc-on-violet.jpg');
  if (!fs.existsSync(photo)) {
    const raw = Buffer.alloc(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy) - R; const a = Math.min(1, Math.max(0, 0.5 - d)); // 1-px anti-aliased edge
      const i = (y * W + x) * 3; for (let c = 0; c < 3; c++) raw[i + c] = Math.round(FG[c] * a + BG[c] * (1 - a));
    }
    await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 95 }).toFile(photo);
  }
  const { ctx, p, errors } = await newPage();
  await p.route('**/api/remove-bg', async (r) => {
    const { image } = JSON.parse(r.request().postData());
    const m = await sharp(Buffer.from(image, 'base64')).metadata();
    const k = m.width / W;
    // Too wide by 1.2 % of the radius and soft over ~3 px at the upload size — like IS-Net's mask stretched.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}"><rect width="100%" height="100%" fill="black"/><circle cx="${cx * k}" cy="${cy * k}" r="${R * k * 1.012}" fill="white"/></svg>`;
    const mask = (await sharp(Buffer.from(svg)).blur(1.2).grayscale().png().toBuffer()).toString('base64');
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mask }) });
  });
  await p.goto(`${origin}/tools/ai-tools/background-remover`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.locator('input[type=file]').first().setInputFiles(photo);
  await p.getByRole('button', { name: /Remove Background/ }).click();
  const row = p.locator('[data-file-download]').first();
  const ok = await row.waitFor({ timeout: 180000 }).then(() => true, () => false);
  if (!ok) check('Background Remover: a result', false, errors.join(' | '));
  else {
    const bytes = await row.evaluate(async (el) => {
      const a = el.querySelector('a[data-download]');
      const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
      const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await fetch(a.href);
      return Array.from(new Uint8Array(await res.arrayBuffer()));
    });
    const { data, info } = await sharp(Buffer.from(bytes)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => { const i = (y * info.width + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
    // background share of each pixel in the ring around the true edge, weighted by its opacity
    const d2 = BG.map((v, c) => v - FG[c]); const n2 = d2.reduce((s, v) => s + v * v, 0);
    let leak = 0, wsum = 0, opaqueOut = 0, ringN = 0;
    for (let t = 0; t < 3600; t++) {
      const ang = (t / 3600) * 2 * Math.PI;
      for (let dr = -3; dr <= 12; dr++) {
        const x = Math.round(cx + (R + dr) * Math.cos(ang)), y = Math.round(cy + (R + dr) * Math.sin(ang));
        const [r, g, bl, a] = px(x, y);
        const tt = Math.min(1, Math.max(0, ((r - FG[0]) * d2[0] + (g - FG[1]) * d2[1] + (bl - FG[2]) * d2[2]) / n2));
        leak += (a / 255) * tt; wsum += a / 255;
        if (dr >= 3) { ringN++; if (a > 128) opaqueOut++; }
      }
    }
    const leakPct = (leak / wsum) * 100, outPct = (opaqueOut / ringN) * 100;
    const centre = px(cx, cy), corner = px(5, 5);
    const maxCanvas = await p.evaluate(() => window.__maxCanvas);
    check(`Background Remover: edge keeps < 10 % of the background colour (${leakPct.toFixed(1)} %)`, leakPct < 10, `${leakPct.toFixed(1)} %`);
    check(`Background Remover: background just outside the subject is not kept opaque (${outPct.toFixed(1)} % of the ring)`, outPct < 10, `${outPct.toFixed(1)} %`);
    check('Background Remover: full resolution, centre = the photo\'s own white and opaque, corners transparent', info.width === W && info.height === H && centre[3] === 255 && centre.slice(0, 3).every((v) => v >= 240) && corner[3] === 0, `${info.width}x${info.height} centre ${centre} corner ${corner}`);
    check(`Background Remover: no canvas above 4.1 MP (${(maxCanvas / 1e6).toFixed(2)} MP)`, maxCanvas <= 4_100_000);
    check('Background Remover: no page error', !errors.length, errors.join(' | '));
  }
  await ctx.close();
}

// ---- 3. Image Converter "% larger" explained ----------------------------------------------------------------------
// Playwright's WebKit has no OffscreenCanvas: Image Converter runs for no format there (plan, bloquant 9).
if (name === 'webkit') console.log(`SKIP ${tag} Image Converter: no OffscreenCanvas in Playwright's WebKit`);
else {
  const jpg = path.join(dir, 'photo.jpg');
  if (!fs.existsSync(jpg)) {
    const w = 1200, h = 900, raw = Buffer.alloc(w * h * 3);
    for (let i = 0; i < raw.length; i++) raw[i] = (Math.sin(i * 0.013) * 60 + 128 + ((i * 7919) % 41)) | 0;
    await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 70 }).toFile(jpg);
  }
  const { ctx, p, errors } = await newPage();
  await p.goto(`${origin}/tools/image-tools/image-converter`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.locator('input[type=file]').first().setInputFiles(jpg);
  await p.getByLabel('Output format').selectOption('png');
  await p.getByRole('button', { name: /^Convert 1 file to PNG/ }).click();
  const row = p.locator('[data-file-download]').first();
  await row.waitFor({ timeout: 120000 });
  const note = await row.innerText();
  const why = await p.locator('[data-size-why]').first().innerText().catch(() => '');
  check('Image Converter: JPG → PNG shows "% larger"', /\d+% larger/.test(note), note.replace(/\s+/g, ' '));
  check('Image Converter: and one line saying why (PNG lossless) and what to choose', /lossless/.test(why) && /JPG, WebP or AVIF/.test(why), why);
  check('Image Converter: no page error', !errors.length, errors.join(' | '));
  await ctx.close();
}

await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${tag})` : `ALL PASS: ${passes} checks (${tag})`);
process.exit(fails ? 1 : 0);

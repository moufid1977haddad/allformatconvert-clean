// P22 (02/10): camera RAW files in Image Converter, on real files from raw.pixls.us (scripts/p22/raw-files.mjs).
//
// Reference: scripts/p22/raw-reference.json -- the pixels of our WebAssembly LibRaw in Node, themselves equal to
// LibRaw's own dcraw_emu 0.22.2 (official build; mean difference 0.0000 on every file). The wasm is deterministic, so
// every browser has to give exactly the same pixels (SHA-256 of the RGB bytes):
//   - Image Converter, RAW -> BMP (lossless, uncompressed: its pixels are hashed inside the page), through the real
//     page and its worker, with the iPhone canvas limit simulated (16.7 MP, page + workers: larger photos go through
//     the band path) -- Chromium and Firefox; RAW -> PNG too on a 5.5 MP file (canvas) and a 24 MP one (bands);
//     --device=iphone / --device=ipad: Safari user agent, touch, phone size limits;
//   - WebKit: Playwright's WebKit has no OffscreenCanvas in workers (real Safari 16.4+ has it), so the converter's
//     worker cannot run there; the deployed libraw.wasm and rawDecode.js are run in a Worker of the page instead.
// Plus: one RAW -> JPG; damaged / wrong files -> a clear sentence and no file (cut short ARW and CR3, a JPEG named
// .nef, an empty .dng, Sigma X3F).
// Usage: node scripts/browser-tests/p22-raw.mjs <origin> [--browser=chromium|firefox|webkit] [--device=iphone|ipad]
//        [--cache=<folder for the RAW files>] [--only=name,name] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { rawFile } from '../p22/raw-files.mjs';
import { applyIosCanvasCap, iosCapHits, iosCapLabel } from './lib/ios-canvas-cap.mjs';

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = arg('browser') || 'chromium';
const device = arg('device');
const only = arg('only').split(',').filter(Boolean);
const cache = arg('cache') || path.join(os.tmpdir(), 'p22-raw-files');
const root = path.resolve(import.meta.dirname, '../..');
const ref = JSON.parse(fs.readFileSync(path.join(root, 'scripts/p22/raw-reference.json'), 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p22-raw-'));
const label = `${name}${device ? '/' + device : ''}`;
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${label} ${n}`, info); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
};
const b = await { chromium, firefox, webkit }[name].launch();
async function newPage() {
  const ctx = await b.newContext({ acceptDownloads: true, ...(device ? { userAgent: UA[device], hasTouch: true, viewport: device === 'iphone' ? { width: 390, height: 844 } : { width: 820, height: 1180 } } : {}) });
  await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
  if (device) await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5, configurable: true }); });
  await applyIosCanvasCap(ctx);
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  return { ctx, p, errors };
}

// SHA-256 of the RGB pixels of a BMP result, computed in the page (a 46 MP BMP is 137 MB: not passed over).
async function bmpPixelsHash(p) {
  return p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
    // An iPhone / iPad link prepared for the tap (/zipdl/f/, P21) is served by the site's service worker from Cache
    // Storage (as download-guard reads it); elsewhere the link is the result's blob: URL.
    const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
    const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await fetch(a.href);
    const b = new Uint8Array(await res.arrayBuffer()), v = new DataView(b.buffer);
    if (b[0] !== 0x42 || b[1] !== 0x4d || v.getUint16(28, true) !== 24) return { error: 'not a 24-bit BMP' };
    const w = v.getInt32(18, true), h = v.getInt32(22, true), off = v.getUint32(10, true), row = Math.ceil((w * 3) / 4) * 4;
    const rgb = new Uint8Array(w * h * 3);
    for (let y = 0; y < h; y++) {
      const o = off + (h - 1 - y) * row;
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; rgb[i] = b[o + x * 3 + 2]; rgb[i + 1] = b[o + x * 3 + 1]; rgb[i + 2] = b[o + x * 3]; }
    }
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', rgb))].map((x) => x.toString(16).padStart(2, '0')).join('');
    return { width: w, height: h, hash };
  });
}

// Bytes of the first result, read in the page and passed over in slices.
async function resultBytes(p) {
  const n = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
    const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
    const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await fetch(a.href);
    window.__res = new Uint8Array(await res.arrayBuffer()); return window.__res.length;
  });
  const parts = [];
  for (let o = 0; o < n; o += 8e6) {
    parts.push(Buffer.from(await p.evaluate(([o]) => { let s = ''; const u = window.__res.subarray(o, o + 8e6); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); }, [o]), 'base64'));
  }
  return Buffer.concat(parts);
}

async function convert(file, format) {
  const { ctx, p, errors } = await newPage();
  await p.goto(`${origin}/tools/image-tools/image-converter`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.getByLabel('Output format').selectOption(format);
  const t0 = Date.now();
  await p.getByRole('button', { name: new RegExp(`^Convert 1 file to ${format.toUpperCase()}`) }).click();
  const r = await Promise.race([
    p.locator('[data-file-download]').first().waitFor({ timeout: 300000 }).then(() => 'ok'),
    p.getByText(/failed to convert/).first().waitFor({ timeout: 300000 }).then(() => 'error'),
  ]).catch(() => 'timeout');
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const text = await p.locator('body').innerText();
  // iPhone / iPad: the link is prepared for the tap (staged) shortly after the result shows (download-guard checks it)
  if (r === 'ok' && device) await p.locator('[data-file-download] [data-download][data-staged="1"]').first().waitFor({ timeout: 15000 }).catch(() => {});
  const out = { r, secs, errors, text, caps: await iosCapHits(p) };
  if (r === 'ok') { if (format === 'bmp') out.bmp = await bmpPixelsHash(p); else out.bytes = await resultBytes(p); }
  out.message = text.match(/failed to convert[\s\S]{0,400}/)?.[0] || '';
  await ctx.close();
  return out;
}

// WebKit: the deployed wasm + rawDecode.js in a module Worker of the page (as the converter's worker runs them).
async function decodeInWorker(p, file) {
  const glue = fs.readFileSync(path.join(root, 'app/lib/libraw/libraw.mjs'), 'utf8');
  const dec = fs.readFileSync(path.join(root, 'app/lib/rawDecode.js'), 'utf8')
    .replace("import { extOf } from './rawFormats';", "const extOf = (n) => (/\\.([a-z0-9]+)$/i.exec(n || '') || [])[1]?.toLowerCase() || '';")
    .replace("import('./libraw/libraw.mjs')", 'import(self.__glue)')
    .replace("fetch('/wasm/libraw.wasm')", `fetch(${JSON.stringify(origin + '/wasm/libraw.wasm')})`); // a blob: Worker has no base URL
  const bytes = fs.readFileSync(file).toString('base64');
  return p.evaluate(async ({ glue, dec, bytes, fname }) => {
    const glueUrl = URL.createObjectURL(new Blob([glue], { type: 'text/javascript' }));
    const src = `self.__glue = ${JSON.stringify(glueUrl)};\n${dec}\nself.onmessage = async (e) => { const t = Date.now(); try {
      const d = await decodeRaw(e.data.bytes, e.data.fname); const n = d.width * d.height, rgb = new Uint8Array(n * 3);
      for (let i = 0; i < n; i++) { rgb[i*3] = d.rgba[i*4]; rgb[i*3+1] = d.rgba[i*4+1]; rgb[i*3+2] = d.rgba[i*4+2]; }
      const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', rgb))].map((x) => x.toString(16).padStart(2, '0')).join('');
      self.postMessage({ ok: true, width: d.width, height: d.height, camera: d.camera, hash: h, secs: (Date.now() - t) / 1000 });
    } catch (err) { self.postMessage({ ok: false, message: String(err && err.message || err) }); } };`;
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })), { type: 'module' });
    const raw = Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0));
    const res = await new Promise((ok) => { w.onmessage = (e) => ok(e.data); w.onerror = (e) => ok({ ok: false, message: 'worker error ' + (e.message || '') }); w.postMessage({ bytes: raw, fname }, [raw.buffer]); });
    w.terminate();
    return res;
  }, { glue, dec, bytes, fname: path.basename(file) });
}

const webkitDirect = name === 'webkit';
const files = Object.entries(ref.files).filter(([n, e]) => !e.refused && (!only.length || only.some((o) => n.includes(o))));
const cut = (src, frac, as) => { const d = fs.readFileSync(src); const o = path.join(tmp, as); fs.writeFileSync(o, d.subarray(0, Math.floor(d.length * frac))); return o; };
let wp = null;
if (webkitDirect) { ({ p: wp } = await newPage()); await wp.goto(`${origin}/tools/image-tools/image-converter`, { waitUntil: 'load' }); }

for (const [fname, e] of files) {
  const f = await rawFile(e.rel, cache, e.sha256);
  if (webkitDirect) {
    const r = await decodeInWorker(wp, f);
    check(`${fname} decoded in a Worker: same pixels as the reference`, r.ok && r.width === e.width && r.height === e.height && r.hash === e.rgbSha256,
      r.ok ? `${r.width}×${r.height} ${r.camera} ${r.secs.toFixed(1)} s` : r.message);
    continue;
  }
  const path_ = e.width * e.height > 16777216 ? 'bands' : 'canvas';
  for (const fmt of ['bmp', ...(['5G4A9396.CR2', '_DSC0009.ARW'].includes(fname) ? ['png'] : [])]) {
    const out = await convert(f, fmt);
    if (out.r !== 'ok') { check(`${fname} → ${fmt.toUpperCase()}`, false, `${out.r} ${out.message} ${out.errors.join(' | ')}`); continue; }
    let got;
    if (fmt === 'bmp') got = out.bmp;
    else { const { data, info } = await sharp(out.bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true }); got = { width: info.width, height: info.height, hash: sha(data) }; }
    const same = got.width === e.width && got.height === e.height && got.hash === e.rgbSha256;
    check(`${fname} → ${fmt.toUpperCase()} ${got.width}×${got.height} (${(e.width * e.height / 1e6).toFixed(1)} MP, ${path_}): same pixels as the reference, note shown, no canvas over the iPhone limit`,
      same && /RAW developed/.test(out.text) && !out.caps.length && !out.errors.length, `${out.secs} s ${same ? '' : 'PIXELS DIFFER ' + (got.error || '')} ${out.caps.join(',')} ${out.errors.join(' | ')}`);
  }
}

// One RAW -> JPG (lossy: size and format, and colours close to the reference's mean)
if (!webkitDirect && (!only.length || only.includes('jpg'))) {
  const e = ref.files['_DSC0009.ARW'];
  const out = await convert(await rawFile(e.rel, cache, e.sha256), 'jpg');
  const m = out.bytes ? await sharp(out.bytes).metadata() : {};
  check('_DSC0009.ARW → JPG at full size', out.r === 'ok' && m.format === 'jpeg' && m.width === e.width && m.height === e.height, `${out.r} ${m.width}×${m.height} ${out.secs} s ${out.message}`);
}

// Damaged and wrong files: a sentence, never a file
{
  const arw = await rawFile(ref.files['_DSC0009.ARW'].rel, cache, ref.files['_DSC0009.ARW'].sha256);
  const cr3 = await rawFile(ref.files['Canon_EOS_R6_CRAW_ISO_100_nocrop_nodual.CR3'].rel, cache, ref.files['Canon_EOS_R6_CRAW_ISO_100_nocrop_nodual.CR3'].sha256);
  const x3f = await rawFile(ref.files['_SDI5651.X3F'].rel, cache, ref.files['_SDI5651.X3F'].sha256);
  const jpg = path.join(tmp, 'photo.nef'); fs.writeFileSync(jpg, await sharp({ create: { width: 64, height: 48, channels: 3, background: '#3366cc' } }).jpeg().toBuffer());
  const empty = path.join(tmp, 'empty.dng'); fs.writeFileSync(empty, Buffer.alloc(0));
  const cases = [
    [cut(arw, 0.99, 'cut.ARW'), /damaged or incomplete/],
    [cut(arw, 0.9999, 'cut-end.ARW'), /damaged or incomplete/],
    [cut(cr3, 0.99, 'cut.CR3'), /damaged or incomplete/],
    [jpg, /not a camera RAW file/],
    [empty, /damaged or incomplete/],
    [x3f, /Sigma X3F/],
  ];
  for (const [f, re] of cases) {
    if (webkitDirect) {
      const r = await decodeInWorker(wp, f);
      check(`${path.basename(f)} refused with a clear sentence (Worker)`, !r.ok && re.test(r.message), r.ok ? 'DECODED' : r.message);
      continue;
    }
    if (path.basename(f) === 'empty.dng') {
      // an empty file: refused, or not even listed (0 bytes); never a result
      const out = await convert(f, 'png').catch((err) => ({ r: 'not listed', message: err.message.slice(0, 80) }));
      check('empty.dng gives no result', out.r !== 'ok', `${out.r} ${out.message}`);
      continue;
    }
    const out = await convert(f, 'png');
    check(`${path.basename(f)} refused with a clear sentence, no file`, out.r === 'error' && re.test(out.message), `${out.r} ${out.message.replace(/\s+/g, ' ').slice(0, 200)}`);
  }
}
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${fails ? `${fails} FAIL, ${passes} pass` : `ALL PASS: ${passes} checks`} (${label}; ${webkitDirect ? 'deployed wasm in a page Worker' : iosCapLabel()})`);
process.exit(fails ? 1 : 0);

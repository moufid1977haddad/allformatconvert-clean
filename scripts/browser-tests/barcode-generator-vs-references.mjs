// Barcode Generator against its references, same codes, every file each site offers, all decoded by the same
// independent reader (zxing-cpp; SVG drawn by the browser, PDF by pdf.js, EPS by Ghostscript):
//   ours            this page (defaults: 0.33 mm module, 300 dpi);
//   barcode-maker   https://barcode-maker.com (PNG, JPG, GIF, SVG; bulk to ZIP);
//   barqode         https://barqode.io (SVG, EPS, PNG, PDF, JPG).
// Per file: does it read back exactly; what physical size it declares (PNG pHYs, JPG JFIF, SVG width/height, PDF
// MediaBox); for EAN-13, the module width that size gives when printed at 100 % (GS1: 0.264-0.66 mm), whether the
// raster bars are whole pixels, and whether it still reads when a 300-dot printer prints it at that size.
// Then bad input (wrong check digits, lower case, non-ASCII) and, with --batch, 1000 EAN-13 in one ZIP.
// Usage: node scripts/browser-tests/barcode-generator-vs-references.mjs <our origin> [--browser=firefox]
//        [--sites=ours,bm,bq] [--only=ean13,qrcode] [--batch] [--out=dir]
import { chromium, firefox } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import UPNG from 'upng-js';
import { readBarcodes } from 'zxing-wasm/reader';
import { createCanvas, Path2D, DOMMatrix, ImageData } from '@napi-rs/canvas';
Object.assign(globalThis, { Path2D, DOMMatrix, ImageData });
import { authorize } from './vercel-preview-auth.mjs';

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const SITES = (arg('sites') || 'ours,bm,bq').split(',');
const only = arg('only').split(',').filter(Boolean);
const out = arg('out') || fs.mkdtempSync(path.join(os.tmpdir(), 'bcvs-'));
fs.mkdirSync(out, { recursive: true });
const GS = ['C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe'].find((p) => fs.existsSync(p));

// value typed, text a reader must return, the page on each reference (null: the type is not offered there),
// [value typed on the references when they refuse ours]
const CODES = [
  ['ean13', '5901234123457', '5901234123457', 'Ean13', 'ean-13-barcode-generator'],
  ['upca', '036000291452', '0036000291452', 'Upc', 'upc-a-barcode-generator'],
  ['ean8', '96385074', '96385074', 'Ean8', 'ean-8-barcode-generator'],
  ['upce', '01234565', '0012345000065', 'UpcE', null],
  ['isbn', '978-1-56581-231-4', '9781565812314', 'Isbn', 'isbn-barcode-generator', '9781565812314'], // barqode offers nothing for the hyphenated form
  ['code128', 'ABC-12345', 'ABC-12345', 'Code128', 'code-128-barcode-generator'],
  ['gs1-128', '(01)09501101530003(17)261231(10)ABC123', '(01)09501101530003(17)261231(10)ABC123', 'gs1-128', null],
  ['code39', 'CODE-39 TEST', 'CODE-39 TEST', 'Code39', 'code-39-barcode-generator'],
  ['itf14', '15400141288763', '15400141288763', 'Itf14', 'itf-14-barcode-generator'],
  ['interleaved2of5', '12345678', '12345678', 'Itf', null],
  ['rationalizedCodabar', 'A40156B', 'A40156B', 'Codabar', null],
  ['databaromni', '(01)09501101530003', '(01)09501101530003', 'Databaromni', null],
  ['databarexpanded', '(01)09501101530003(3103)000123', '(01)09501101530003(3103)000123', 'Databarexpanded', null],
  ['qrcode', 'https://www.onlineconvertools.com', 'https://www.onlineconvertools.com', 'Qrcode', 'qr-code-generator'],
  ['datamatrix', 'Data Matrix 123', 'Data Matrix 123', 'Datamatrix', 'data-matrix-code-generator'],
  ['pdf417', 'PDF417 sample text', 'PDF417 sample text', 'Pdf417', 'pdf417-barcode-generator'],
  ['azteccode', 'Aztec Code 123', 'Aztec Code 123', 'Azteccode', null],
];
// bad input: [our type, value, what a correct tool does]
const BAD = [
  ['ean13', '5901234123458', 'refuse (wrong check digit)'],
  ['ean13', '590123412345', 'add check digit -> 5901234123457'],
  ['upca', '036000291453', 'refuse (wrong check digit)'],
  ['itf14', '15400141288764', 'refuse (wrong check digit)'],
  ['code39', 'abc-12', 'refuse or read back exactly'],
  ['code128', 'café', 'refuse or read back exactly'],
];

/* ---------- readers ---------- */
async function zx(bytes) { const r = await readBarcodes(new Uint8Array(bytes), { tryHarder: true, tryRotate: true, maxNumberOfSymbols: 1 }); return r[0]?.text ?? null; }
function gsRender(file, dpi) { const o = `${file}.${dpi}.png`; execFileSync(GS, ['-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=png16m', `-r${dpi}`, '-dEPSCrop', `-sOutputFile=${o}`, file], { stdio: 'pipe' }); return fs.readFileSync(o); }
let pdfjs = null;
async function pdfInfo(bytes) {
  pdfjs ??= await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false }).promise;
  const page = await doc.getPage(1); const vp = page.getViewport({ scale: 4 });
  const c = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height)); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: x, viewport: vp, canvas: c }).promise;
  return { png: c.toBuffer('image/png'), wMm: ((page.view[2] - page.view[0]) * 25.4) / 72, hMm: ((page.view[3] - page.view[1]) * 25.4) / 72, pages: doc.numPages };
}
function rgbaOf(pngBytes) { const i = UPNG.decode(pngBytes.buffer.slice(pngBytes.byteOffset, pngBytes.byteOffset + pngBytes.length)); return { w: i.width, h: i.height, rgba: new Uint8Array(UPNG.toRGBA8(i)[0]) }; }
// the row with the most dark/light changes, as run lengths; EAN-13 has 95 modules between its outer guard bars
function bestRow({ w, h, rgba }) {
  let best = null;
  for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 60))) {
    const dark = (x) => { const i = (y * w + x) * 4; return rgba[i + 3] > 127 && rgba[i] + rgba[i + 1] + rgba[i + 2] < 384; };
    const runs = []; let cur = null, n = 0, first = -1, last = -1;
    for (let x = 0; x < w; x++) { const d = dark(x); if (d) { if (first < 0) first = x; last = x; } if (d === cur) n++; else { if (cur !== null) runs.push([cur, n]); cur = d; n = 1; } }
    runs.push([cur, n]);
    while (runs.length && !runs[0][0]) runs.shift(); while (runs.length && !runs.at(-1)[0]) runs.pop();
    if (!best || runs.length > best.runs.length) best = { runs, extent: last - first + 1 };
  }
  return best;
}
function greyShare({ rgba }) { let g = 0, n = 0; for (let i = 0; i < rgba.length; i += 4) { if (rgba[i + 3] < 128) continue; n++; const v = (rgba[i] + rgba[i + 1] + rgba[i + 2]) / 3; if (v > 40 && v < 215) g++; } return n ? g / n : 0; }
const pngDpi = (u8) => { const i = Buffer.from(u8).indexOf('pHYs'); if (i < 0) return null; const dv = new DataView(u8.buffer, u8.byteOffset + i + 4); return u8[i + 12] === 1 ? Math.round(dv.getUint32(0) * 0.0254) : null; };
const jpgDpi = (u8) => (u8[2] === 0xff && u8[3] === 0xe0 && u8[13] === 1 ? (u8[14] << 8) | u8[15] : u8[13] === 2 ? Math.round(((u8[14] << 8) | u8[15]) * 2.54) : null);
function svgSize(svg) { // declared size in mm, or null
  const tag = svg.match(/<svg\b[^>]*>/)[0]; const a = (n) => (tag.match(new RegExp(`\\s${n}="([^"]+)"`)) || [])[1];
  const mm = (v) => { if (!v || v.endsWith('%')) return null; const n = parseFloat(v); if (v.endsWith('mm')) return n; if (v.endsWith('cm')) return n * 10; if (v.endsWith('in')) return n * 25.4; if (v.endsWith('pt')) return (n * 25.4) / 72; return (n * 25.4) / 96; };
  return { w: mm(a('width')), h: mm(a('height')), vb: a('viewBox') };
}

let page;
async function svgToPng(bytes) { // the browser's own SVG renderer, ~2000 px wide
  const b64 = Buffer.from(bytes).toString('base64');
  const url = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/svg+xml;base64,' + b64; await img.decode();
    let w = img.naturalWidth || 300, h = img.naturalHeight || 150;
    if (!img.naturalWidth) { const vb = atob(b64).match(/viewBox="([^"]+)"/); if (vb) { const [, , vw, vh] = vb[1].split(/[\s,]+/).map(Number); w = vw; h = vh; } }
    const k = 2000 / w; const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }, b64);
  return Buffer.from(url.split(',')[1], 'base64');
}
async function toPng(bytes) { // JPG/GIF -> PNG through the browser, for pixel measurements
  const url = await page.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/x;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i, 0, 0); return c.toDataURL('image/png'); }, Buffer.from(bytes).toString('base64'));
  return Buffer.from(url.split(',')[1], 'base64');
}
// a 300-dot printer printing a raster at its declared size: nearest-neighbour resample
function printRaster300(png, dpi) {
  const s = rgbaOf(png); const k = 300 / dpi; const W = Math.max(1, Math.round(s.w * k)), H = Math.max(1, Math.round(s.h * k));
  const o = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = Math.min(s.w - 1, Math.floor(x / k)), sy = Math.min(s.h - 1, Math.floor(y / k)); o.set(s.rgba.subarray((sy * s.w + sx) * 4, (sy * s.w + sx) * 4 + 4), (y * W + x) * 4); }
  return Buffer.from(UPNG.encode([o.buffer], W, H, 0));
}

/* ---------- analysis of one downloaded file ---------- */
async function analyse(bcid, fmt, file, want) {
  const bytes = fs.readFileSync(file); const r = { fmt, bytes: bytes.length };
  // what the file really is (barcode-maker's "JPG" and "GIF" were PNG files on 26/09/2026)
  const magic = bytes.subarray(0, 4).toString('hex');
  r.realType = magic === '89504e47' ? 'png' : magic.startsWith('ffd8') ? 'jpg' : magic === '47494638' ? 'gif' : magic === '25504446' ? 'pdf' : magic === '25215053' ? 'eps' : bytes.toString('latin1', 0, 200).includes('<svg') ? 'svg' : magic;
  let img; // PNG bytes of the drawing
  if (fmt === 'svg') { const s = svgSize(bytes.toString()); r.declared = s.w ? `${s.w.toFixed(1)} x ${s.h?.toFixed(1)} mm` : 'none'; r.wMm = s.w; img = await svgToPng(bytes); }
  else if (fmt === 'pdf') { const p = await pdfInfo(bytes); r.declared = `${p.wMm.toFixed(1)} x ${p.hMm.toFixed(1)} mm page`; r.pageMm = p.wMm; img = p.png; if (GS) r.gs = await zx(gsRender(file, 600)); }
  else if (fmt === 'eps') { img = GS ? gsRender(file, 600) : null; const bb = bytes.toString('latin1').match(/%%HiResBoundingBox:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/) || bytes.toString('latin1').match(/%%BoundingBox:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/); if (bb) { r.wMm = ((bb[3] - bb[1]) * 25.4) / 72; r.declared = `${r.wMm.toFixed(1)} mm wide`; } }
  else { img = fmt === 'png' ? bytes : await toPng(bytes); r.dpi = fmt === 'png' ? pngDpi(bytes) : fmt === 'jpg' ? jpgDpi(bytes) : null; const d = rgbaOf(img); r.px = `${d.w}x${d.h}`; r.declared = r.dpi ? `${r.dpi} dpi` : 'no dpi'; r.grey = +(greyShare(d) * 100).toFixed(1); }
  r.read = img ? await zx(fmt === 'png' || fmt === 'jpg' || fmt === 'gif' ? bytes : img) : 'not read';
  r.ok = r.read === want && (r.gs === undefined || r.gs === want) && r.realType === fmt;
  if (bcid === 'ean13' && img) { // module width and bar regularity
    const d = rgbaOf(img); const row = bestRow(d); const modPx = row.extent / 95;
    if (['png', 'jpg', 'gif'].includes(fmt)) {
      r.pxPerModule = +modPx.toFixed(2);
      r.barError = +Math.max(...row.runs.map(([, n]) => Math.abs(n / modPx - Math.round(n / modPx)))).toFixed(2); // in modules
      const dpi = r.dpi || 96; r.moduleMm = +((modPx * 25.4) / dpi).toFixed(3); r.moduleBasis = r.dpi ? 'its dpi' : 'no dpi: 96 assumed';
      r.print300 = await zx(printRaster300(img, dpi));
    } else {
      const totalMm = fmt === 'pdf' ? r.pageMm : r.wMm;
      if (totalMm) { r.moduleMm = +((totalMm * row.extent) / d.w / 95).toFixed(3); r.moduleBasis = fmt === 'pdf' ? 'page size' : 'declared size'; }
      else r.moduleBasis = 'no size declared';
      if (GS && (fmt === 'pdf' || fmt === 'eps')) r.print300 = await zx(gsRender(file, 300));
    }
  }
  return r;
}

/* ---------- drivers ---------- */
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
await authorize(ctx, origin);
page = await ctx.newPage(); await page.goto('about:blank');
const save = async (d, site, bcid, fmt) => { const f = path.join(out, `${site}-${bcid}-${fmt}${path.extname(d.suggestedFilename()) || '.' + fmt}`); await d.saveAs(f); return f; };
const visibleError = (p) => p.evaluate(() => [...document.querySelectorAll('[role=alert], [class*=error], [class*=red-], [class*=destructive], [aria-invalid=true] ~ *')].filter((e) => e.offsetParent !== null && e.innerText.trim() && !e.id?.includes('announcer')).map((e) => e.innerText.trim()).join(' | ').slice(0, 200));

const ours = {
  page: null,
  formats: ['png', 'jpg', 'gif', 'svg', 'pdf', 'eps'],
  async open() { this.page ??= await ctx.newPage(); await this.page.goto(origin + '/tools/qr-barcodes-tools/barcode-generator', { waitUntil: 'networkidle' }); },
  async make(bcid, value) {
    const p = this.page; await p.locator('#bc-type').selectOption(bcid); await p.locator('#bc-text').fill(value);
    await p.getByRole('button', { name: 'Generate Barcode' }).click();
    await p.waitForFunction(() => !/Creating/.test(document.body.innerText) && (document.querySelector('[data-status]') || document.querySelector('[role=alert]:not(#__next-route-announcer__)')?.textContent.trim()), null, { timeout: 30000 });
    const err = await p.evaluate(() => document.querySelector('[role=alert]:not(#__next-route-announcer__)')?.textContent.trim() || '');
    return { error: err };
  },
  async download(bcid, fmt) { const [d] = await Promise.all([this.page.waitForEvent('download', { timeout: 15000 }), this.page.locator(`a[data-format="${fmt}"]`).click()]); return save(d, 'ours', bcid, fmt); },
};
const bm = {
  page: null,
  formats: ['png', 'jpg', 'gif', 'svg'],
  async open(type) { this.page ??= await ctx.newPage(); await this.page.goto('https://barcode-maker.com/' + type, { waitUntil: 'domcontentloaded', timeout: 60000 }); await this.page.locator('textarea#input').waitFor(); await this.page.waitForTimeout(2000); },
  async make(bcid, value) { const p = this.page; await p.locator('textarea#input').fill(value); await p.waitForTimeout(1500); return { error: await visibleError(p) }; },
  async download(bcid, fmt) {
    const p = this.page;
    await p.locator('button').filter({ hasText: /^\s*(PNG|JPG|GIF|SVG)\s*$/ }).last().click();
    await p.getByRole('menuitem', { name: fmt.toUpperCase(), exact: true }).or(p.getByRole('option', { name: fmt.toUpperCase(), exact: true })).first().click();
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.locator('button').filter({ hasText: 'Download' }).first().click()]);
    return save(d, 'bm', bcid, fmt);
  },
};
const bq = {
  page: null,
  formats: ['png', 'jpg', 'svg', 'pdf', 'eps'],
  async open(slug) { this.page ??= await ctx.newPage(); await this.page.goto('https://barqode.io/' + slug, { waitUntil: 'networkidle' }); },
  async make(bcid, value) { const p = this.page; await p.locator('#barcode-value').fill(value); await p.waitForTimeout(1500); return { error: await visibleError(p) }; },
  async download(bcid, fmt) { const p = this.page; const [d] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.locator('button').filter({ hasText: new RegExp(`^\\s*${fmt.toUpperCase()}\\s*$`) }).first().click()]); return save(d, 'bq', bcid, fmt); },
};
const drivers = { ours, bm, bq };
const where = (site, c) => (site === 'ours' ? 'x' : site === 'bm' ? c[3] : c[4]);

/* ---------- 1. same codes, every file ---------- */
const results = [];
for (const c of CODES) {
  const [bcid, ourValue, want] = c;
  if (only.length && !only.includes(bcid)) continue;
  for (const site of SITES) {
    const loc = where(site, c); if (!loc) { results.push({ site, bcid, offered: false }); continue; }
    const dr = drivers[site];
    try {
      const value = site !== 'ours' && c[5] ? c[5] : ourValue;
      await dr.open(loc); const m = await dr.make(bcid, value);
      if (m.error && site === 'ours') { results.push({ site, bcid, error: m.error }); continue; }
      for (const fmt of dr.formats) {
        try { const f = await dr.download(bcid, fmt); const r = await analyse(bcid, fmt, f, want); results.push({ site, bcid, ...r }); console.log(site, bcid, JSON.stringify(r)); }
        catch (e) { results.push({ site, bcid, fmt, fail: e.message.split('\n')[0] }); console.log(site, bcid, fmt, 'FAIL', e.message.split('\n')[0]); }
      }
    } catch (e) { results.push({ site, bcid, fail: e.message.split('\n')[0] }); console.log(site, bcid, 'FAIL', e.message.split('\n')[0]); }
  }
}
/* ---------- 2. bad input ---------- */
const bad = [];
if (!only.length) for (const [bcid, value, expect] of BAD) {
  const c = CODES.find((x) => x[0] === bcid);
  for (const site of SITES) {
    const loc = where(site, c); if (!loc) continue; const dr = drivers[site];
    try {
      await dr.open(loc); const m = await dr.make(bcid, value);
      let read = null, fileMade = false;
      if (!(site === 'ours' && m.error)) { try { const f = await dr.download(bcid, 'png'); fileMade = true; read = await zx(fs.readFileSync(f)); } catch { /* nothing offered */ } }
      bad.push({ site, bcid, value, expect, error: m.error || '', fileMade, read }); console.log('BAD', site, bcid, value, JSON.stringify({ error: m.error, fileMade, read }));
    } catch (e) { bad.push({ site, bcid, value, fail: e.message.split('\n')[0] }); }
  }
}
/* ---------- 3. batch: 1000 EAN-13 in one ZIP ---------- */
const batch = [];
if (process.argv.includes('--batch')) {
  const gtin = (d) => { let s = 0; for (let i = d.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) s += Number(d[i]) * w; return d + ((10 - (s % 10)) % 10); };
  const values = Array.from({ length: 1000 }, (_, i) => gtin(String(400638133000 + i * 7)));
  const run = async (site, action) => {
    const p = drivers[site].page; const dl = p.waitForEvent('download', { timeout: 900000 });
    const t0 = Date.now(); await action(p); const d = await dl; const secs = (Date.now() - t0) / 1000;
    const f = await save(d, site, 'batch1000', 'zip'); const zip = await JSZip.loadAsync(fs.readFileSync(f));
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir && /\.(png|svg|jpg|gif)$/i.test(n));
    let ok = 0; const seen = new Set();
    for (const n of names) { const u8 = await zip.files[n].async('uint8array'); const t = await zx(n.endsWith('.svg') ? await svgToPng(u8) : u8); if (t && values.includes(t)) { ok++; seen.add(t); } }
    const r = { site, files: names.length, readRight: ok, distinct: seen.size, secs, zipBytes: fs.statSync(f).size }; batch.push(r); console.log('BATCH', JSON.stringify(r));
  };
  if (SITES.includes('ours')) { await ours.open(); await ours.page.locator('#bc-type').selectOption('ean13'); await run('ours', async (p) => { await p.getByRole('radio', { name: 'Many (ZIP)' }).click(); await p.getByLabel('A list (one value per line)').check(); await p.locator('#bc-lines').fill(values.join('\n')); await p.locator('#bc-batch-format').selectOption('png'); await p.getByRole('button', { name: 'Generate all as ZIP' }).click(); }); }
  if (SITES.includes('bm')) { await bm.open('Ean13'); await run('bm', async (p) => { await p.locator('textarea#input').fill(values.join('\n'));await p.locator('button').filter({ hasText: /^\s*(PNG|JPG|GIF|SVG)\s*$/ }).last().click(); await p.getByRole('menuitem', { name: 'PNG', exact: true }).or(p.getByRole('option', { name: 'PNG', exact: true })).first().click(); await p.locator('button').filter({ hasText: 'Download' }).first().click(); }); }
}
fs.writeFileSync(path.join(out, `results-${engine.name()}.json`), JSON.stringify({ results, bad, batch }, null, 1));
console.log('saved', path.join(out, `results-${engine.name()}.json`));
await b.close();

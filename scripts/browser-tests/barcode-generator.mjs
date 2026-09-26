// Barcode Generator, real page, every type, every file it offers -- each file decoded by a reader independent of the
// page's engine (bwip-js):
//   PNG, JPG, GIF   zxing-cpp (zxing-wasm, in Node);
//   SVG             drawn by the browser's own SVG renderer, then zxing-cpp;
//   PDF             drawn by pdf.js AND by Ghostscript, then zxing-cpp; page size checked against the module width;
//   EPS             drawn by Ghostscript, then zxing-cpp;
//   MSI, Pharmacode, Code 11 (no zxing reader): decoded here from the PNG's bars, by this file's own decoders.
// Expected texts are written out below, from the standards' own examples where there is one (GS1 5901234123457,
// UPC 036000291452, ISBN 978-1-56581-231-4, ISSN 0311-175X, ITF-14 1540014128876...), never computed by the page.
// Also: check digits added/refused, contrast refused, dpi written in PNG/JPG, pixels per module, exact mm in vector
// files, rotation, transparency, batch from a list (with bad lines) and from a numbered series.
// Usage: node scripts/browser-tests/barcode-generator.mjs <origin> [--browser=firefox] [--only=code128,ean13]
import { chromium, firefox } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import UPNG from 'upng-js';
import { readBarcodes } from 'zxing-wasm/reader';
import { createCanvas, Path2D, DOMMatrix, ImageData } from '@napi-rs/canvas';
// pdf.js draws with the canvas's own Path2D/DOMMatrix: give it @napi-rs/canvas's
Object.assign(globalThis, { Path2D, DOMMatrix, ImageData });
import { authorize } from './vercel-preview-auth.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(args[0]).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-'));
const GS = ['C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe'].find((p) => fs.existsSync(p));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

// What an independent reader must return for each type's example (zxing-cpp's text; UPC-A/E as zxing reports them).
const CASES = {
  code128: ['ABC-12345', 'ABC-12345'], 'gs1-128': ['(01)09501101530003(17)261231(10)ABC123', '(01)09501101530003(17)261231(10)ABC123'],
  code39: ['CODE-39 TEST', 'CODE-39 TEST'], code39ext: ['Code 39 ext', 'Code 39 ext'], code93: ['CODE93', 'CODE93'],
  code32: ['01234567', 'A012345676'], rationalizedCodabar: ['A40156B', 'A40156B'], interleaved2of5: ['12345678', '12345678'],
  itf14: ['1540014128876', '15400141288763'], telepen: ['Telepen 1', 'Telepen 1'], pzn: ['1234562', '-12345626'],
  ean13: ['590123412345', '5901234123457'], ean8: ['9638507', '96385074'], upca: ['03600029145', '0036000291452'], upce: ['0123456', '0012345000065'],
  isbn: ['978-1-56581-231-4', '9781565812314'], ismn: ['979-0-2605-3211-3', '9790260532113'], issn: ['0311-175X', '9770311175001'],
  databaromni: ['(01)09501101530003', '(01)09501101530003'], databarstacked: ['(01)09501101530003', '(01)09501101530003'],
  databarstackedomni: ['(01)09501101530003', '(01)09501101530003'], databarlimited: ['(01)09501101530003', '(01)09501101530003'],
  databarexpanded: ['(01)09501101530003(3103)000123', '(01)09501101530003(3103)000123'],
  databarexpandedstacked: ['(01)09501101530003(3103)000123(15)261231', '(01)09501101530003(3103)000123(15)261231'],
  qrcode: ['https://www.onlineconvertools.com', 'https://www.onlineconvertools.com'], microqrcode: ['12345', '12345'],
  datamatrix: ['Data Matrix 123', 'Data Matrix 123'], gs1datamatrix: ['(01)09501101530003(17)261231(10)ABC123', '(01)09501101530003(17)261231(10)ABC123'],
  pdf417: ['PDF417 sample text', 'PDF417 sample text'], micropdf417: ['MicroPDF', 'MicroPDF'], azteccode: ['Aztec Code 123', 'Aztec Code 123'],
  maxicode: ['MaxiCode test', 'MaxiCode test'],
  // no zxing reader: this file's decoders. MSI default scheme Mod 10: 1234567 -> check 4 (Luhn); Code 11: C check.
  msi: ['1234567', '12345674'], pharmacode: ['1234', '1234'], code11: ['0123-4567', null],
  // add-ons alone (no zxing reader either): GS1's own example price 51299; EAN-2 issue 05. Parity checked too.
  ean5: ['51299', '51299'], ean2: ['05', '05'],
};

/* ---------- independent readers ---------- */
async function zxAddon(bytes) { const r = await readBarcodes(new Uint8Array(bytes), { tryHarder: true, eanAddOnSymbol: 'Require', maxNumberOfSymbols: 1 }); return r[0]?.text ?? null; }
async function zx(bytes) { const r = await readBarcodes(new Uint8Array(bytes), { tryHarder: true, tryRotate: true, maxNumberOfSymbols: 1 }); return r[0]?.text ?? null; }
function pngRgba(bytes) { const img = UPNG.decode(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length)); return { w: img.width, h: img.height, rgba: new Uint8Array(UPNG.toRGBA8(img)[0]) }; }
function gsRender(file, dpi = 600) { // 600: a common laser printer (300 is tested separately, with whole-dot modules)
  const out = file + '.gs.png';
  execFileSync(GS, ['-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=png16m', `-r${dpi}`, '-dEPSCrop', '-dBackgroundColor=16#FFFFFF', `-sOutputFile=${out}`, file], { stdio: 'pipe' });
  return fs.readFileSync(out);
}
let pdfjs = null;
async function pdfjsRender(bytes, scale = 4) {
  pdfjs ??= await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false }).promise;
  const page = await doc.getPage(1); const vp = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height)); const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
  return { png: canvas.toBuffer('image/png'), mediaBox: page.view };
}
// The bars of the middle row as run lengths (dark/light), quiet zones trimmed.
function runs({ w, h, rgba }, row = Math.floor(h * 0.3)) {
  const dark = (x) => { const i = (row * w + x) * 4; return rgba[i + 3] > 127 && rgba[i] + rgba[i + 1] + rgba[i + 2] < 384; };
  const out = []; let cur = null, n = 0;
  for (let x = 0; x < w; x++) { const d = dark(x); if (d === cur) n++; else { if (cur !== null) out.push([cur, n]); cur = d; n = 1; } }
  out.push([cur, n]);
  while (out.length && !out[0][0]) out.shift(); while (out.length && !out.at(-1)[0]) out.pop();
  return out;
}
const narrowWide = (rs) => { const min = Math.min(...rs.map((r) => r[1])); return rs.map(([d, n]) => [d, n > min * 1.5 ? 1 : 0]); };
function decodeMsi(img) { // start bar-wide space-narrow; digit = 4 bits, 1 = wide bar + narrow space, 0 = narrow bar + wide space; stop = narrow bar, wide space, narrow bar
  const rs = narrowWide(runs(img)); const el = rs.slice(2, rs.length - 3); let bits = '';
  for (let i = 0; i < el.length; i += 2) bits += el[i][1] ? '1' : '0';
  let s = ''; for (let i = 0; i < bits.length; i += 4) s += parseInt(bits.slice(i, i + 4), 2);
  return s;
}
function decodePharmacode(img) { let v = 0; for (const [d, wide] of narrowWide(runs(img))) if (d) v = v * 2 + (wide ? 2 : 1); return String(v); }
function decodeCode11(img) {
  const T = { '00001': '0', '10001': '1', '01001': '2', '11000': '3', '00101': '4', '10100': '5', '01100': '6', '00011': '7', '10010': '8', '10000': '9', '00100': '-', '00110': '*' };
  const rs = narrowWide(runs(img)); let s = '';
  for (let i = 0; i + 5 <= rs.length; i += 6) s += T[rs.slice(i, i + 5).map((r) => r[1]).join('')] ?? '?';
  return s;
}
const code11Checks = (v) => { const val = (c) => (c === '-' ? 10 : Number(c)); const ck = (s, max) => { let sum = 0; [...s].reverse().forEach((c, i) => { sum += val(c) * ((i % max) + 1); }); const r = sum % 11; return r === 10 ? '-' : String(r); }; const c = ck(v, 10); return v.length >= 10 ? c + ck(v + c, 9) : c; };
// EAN-5 / EAN-2: start 1011, 7-module digits (L or G codes) separated by 01; the L/G pattern must match the
// checksum (EAN-5: 3 x odd + 9 x even positions, mod 10; EAN-2: value mod 4), per GS1 General Specifications.
// The module is the symbol's width over its module count (EAN-5: 47, EAN-2: 20), not the narrowest run, which
// anti-aliased renders (browser SVG, pdf.js) blur.
function decodeEanAddon(img) {
  const rs = runs(img, Math.floor(img.h * 0.75)); const total = rs.reduce((s, r) => s + r[1], 0);
  const tries = [47, 20].map((n) => decodeAddonBits(rs, total / n));
  return tries.find((t) => /^\d+$/.test(t)) ?? tries.join(' / ');
}
function decodeAddonBits(rs, m) {
  let bits = ''; for (const [d, n] of rs) bits += (d ? '1' : '0').repeat(Math.max(1, Math.round(n / m)));
  if (!bits.startsWith('1011')) return 'no start';
  const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
  let i = 4, digits = '', par = '';
  while (i + 7 <= bits.length) {
    const c = bits.slice(i, i + 7); let d = L.indexOf(c), p = 'L'; if (d < 0) { d = G.indexOf(c); p = 'G'; } if (d < 0) return 'bad ' + c;
    digits += d; par += p; i += 7; if (bits.slice(i, i + 2) === '01') i += 2; else break;
  }
  const P5 = ['GGLLL', 'GLGLL', 'GLLGL', 'GLLLG', 'LGGLL', 'LLGGL', 'LLLGG', 'LGLGL', 'LGLLG', 'LLGLG'];
  if (digits.length === 5) { const ck = (3 * (+digits[0] + +digits[2] + +digits[4]) + 9 * (+digits[1] + +digits[3])) % 10; return par === P5[ck] ? digits : 'parity ' + par; }
  if (digits.length === 2) return par === ['LL', 'LG', 'GL', 'GG'][Number(digits) % 4] ? digits : 'parity ' + par;
  return 'length ' + digits;
}
const ownDecoder = { msi: decodeMsi, pharmacode: decodePharmacode, code11: decodeCode11, ean5: decodeEanAddon, ean2: decodeEanAddon };

/* ---------- page ---------- */
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await authorize(ctx, origin);
const page = await ctx.newPage();
await page.goto(origin + '/tools/qr-barcodes-tools/barcode-generator', { waitUntil: 'networkidle' });

// Wait for the state after an action, read in one DOM snapshot, only once the page changed since the action.
async function armed(action, timeout = 60000) {
  await page.evaluate(() => { window.__changed = false; window.__mo?.disconnect(); window.__mo = new MutationObserver(() => { window.__changed = true; }); window.__mo.observe(document.querySelector('h1').parentElement, { subtree: true, childList: true, characterData: true, attributes: true }); });
  await action();
  const h = await page.waitForFunction(() => {
    if (!window.__changed) return null;
    if ([...document.querySelectorAll('button')].some((x) => /Creating and checking/.test(x.textContent))) return null;
    const al = document.querySelector('[role=alert]:not(#__next-route-announcer__)');
    if (al && al.textContent.trim()) return { error: al.textContent.trim() };
    const st = document.querySelector('[data-status]');
    if (st && st.textContent.trim()) return { status: st.textContent.trim() };
    return null;
  }, null, { timeout, polling: 50 });
  return h.jsonValue();
}
async function setUi(opts) {
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  for (const [id, v] of Object.entries(opts)) {
    const el = page.locator(`#${id}`);
    const type = await el.evaluate((e) => (e.tagName === 'SELECT' ? 'select' : e.type));
    if (type === 'select') await el.selectOption(String(v)); else if (type === 'checkbox') await el.setChecked(!!v); else if (type === 'color') await el.evaluate((e, val) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(e, val); e.dispatchEvent(new Event('input', { bubbles: true })); }, v); else await el.fill(String(v));
  }
}
async function generate(bcid, value, opts = {}) {
  await page.locator('#bc-type').selectOption(bcid);
  await setUi(opts);
  await page.locator('#bc-text').fill(value);
  return armed(() => page.getByRole('button', { name: 'Generate Barcode' }).click());
}
async function download(fmt) {
  const [d] = await Promise.all([page.waitForEvent('download'), page.locator(`a[data-format="${fmt}"]`).click()]);
  const f = path.join(tmp, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(f); return { file: f, bytes: fs.readFileSync(f), name: d.suggestedFilename() };
}
async function svgToPng(svgBytes, pxPerMm = 12) { // the browser's own SVG renderer
  const b64 = Buffer.from(svgBytes).toString('base64');
  const dataUrl = await page.evaluate(async ({ b64, pxPerMm }) => {
    const svg = atob(b64); const mm = (a) => Number((svg.match(new RegExp(`${a}="([\\d.]+)mm"`)) || [])[1]);
    const img = new Image(); img.src = 'data:image/svg+xml;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = Math.round(mm('width') * pxPerMm); c.height = Math.round(mm('height') * pxPerMm);
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }, { b64, pxPerMm });
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}
const pngPhysDpi = (u8) => { const i = Buffer.from(u8).indexOf('pHYs'); if (i < 0) return null; const dv = new DataView(u8.buffer, u8.byteOffset + i + 4); return u8[i + 12] === 1 ? Math.round(dv.getUint32(0) * 0.0254) : null; };
const jpgDpi = (u8) => (u8[2] === 0xff && u8[3] === 0xe0 && u8[13] === 1 ? (u8[14] << 8) | u8[15] : null);

/* ---------- 1. every type, every file ---------- */
const FMT = ['png', 'jpg', 'gif', 'svg', 'pdf', 'eps'];
for (const [bcid, [value, want]] of Object.entries(CASES)) {
  if (only.length && !only.includes(bcid)) continue;
  const r = await generate(bcid, value);
  if (!r.status) { check(`${bcid}: generated`, false, JSON.stringify(r)); continue; }
  const got = {};
  for (const fmt of FMT) {
    const d = await download(fmt);
    let img;
    if (fmt === 'svg') img = await svgToPng(d.bytes);
    else if (fmt === 'pdf') { const p = await pdfjsRender(d.bytes); img = p.png; got['pdf(gs)'] = GS ? (ownDecoder[bcid] ? ownDecoder[bcid](pngRgba(gsRender(d.file, 1200))) : await zx(gsRender(d.file))) : 'no gs'; }
    else if (fmt === 'eps') img = GS ? gsRender(d.file, ownDecoder[bcid] ? 1200 : 600) : null; // bars of whole pixels for this file's own decoders
    else img = d.bytes;
    if (!img) { got[fmt] = 'not checked'; continue; }
    if (ownDecoder[bcid]) {
      const png = ['jpg', 'gif'].includes(fmt) ? await page.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/x;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i, 0, 0); return c.toDataURL('image/png'); }, Buffer.from(img).toString('base64')).then((u) => Buffer.from(u.split(',')[1], 'base64')) : img;
      got[fmt] = ownDecoder[bcid](pngRgba(new Uint8Array(png)));
    } else got[fmt] = await zx(img);
  }
  const expect = want ?? `*${value}*`; // Code 11 without its optional check digit (tested with it below)
  const bad = Object.entries(got).filter(([, v]) => v !== expect);
  check(`${bcid}: ${FMT.join('/').toUpperCase()} + PDF by Ghostscript all read "${expect}"`, bad.length === 0, bad.length ? JSON.stringify(got) : r.status.slice(0, 90));
}
if (only.length) { console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); await b.close(); process.exit(fails ? 1 : 0); }

/* ---------- 2. check digits, bad input, contrast ---------- */
{
  let c11 = await generate('code11', '0123-4567', { 'bc-check': true });
  const c11png = (await download('png')).bytes;
  check('Code 11 with its check digit: C computed per the standard', c11.status && decodeCode11(pngRgba(c11png)) === `*0123-4567${code11Checks('0123-4567')}*`, `${decodeCode11(pngRgba(c11png))} (want C = ${code11Checks('0123-4567')})`);
  c11 = await generate('code11', '0123456789-1', { 'bc-check': true });
  const c11b = decodeCode11(pngRgba((await download('png')).bytes));
  check('Code 11 over 10 characters: C and K', c11b === `*0123456789-1${code11Checks('0123456789-1')}*`, `${c11b} (want ${code11Checks('0123456789-1')})`);
  await setUi({ 'bc-check': false });
}
{
  let r = await generate('ean13', '5901234123458');
  check('EAN-13 with a wrong check digit: refused, says why', /check digit/i.test(r.error || ''), JSON.stringify(r));
  r = await generate('ean13', '59012341234A');
  check('EAN-13 with a letter: refused', !!r.error, JSON.stringify(r));
  r = await generate('code128', 'CONTRAST', { 'bc-bar-color': '#FFFFFF', 'bc-bg-color': '#000000' });
  check('light bars on dark: refused', /darker than the background/.test(r.error || ''), JSON.stringify(r));
  r = await generate('code128', 'CONTRAST', { 'bc-bar-color': '#777777', 'bc-bg-color': '#8A8A8A' });
  check('low contrast: refused', /too close/.test(r.error || ''), JSON.stringify(r));
  r = await generate('code128', 'NAVY', { 'bc-bar-color': '#1A237E', 'bc-bg-color': '#FFF8E1' });
  const png = (await download('png')).bytes;
  check('coloured bars on a tinted background: scans', r.status && (await zx(png)) === 'NAVY', JSON.stringify(r));
  await setUi({ 'bc-bar-color': '#000000', 'bc-bg-color': '#FFFFFF' });
}
/* ---------- 3. physical size ---------- */
{
  await setUi({ 'bc-unit': 'mm', 'bc-module': '0.33', 'bc-dpi': '600', 'bc-height': '15', 'bc-quiet': '10' });
  const r = await generate('code128', 'SIZE-600');
  const png = (await download('png')).bytes; const jpg = (await download('jpg')).bytes;
  const img = pngRgba(png); const narrow = Math.min(...runs(img).map((x) => x[1]));
  check('600 dpi written in the PNG and the JPG', pngPhysDpi(png) === 600 && jpgDpi(jpg) === 600, `PNG ${pngPhysDpi(png)} · JPG ${jpgDpi(jpg)} · ${r.status?.slice(0, 40)}`);
  check('0.33 mm at 600 dpi = 8 px per module (round(7.8))', narrow === 8, `narrowest bar ${narrow} px`);
  const pdf = await pdfjsRender((await download('pdf')).bytes, 1);
  const modules = (pdf.mediaBox[2] * 25.4) / 72 / 0.33;
  // Code 128 "SIZE-600": start + 8 symbols + check + stop = 11 x 11 + 2 modules, plus 2 x 10 quiet
  check('PDF width = exactly (11 x 11 + 2 + 20) modules of 0.33 mm', Math.abs(modules - 143) < 0.01, `${modules.toFixed(4)} modules, ${((pdf.mediaBox[2] * 25.4) / 72).toFixed(3)} mm`);
  const svg = Buffer.from((await download('svg')).bytes).toString();
  const svgW = Number(svg.match(/width="([\d.]+)mm"/)[1]);
  check('SVG width in mm = the same 143 modules', Math.abs(svgW - 143 * 0.33) < 0.001, `${svgW} mm`);
  const barsMm = (pdf.mediaBox[3] * 25.4) / 72;
  check('bar height ~15 mm plus the value underneath (PDF)', barsMm > 15 && barsMm < 22, `${barsMm.toFixed(2)} mm tall`);
  await setUi({ 'bc-dpi': '300', 'bc-quiet': '' });
}
/* ---------- 3b. a 300-dot printer: whole-dot modules ---------- */
{
  await setUi({ 'bc-unit': 'mm', 'bc-module': '0.33', 'bc-dpi': '300' });
  await page.locator('#bc-type').selectOption('databarexpanded');
  const snap = page.locator('#bc-snap');
  const offered = await snap.isVisible();
  const at033 = await generate('databarexpanded', '(01)09501101530003(3103)000123');
  let d = await download('pdf'); const before = await zx(gsRender(d.file, 300));
  if (offered) await snap.click();
  const moduleNow = await page.locator('#bc-module').inputValue();
  await generate('databarexpanded', '(01)09501101530003(3103)000123');
  d = await download('pdf'); const after = await zx(gsRender(d.file, 300));
  check('300 dpi printer: 0.33 mm offered as 0.339 mm (4 dots); DataBar Expanded then prints readable at 300 dpi', offered && moduleNow === '0.3387' && after === '(01)09501101530003(3103)000123', `0.33 mm at 300 dots: ${before ?? 'not readable'} · after "${moduleNow}": ${after ?? 'not readable'} · ${at033.status?.slice(0, 30)}`);
  await setUi({ 'bc-module': '0.33' });
}
/* ---------- 4. rotation, transparency ---------- */
{
  await setUi({ 'bc-rotate': 'R' });
  await generate('code128', 'ROTATED');
  const rot = (await download('png')).bytes; const img = pngRgba(rot);
  check('rotated 90°: taller than wide, still scans', img.h > img.w && (await zx(rot)) === 'ROTATED', `${img.w}x${img.h}`);
  await setUi({ 'bc-rotate': 'N', 'bc-transparent': true });
  await generate('code128', 'CLEAR');
  const t = pngRgba((await download('png')).bytes); const jpg = (await download('jpg')).bytes;
  const transparent = t.rgba.some((v, i) => i % 4 === 3 && v === 0);
  check('transparent background: PNG has transparent pixels, JPG is on white, both scan', transparent && (await zx(jpg)) === 'CLEAR', `transparent=${transparent}`);
  await setUi({ 'bc-transparent': false });
}
/* ---------- 5. batch ---------- */
async function batch(action) {
  await page.getByRole('radio', { name: /^Many/  }).click();
  const dl = page.waitForEvent('download', { timeout: 600000 });
  const t0 = Date.now(); await action(); const d = await dl; const secs = (Date.now() - t0) / 1000;
  const zip = await JSZip.loadAsync(fs.readFileSync(await d.path()));
  const files = {}; for (const [n, f] of Object.entries(zip.files)) if (!f.dir) files[n] = await f.async('uint8array');
  return { files, secs, name: d.suggestedFilename() };
}
{
  await page.locator('#bc-type').selectOption('ean13');
  const good = Array.from({ length: 30 }, (_, i) => String(400638133393 + i * 7).padStart(12, '0').slice(0, 12));
  const lines = [...good.slice(0, 15), 'NOT-A-NUMBER', ...good.slice(15), '123'];
  const z = await batch(async () => { await page.getByLabel('A list (one value per line)').check(); await page.locator('#bc-lines').fill(lines.join('\n')); await page.locator('#bc-batch-format').selectOption('png'); await page.getByRole('button', { name: 'Generate all as ZIP' }).click(); });
  const pngs = Object.keys(z.files).filter((n) => n.endsWith('.png')).sort();
  let ok = 0; for (const [i, n] of pngs.entries()) { const want = good[i] + (() => { const d = good[i]; let s = 0; for (let k = 11, w = 3; k >= 0; k--, w = w === 3 ? 1 : 3) s += Number(d[k]) * w; return String((10 - (s % 10)) % 10); })(); if ((await zx(z.files[n])) === want) ok++; }
  const errs = z.files['errors.txt'] ? Buffer.from(z.files['errors.txt']).toString().trim().split('\n') : [];
  check('batch from a list: 30 EAN-13 in the ZIP, each scans with its check digit; 2 bad lines in errors.txt', pngs.length === 30 && ok === 30 && errs.length === 2 && /line 16/.test(errs[0]) && /line 32/.test(errs[1]), `${pngs.length} PNG, ${ok} read right, errors: ${errs.join(' | ')} · ${z.secs.toFixed(1)} s`);
}
{
  await page.locator('#bc-type').selectOption('code128');
  const z = await batch(async () => {
    await page.getByLabel('A numbered series').check();
    for (const [k, v] of Object.entries({ prefix: 'SKU-', start: '7', count: '25', step: '3', pad: '5', suffix: '' })) await page.locator(`#bc-seq-${k}`).fill(v);
    await page.locator('#bc-batch-format').selectOption('svg'); await page.getByRole('button', { name: 'Generate all as ZIP' }).click();
  });
  const names = Object.keys(z.files).sort();
  const reads = []; for (const n of [names[0], names[12], names.at(-1)]) reads.push(await zx(await svgToPng(z.files[n])));
  check('numbered series: 25 SVG named in order, SKU-00007 … SKU-00079, first/middle/last scan', names.length === 25 && names[0] === '01-SKU-00007.svg' && names.at(-1) === '25-SKU-00079.svg' && reads.join() === 'SKU-00007,SKU-00043,SKU-00079', `${names[0]} … ${names.at(-1)} · read ${reads.join(', ')}`);
}
/* ---------- 5b. add-ons, own text under the bars, CSV import ---------- */
{
  await page.getByRole('radio', { name: 'One barcode' }).click();
  await setUi({ 'bc-unit': 'mm', 'bc-module': '0.33', 'bc-dpi': '300', 'bc-quiet': '', 'bc-rotate': 'N', 'bc-transparent': false });
  // [type, typed, what zxing-cpp must read with the add-on required] -- ISBN price 51299 (GS1/ISBN agency example),
  // UPC-A 036000291452 + EAN-2 12, ISSN 0311-175X variant 00 issue 05.
  for (const [bcid, value, want] of [['isbn', '978-1-56581-231-4 51299', '978156581231451299'], ['upca', '03600029145 12', '003600029145212'], ['issn', '0311-175X 00 05', '977031117500105']]) {
    const r = await generate(bcid, value);
    const png = (await download('png')).bytes; const pdf = await download('pdf');
    const got = [await zxAddon(png), GS ? await zxAddon(gsRender(pdf.file, 600)) : 'no gs'];
    check(bcid + ' with add-on "' + value + '": scanned back with it, PNG and PDF read ' + want, r.status && got.every((g) => g === want), JSON.stringify(got) + ' · ' + (r.status || r.error).slice(0, 80));
  }
}
{
  await setUi({ 'bc-show-text': true });
  await generate('code128', 'CAP-1');
  const plain = Buffer.from((await download('svg')).bytes).toString();
  await setUi({ 'bc-caption': 'Blue T-shirt M' });
  const r = await generate('code128', 'CAP-1');
  const svg = (await download('svg')).bytes; const png = (await download('png')).bytes;
  fs.writeFileSync(path.join(os.tmpdir(), 'bc-caption-check.png'), png);
  check('own text under the bars: drawing changes, still reads CAP-1 (PNG and SVG)', r.status && Buffer.from(svg).toString() !== plain && (await zx(png)) === 'CAP-1' && (await zx(await svgToPng(svg))) === 'CAP-1', (r.status || r.error).slice(0, 80) + ' · PNG kept at ' + path.join(os.tmpdir(), 'bc-caption-check.png'));
  await setUi({ 'bc-caption': '' });
}
{
  const csv = path.join(tmp, 'items.csv');
  fs.writeFileSync(csv, 'sku;name\r\n"590123412345";"Mug ""XL"", blue"\r\n400638133393;Tea\r\n\r\n');
  await page.getByRole('radio', { name: /^Many/ }).click();
  await page.locator('#bc-type').selectOption('ean13');
  await page.locator('#bc-csv').setInputFiles(csv);
  const lines = await page.locator('#bc-lines').inputValue();
  check('CSV import (semicolons, quotes, CRLF): value and text per line, tab-separated', lines === 'sku\tname\n590123412345\tMug "XL", blue\n400638133393\tTea', JSON.stringify(lines));
  await page.locator('#bc-lines').fill(lines.split('\n').slice(1).join('\n'));
  await page.locator('#bc-batch-format').selectOption('png');
  const [d] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Generate all as ZIP' }).click()]);
  const zip = await JSZip.loadAsync(fs.readFileSync(await d.path()));
  const names = Object.keys(zip.files).sort(); const reads = []; for (const n of names) reads.push(await zx(await zip.files[n].async('uint8array')));
  check('imported list -> ZIP: 2 codes named by value (not by text), each reads', names.join() === '1-590123412345.png,2-400638133393.png' && reads.join() === '5901234123457,4006381333931', names.join(', ') + ' · ' + reads.join(', '));
}

/* ---------- 6. label sheets (PDF) ---------- */
// Geometry written here from Avery's templates, not taken from the page: L7160 = A4, 63.5 x 38.1 mm, 3 x 7,
// top 15.15 mm, left 7.25 mm, 2.5 mm between columns.
function gsPages(file, dpi) {
  const o = `${file}-p%03d.png`;
  execFileSync(GS, ['-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=png16m', `-r${dpi}`, `-sOutputFile=${o}`, file], { stdio: 'pipe' });
  const pages = []; for (let i = 1; fs.existsSync(o.replace('%03d', String(i).padStart(3, '0'))); i++) pages.push(pngRgba(new Uint8Array(fs.readFileSync(o.replace('%03d', String(i).padStart(3, '0'))))));
  return pages;
}
function crop(img, xMm, yMm, wMm, hMm, dpi) {
  const k = dpi / 25.4; const x0 = Math.round(xMm * k), y0 = Math.round(yMm * k), w = Math.round(wMm * k), h = Math.round(hMm * k);
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) out.set(img.rgba.subarray(((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x0 + w) * 4), y * w * 4);
  return { w, h, rgba: out, png: new Uint8Array(UPNG.encode([out.buffer], w, h, 0)) };
}
async function labelsRun(setup) {
  await page.getByRole('radio', { name: /^Many/ }).click();
  await page.locator('#bc-batch-format').selectOption('labels');
  await setup();
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.getByRole('button', { name: 'Generate label sheets (PDF)' }).click()]);
  const f = path.join(tmp, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(f);
  await page.locator('[data-status]').waitFor();
  return { file: f, status: await page.locator('[data-status]').innerText() };
}
if (GS) {
  await setUi({ 'bc-unit': 'mm', 'bc-module': '0.33', 'bc-dpi': '300', 'bc-height': '15', 'bc-quiet': '', 'bc-rotate': 'N' });
  await page.locator('#bc-type').selectOption('ean13');
  const base = Array.from({ length: 25 }, (_, i) => String(400638133393 + i * 11).slice(0, 12));
  const gtin = (d) => { let s = 0; for (let k = d.length - 1, w = 3; k >= 0; k--, w = w === 3 ? 1 : 3) s += Number(d[k]) * w; return d + ((10 - (s % 10)) % 10); };
  const r = await labelsRun(async () => {
    await page.locator('#bc-label-template').selectOption('L7160');
    await page.getByLabel('A list (one value per line)').check(); await page.locator('#bc-lines').fill(base.join('\n'));
    await page.locator('#bc-label-start').fill('3'); await page.locator('#bc-label-guides').check();
  });
  const pages = gsPages(r.file, 600);
  const at = (slot) => { const p = Math.floor(slot / 21), k = slot % 21, col = k % 3, row = Math.floor(k / 3); return { p, x: 7.25 + col * 66, y: 15.15 + row * 38.1 }; };
  const got = []; let emptyOk = true; let modMm = null;
  for (let slot = 0; slot < 42; slot++) {
    const { p, x, y } = at(slot); if (!pages[p]) continue;
    const cell = crop(pages[p], x + 0.4, y + 0.4, 63.5 - 0.8, 38.1 - 0.8, 600); // inside the dashed outline
    const t = await zx(cell.png);
    if (slot < 2 || slot >= 27) { if (t) emptyOk = false; continue; }
    got.push(t);
    if (slot === 2) { const rs = runs(cell, Math.floor(cell.h / 2)); modMm = (rs.reduce((s, [, n]) => s + n, 0) / 95) * (25.4 / 600); }
  }
  const want = base.map(gtin);
  check('labels, Avery L7160, start at label 3: 25 EAN-13 on 2 pages, each in its cell in list order, labels 1-2 and 28-42 empty', pages.length === 2 && got.join() === want.join() && emptyOk, `${pages.length} pages · ${got.filter((t, i) => t === want[i]).length}/25 in place · empty ok ${emptyOk} · ${r.status.split('\n')[0].slice(0, 80)}`);
  check('labels: printed at the module set (0.33 mm), measured on the page at 600 dpi', modMm && Math.abs(modMm - 0.33) < 0.012 && /0\.330 mm per module/.test(r.status), `${modMm?.toFixed(3)} mm · ${r.status.split('\n')[1] ?? ''}`);
}
if (GS) { // thermal roll: one label per page, page = label; copies in order
  await page.locator('#bc-type').selectOption('code128');
  const r = await labelsRun(async () => {
    await page.locator('#bc-label-template').selectOption('roll:50x30');
    await page.getByLabel('A list (one value per line)').check(); await page.locator('#bc-lines').fill('ROLL-A\nROLL-B\nROLL-C');
    await page.locator('#bc-label-copies').fill('2');
  });
  const doc = await (pdfjs ??= await import('pdfjs-dist/legacy/build/pdf.mjs')).getDocument({ data: new Uint8Array(fs.readFileSync(r.file)), isEvalSupported: false }).promise;
  const pg = await doc.getPage(1); const [, , W, H] = pg.view;
  const reads = []; for (const im of gsPages(r.file, 600)) reads.push(await zx(Buffer.from(UPNG.encode([im.rgba.buffer], im.w, im.h, 0))));
  check('roll labels 50 x 30 mm, 2 copies: 6 pages of 50 x 30 mm, A A B B C C', doc.numPages === 6 && Math.abs((W * 25.4) / 72 - 50) < 0.01 && Math.abs((H * 25.4) / 72 - 30) < 0.01 && reads.join() === 'ROLL-A,ROLL-A,ROLL-B,ROLL-B,ROLL-C,ROLL-C', `${doc.numPages} pages ${((W * 25.4) / 72).toFixed(2)} x ${((H * 25.4) / 72).toFixed(2)} mm · ${reads.join(',')}`);
  await page.locator('#bc-label-copies').fill('1');
}
{ // too big for the label: shrunk, and says so with the GS1 minimum
  await page.locator('#bc-type').selectOption('itf14');
  await setUi({ 'bc-module': '0.5' });
  const r = await labelsRun(async () => {
    await page.locator('#bc-label-template').selectOption('L7651');
    await page.getByLabel('A list (one value per line)').check(); await page.locator('#bc-lines').fill('1540014128876');
  });
  check('ITF-14 at 0.5 mm on a 38.1 mm label: shrunk, % and module given, GS1 minimum (0.495 mm) flagged', /shrunk to \d+ %/.test(r.status) && /GS1 minimum of 0\.495 mm/.test(r.status), r.status.replace(/\n/g, ' | ').slice(0, 220));
  await setUi({ 'bc-module': '0.33' });
}
{ // one code -> "Print it on label sheets…"
  await page.getByRole('radio', { name: 'One barcode' }).click();
  await generate('code128', 'ONE-LABEL');
  await page.locator('#bc-to-labels').click();
  const st = { mode: await page.getByRole('radio', { name: /^Many/ }).getAttribute('aria-checked'), out: await page.locator('#bc-batch-format').inputValue(), lines: await page.locator('#bc-lines').inputValue() };
  check('single code -> "Print it on label sheets…": Many, label sheets, the value in the list', st.mode === 'true' && st.out === 'labels' && st.lines === 'ONE-LABEL', JSON.stringify(st));
  await page.locator('#bc-batch-format').selectOption('png');
}
{ // cancel during a run in the Workers: no ZIP, "Cancelled."
  await page.locator('#bc-type').selectOption('code128');
  await page.getByLabel('A numbered series').check();
  for (const [k, v] of Object.entries({ prefix: 'C-', start: '1', count: '5000', step: '1', pad: '5', suffix: '' })) await page.locator(`#bc-seq-${k}`).fill(v);
  await page.locator('#bc-batch-format').selectOption('pdf');
  let downloaded = false; const onDl = () => { downloaded = true; }; page.on('download', onDl);
  await page.getByRole('button', { name: 'Generate all as ZIP' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click({ timeout: 20000 });
  const msg = await page.locator('[role=alert]:not(#__next-route-announcer__)').textContent({ timeout: 20000 });
  await page.waitForTimeout(1500); page.off('download', onDl);
  check('cancel during 5000 codes: "Cancelled.", no ZIP', msg.trim() === 'Cancelled.' && !downloaded, `${msg} · downloaded=${downloaded}`);
}
{ // no OffscreenCanvas (Safari before 16.4): the page does the batch itself, same ZIP
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { delete globalThis.OffscreenCanvas; });
  await p2.goto(origin + '/tools/qr-barcodes-tools/barcode-generator', { waitUntil: 'networkidle' });
  await p2.locator('#bc-type').selectOption('ean13');
  await p2.getByRole('radio', { name: /^Many/  }).click();
  await p2.getByLabel('A list (one value per line)').check();
  await p2.locator('#bc-lines').fill(['590123412345', 'BAD', '400638133393'].join('\n'));
  const [d] = await Promise.all([p2.waitForEvent('download', { timeout: 60000 }), p2.getByRole('button', { name: 'Generate all as ZIP' }).click()]);
  const zip = await JSZip.loadAsync(fs.readFileSync(await d.path()));
  const names = Object.keys(zip.files).sort();
  const reads = []; for (const n of names.filter((x) => x.endsWith('.png'))) reads.push(await zx(await zip.files[n].async('uint8array')));
  check('without OffscreenCanvas: batch still made on the page, in order, bad line in errors.txt', names.join() === '1-590123412345.png,3-400638133393.png,errors.txt' && reads.join() === '5901234123457,4006381333931', `${names.join(', ')} · ${reads.join(', ')}`);
  await p2.close();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
fs.rmSync(tmp, { recursive: true, force: true });
await b.close(); process.exit(fails ? 1 : 0);

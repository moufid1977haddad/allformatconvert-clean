// P31 (03/10), point 6: an image over a tool's size bound is said as soon as it is chosen, before the button, read
// from the file's header (no decoding) — the owner's 63 MP iPhone panorama (kit P27, 14000 × 4500) was accepted by
// Image Compressor as "1 image selected" with no word. Then "Reduce to 48 MP then compress" in one gesture: the result
// must be a real JPEG of the dimensions announced. Also JPG to PDF / Image to PDF (P27's other bounds): a PNG over
// 90 MP is named at selection on a phone (header-only PNG made here: 10 000 × 10 000).
// Usage: node scripts/p31/size-preflight.mjs <origin> [--browser=chromium|webkit|firefox]   (iPhone user agent)
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const tag = `${engine} [iphone]`;
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };
const PANO = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p27', 'panorama-63mpx.jpg');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p31-size-'));
// a PNG whose header says 10 000 × 10 000 (100 MP); its pixels are one tiny compressed block (only the header is read)
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(10000, 0); ihdr.writeUInt32BE(10000, 4); ihdr[8] = 8; ihdr[9] = 2;
const BIG_PNG = path.join(tmp, 'poster-100mp.png');
fs.writeFileSync(BIG_PNG, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.alloc(64))), chunk('IEND', Buffer.alloc(0))]));
const sof = (b) => { for (let i = 2; i < b.length - 9;) { if (b[i] !== 0xff) return null; const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) }; i += 2 + len; } return null; };

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const b = await { chromium, firefox, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, userAgent: UA, hasTouch: true, isMobile: engine !== 'firefox', viewport: { width: 390, height: 844 } });

if (!fs.existsSync(PANO)) check('kit panorama present', false, PANO);
else {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/image-tools/image-compressor`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  const t0 = Date.now();
  await p.locator('input[type=file]').first().setInputFiles(PANO);
  const box = p.locator('[data-over-limit]');
  await box.waitFor({ timeout: 5000 }).catch(() => {});
  const shownMs = Date.now() - t0;
  const text = (await box.count()) ? await box.innerText() : '';
  check(`63 MP panorama: message at selection in ${shownMs} ms, before any click ("${text.split('\n')[0].slice(0, 120)}…")`, /14,000 × 4,500/.test(text) && /63 megapixels/.test(text) && /on a phone or tablet the limit is 48 megapixels/.test(text) && shownMs < 5000, text);
  const above = await p.evaluate(() => { const a = document.querySelector('[data-over-limit]'), c = [...document.querySelectorAll('button')].find((x) => /^Compress/.test(x.textContent)); return !!(a && c && (a.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)); });
  check('the message stands above the Compress button', above);
  const btnText = (await p.locator('[data-reduce-then-compress]').count()) ? await p.locator('[data-reduce-then-compress]').innerText() : '';
  const dims = /It can be reduced to ([\d,]+) × ([\d,]+)/.exec(text);
  // P32 (04/10): on a phone the reduction target is 48 MP (the size proven on the owner's iPhone); P33: the bound too
  const targetMp = Number((/Reduce to (\d+) MP then compress/.exec(btnText) || [])[1] || 0);
  check(`one-gesture option "${btnText}" with the resulting size (${dims ? dims[1] + ' × ' + dims[2] : '?'})`, targetMp === 48 && !!dims && +dims[1].replace(/,/g, '') * +dims[2].replace(/,/g, '') <= targetMp * 1e6);
  await p.locator('[data-reduce-then-compress]').click();
  const row = p.locator('[data-file-download]').first();
  await row.waitFor({ timeout: 300000 }).catch(() => {});
  if (await row.count()) {
    const bytes = Buffer.from(await row.locator('a[data-download]').evaluate(async (a) => { for (let i = 0; i < 50 && a.dataset.retyped !== '1'; i++) await new Promise((r) => setTimeout(r, 100)); return Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer())); }));
    const s = sof(bytes), want = dims ? { width: +dims[1].replace(/,/g, ''), height: +dims[2].replace(/,/g, '') } : null;
    const note = await p.locator('li').first().innerText();
    check(`result: a real JPEG of ${s ? s.width + ' × ' + s.height : '?'} (announced ${want ? want.width + ' × ' + want.height : '?'}), ${(bytes.length / 1e6).toFixed(2)} MB < ${(fs.statSync(PANO).size / 1e6).toFixed(2)} MB, note says it was reduced`, s && want && s.width === want.width && s.height === want.height && s.width * s.height <= targetMp * 1e6 && bytes.length < fs.statSync(PANO).size && new RegExp(`reduced from 14000 × 4500 to ${want.width} × ${want.height}`).test(note), note);
  } else check('result offered after reduce + compress', false, await p.locator('main').innerText().then((t) => t.slice(0, 300)));
  await p.close();
}
// P33 (05/10): the owner's 48 MP photo (8064 × 6048 = 48.77 MP) is under the phone bound "48 MP": no message, no Reduce
const PHOTO48 = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p19', 'photo-48mpx.jpg');
if (fs.existsSync(PHOTO48)) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/image-tools/image-compressor`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(PHOTO48);
  await p.waitForTimeout(2500);
  check('48 MP photo (8064 × 6048): no size message, no Reduce button', (await p.locator('[data-over-limit]').count()) === 0 && (await p.locator('[data-reduce-then-compress]').count()) === 0);
  const line = await p.locator('p', { hasText: 'Up to 20 images at a time, each up to 140 megapixels on a computer and 48 on a phone or tablet (48 MP phone photos fit' }).count(); // the line under the title (the FAQ says it too)
  check('the page says 48 on a phone', line === 1);
  await p.close();
} else check('kit 48 MP photo present', false, PHOTO48);
for (const slug of ['pdf-tools/jpg-to-pdf', 'pdf-tools/image-to-pdf']) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(BIG_PNG);
  const box = p.locator('[data-size-preflight]');
  await box.waitFor({ timeout: 5000 }).catch(() => {});
  const text = (await box.count()) ? await box.innerText() : '';
  // P33 (05/10): phone bound 48 MP (was 90), and the same one-gesture Reduce as Image Compressor
  const btn = (await p.locator('[data-reduce-then-convert]').count()) ? await p.locator('[data-reduce-then-convert]').innerText() : '';
  check(`${slug}: a 100 MP PNG is named at selection (phone bound 48 MP) with "${btn}"`, /10,000 × 10,000/.test(text) && /on a phone or tablet the limit is 48 megapixels/.test(text) && /reduced to 6,928 × 6,928 \(48 MP, the size of a 48 MP phone photo\)/.test(text) && btn === 'Reduce to 48 MP then convert to PDF', text);
  await p.close();
}
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `${fails} FAIL, ${passes} pass (${tag})` : `ALL PASS: ${passes} checks (${tag})`);
process.exit(fails ? 1 : 0);

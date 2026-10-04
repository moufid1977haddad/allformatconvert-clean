// P24 (03/10): the LIGHT check on www after a merge (Vercel usage rule, plan): main pages, one tool per category, one
// real download. One engine (Chromium). The RAW check is p22-raw.mjs --only=CRW_7673 (one file). No paid call: nothing
// is sent to a /api/ route here.
// Usage: node scripts/p24/www-light.mjs [origin=https://www.onlineconvertools.com] [--no-vercel-toolbar]
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'https://www.onlineconvertools.com').origin;
const CATS = ['ai-tools', 'audio-tools', 'converter-tools', 'developer-tools', 'file-tools', 'gif-tools', 'image-tools', 'math-tools', 'pdf-tools', 'qr-barcodes-tools', 'text-tools', 'video-tools'];
const TOOLS = ['ai-tools/ai-detector', 'audio-tools/audio-converter', 'converter-tools/unit-converter', 'developer-tools/base64-encoder', 'file-tools/file-converter', 'gif-tools/gif-maker', 'image-tools/jpg-to-png', 'math-tools/percentage-calculator', 'pdf-tools/pdf-merge', 'qr-barcodes-tools/qr-generator', 'text-tools/case-converter', 'video-tools/media-player'];
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { ok ? passes++ : fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const b = await chromium.launch();
const ctx = await b.newContext();
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
await ctx.route('**/api/**', (r) => r.abort()); // never a service call from this check
const visit = async (p, label) => {
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 80)));
  const res = await page.goto(origin + p, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => ({ status: () => 0, e }));
  const h1 = await page.locator('h1').first().innerText({ timeout: 15000 }).catch(() => '');
  check(`${label} ${p}`, res.status() === 200 && h1.trim().length > 0 && !errors.length, `${res.status()} "${h1.slice(0, 40)}"${errors.length ? ' errors: ' + errors.join(' | ') : ''}`);
  return page;
};
for (const p of ['/', '/tools', ...CATS.map((c) => `/tools/${c}`), '/about', '/privacy']) await (await visit(p, 'page')).close();
for (const t of TOOLS) {
  const page = await visit(`/tools/${t}`, 'tool');
  if (t === 'image-tools/jpg-to-png') { // the one real download
    const jpg = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'www-light-')), 'photo.jpg');
    await sharp({ create: { width: 64, height: 48, channels: 3, background: '#3366cc' } }).jpeg().toFile(jpg);
    await page.locator('input[type=file]').first().setInputFiles(jpg);
    await page.getByRole('button', { name: /Convert/ }).first().click().catch(() => {});
    const a = page.locator('a[download][href]').first(); // P31: the link gets its address once retyped
    const ok = await a.waitFor({ timeout: 30000 }).then(() => true).catch(() => false);
    let meta = null;
    if (ok) { const href = await a.getAttribute('href'); const bytes = Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href)); meta = await sharp(bytes).metadata(); }
    check('download: JPG to PNG gives a 64 × 48 PNG', meta?.format === 'png' && meta.width === 64 && meta.height === 48, meta ? `${meta.format} ${meta.width}×${meta.height}` : 'no download link');
  }
  await page.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (www light)` : `ALL PASS: ${passes} checks (www light)`);
process.exit(fails ? 1 : 0);

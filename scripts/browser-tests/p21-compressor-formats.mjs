// P21 phase 3 (02/10): Image Compressor keeps an AVIF as AVIF (TinyPNG does; it became a JPG), and an animated GIF is
// sent to GIF Compressor instead of silently losing its animation (iLoveIMG keeps it). Real files made with sharp.
// Usage: node scripts/browser-tests/p21-compressor-formats.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[name];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p21-comp-'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };

const W = 1600, H = 1200, raw = Buffer.alloc(W * H * 3);
for (let i = 0; i < raw.length; i++) raw[i] = (Math.sin(i * 0.0007) * 90 + 128 + ((i * 2654435761) % 23)) & 255;
const avif = path.join(dir, 'photo.avif'); fs.writeFileSync(avif, await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).avif({ quality: 90 }).toBuffer());
const frames = []; for (let f = 0; f < 3; f++) frames.push(await sharp({ create: { width: 64, height: 64, channels: 3, background: ['#f00', '#0f0', '#00f'][f] } }).raw().toBuffer());
const anim = path.join(dir, 'anim.gif');
// sharp writes a multi-page (animated) GIF from a vertical strip when told the page height
fs.writeFileSync(anim, await sharp(Buffer.concat(frames), { raw: { width: 64, height: 192, channels: 3, pageHeight: 64 } }).gif({ delay: [100, 100, 100], loop: 0 }).toBuffer());
const still = path.join(dir, 'still.gif'); fs.writeFileSync(still, await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).resize(400, 300).gif().toBuffer());

if (name === 'webkit') { console.log('SKIP webkit: Image Compressor needs OffscreenCanvas in its worker, absent from the WebKit of Playwright (real Safari 16.4+ has it)'); process.exit(0); }
const b = await engine.launch();
async function run(file) {
  const ctx = await b.newContext();
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${origin}/tools/image-tools/image-compressor`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.getByRole('button', { name: /Compress/ }).first().click();
  await Promise.race([p.locator('[data-file-download]').first().waitFor({ timeout: 120000 }), p.locator('p.text-red-600').first().waitFor({ timeout: 120000 })]).catch(() => {});
  await p.waitForTimeout(500);
  const rows = await p.locator('[data-file-download]').evaluateAll((els) => els.map((e) => ({ name: e.dataset.name, bytes: Number(e.dataset.bytes) })));
  const text = await p.locator('main, body').first().innerText();
  await ctx.close();
  return { rows, text, errors };
}
{
  const r = await run(avif);
  const size = fs.statSync(avif).size;
  check(`AVIF stays AVIF and gets smaller (${size} → ${r.rows[0]?.bytes} bytes)`, r.rows.length === 1 && /\.avif$/.test(r.rows[0].name) && r.rows[0].bytes < size && r.rows[0].name.endsWith('.avif'), JSON.stringify(r.rows) + r.errors.join(' | '));
}
{
  const r = await run(anim);
  check('animated GIF → sent to GIF Compressor, no first-frame-only file', /animated/i.test(r.text) && /GIF Compressor/.test(r.text) && !r.rows.length, JSON.stringify(r.rows));
}
{
  const r = await run(still);
  check('still GIF → a JPG, and the page says it was converted to JPG', r.rows.length === 1 && /\.jpg$/.test(r.rows[0].name) && /converted to JPG/.test(r.text), JSON.stringify(r.rows));
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);

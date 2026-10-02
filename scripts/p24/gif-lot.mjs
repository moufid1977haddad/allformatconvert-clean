// P24 (03/10), GIF lot: GIF Compressor's new colour and size options on a real 6-frame animated GIF, reopened by sharp.
// Usage: node scripts/p24/gif-lot.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-gif-'));
const w = 200, h = 150, n = 6, raw = Buffer.alloc(w * h * n * 3);
for (let f = 0; f < n; f++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((f * h + y) * w + x) * 3; raw[i] = (x * 255 / w + f * 40) % 256; raw[i + 1] = y * 255 / h; raw[i + 2] = (f * 50) % 256; }
const anim = path.join(dir, 'anim.gif');
await sharp(raw, { raw: { width: w, height: h * n, channels: 3, pageHeight: h } }).gif({ delay: Array(n).fill(100), loop: 0 }).toFile(anim);

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
const p = await ctx.newPage();
await p.goto(`${origin}/tools/gif-tools/gif-compressor`, { waitUntil: 'load' }); await p.waitForTimeout(800);
await p.locator('input[type=file]').first().setInputFiles(anim);
await p.locator('#gc-colors').selectOption('16');
await p.locator('#gc-scale').selectOption('50');
await p.getByRole('button', { name: /^Compress/ }).click();
const ok = await p.locator('[data-file-download] [data-download]').first().waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
if (!ok) check('gif-compressor: result', false, (await p.locator('main').innerText()).slice(0, 200)); else {
  const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => { const u = new Uint8Array(await (await fetch(a.href)).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); });
  const out = Buffer.from(b64, 'base64'); const m = await sharp(out, { animated: true }).metadata();
  const first = await sharp(out).raw().toBuffer(); const colours = new Set(); for (let i = 0; i < first.length; i += m.channels || 3) colours.add(`${first[i]},${first[i + 1]},${first[i + 2]}`);
  check('gif-compressor: 16 colours and 50% → 100 px wide, still 6 frames, at most 16 colours', m.width === 100 && m.pages === 6 && colours.size <= 16, `${m.width}px ${m.pages} frames ${colours.size} colours ${out.length} B`);
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);

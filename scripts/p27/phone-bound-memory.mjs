// P27 phase 7: how much memory our in-browser image pipeline needs per megapixel -- the basis of a "phone" size bound
// (a phone tab is killed far below a computer's: iOS Safari reloads a tab around 1.5 GB on recent iPhones, Android
// Chrome caps a page on a 4 GB phone in the same range). For each size, a photo-sized JPEG (scaled from a 24 MP test photo) goes
// through the page as a visitor's would, in a fresh browser; the peak working set of the page's renderer process
// (page + its Workers + WebAssembly) is read from Windows.
//   node scripts/p27/phone-bound-memory.mjs <origin> <photo.jpg> [--sizes=24,48,100,150,200] [--tool=image-compressor|jpg-to-pdf|image-to-pdf]
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [originArg, photo] = args;
const origin = new URL(originArg).origin;
const sizes = (process.argv.find((a) => a.startsWith('--sizes='))?.slice(8) || '24,48,100,150,200').split(',').map(Number);
const tool = process.argv.find((a) => a.startsWith('--tool='))?.slice(7) || 'image-compressor';
const URLS = { 'image-compressor': '/tools/image-tools/image-compressor', 'jpg-to-pdf': '/tools/pdf-tools/jpg-to-pdf', 'image-to-pdf': '/tools/pdf-tools/image-to-pdf' };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p27-mem-'));
sharp.cache(false);

function rendererPeakMB(browserPid) {
  // every chrome.exe under this browser with --type=renderer: the largest peak working set
  const ps = `Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'chrome|headless' -and $_.CommandLine -match '--type=renderer' } | ForEach-Object { $p = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; if ($p) { [math]::Round($p.PeakWorkingSet64/1MB) } }`;
  const out = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8' });
  return Math.max(0, ...out.split(/\s+/).filter(Boolean).map(Number));
}

for (const mp of sizes) {
  const meta = await sharp(photo).metadata();
  const scale = Math.sqrt((mp * 1e6) / (meta.width * meta.height));
  const w = Math.round(meta.width * scale), h = Math.round(meta.height * scale);
  const file = path.join(tmp, `photo-${mp}mp.${tool === 'image-compressor' ? 'jpg' : 'png'}`);
  if (tool === 'image-compressor') await sharp(photo, { limitInputPixels: false }).resize(w, h).jpeg({ quality: 90 }).toFile(file);
  else await sharp(photo, { limitInputPixels: false }).resize(w, h).png({ compressionLevel: 6 }).toFile(file);
  const b = await chromium.launch();
  const ctx = await b.newContext();
  await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
  const p = await ctx.newPage();
  await p.goto(origin + URLS[tool], { waitUntil: 'load' });
  await p.waitForTimeout(800);
  const before = rendererPeakMB();
  const t0 = Date.now();
  await p.locator('input[type=file]').first().setInputFiles(file);
  // a tool that needs its button pressed
  const btn = p.getByRole('button', { name: /^(Compress|Convert|Create PDF|Convert to PDF)/ }).first();
  if (await btn.isVisible().catch(() => false)) await btn.click().catch(() => {});
  const r = await Promise.race([
    p.locator('[data-file-download] [data-download], a[download]').first().waitFor({ timeout: 900000 }).then(() => 'done'),
    p.locator('[role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout: 900000 }).then(() => 'message'),
  ]).catch(() => 'timeout');
  const ms = Date.now() - t0;
  const peak = rendererPeakMB();
  const msg = r === 'message' ? (await p.locator('[role=alert]').first().innerText().catch(() => '')).slice(0, 100) : '';
  console.log(`${tool} ${mp} MP (${w}x${h}, ${(fs.statSync(file).size / 1e6).toFixed(1)} MB file): ${r} in ${ms} ms | renderer peak ${peak} MB (idle ${before} MB) ${msg}`);
  await b.close();
}
fs.rmSync(tmp, { recursive: true, force: true });

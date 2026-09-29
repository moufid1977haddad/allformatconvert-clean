// The last downloads that were data: URLs (30/09: iOS saves nothing from a data: link): PDF to JPG / PDF to Image
// (each page + the new "all pages" ZIP), Audio Waveform, Video Screenshot. Each must be a blob: link or a Blob
// download, named after the original, with the right bytes.
// Usage: node scripts/browser-tests/data-url-downloads.mjs <origin> [--browser=firefox|webkit]   (MEDIA_FFMPEG for the video)
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iosCanvasCapInit, applyIosCanvasCap, iosCapHits, iosCapLabel } from './lib/ios-canvas-cap.mjs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dataurl-'));
const pdf = path.resolve('docs/audit/fixtures-safari/safari-A-3pages.pdf');
const wav = path.resolve('docs/audit/fixtures-safari/safari-tone-12s.wav');
const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const page = async () => { const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage(); return p; };
await applyIosCanvasCap(ctx); // P16: the iPhone's canvas limit, always (lib/ios-canvas-cap.mjs)
const save = async (p, locator) => { const [d] = await Promise.all([p.waitForEvent('download'), locator.click()]); const f = path.join(dir, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(f); return { f, name: d.suggestedFilename() }; };

for (const [tool, ext, fmt] of [['pdf-to-jpg', 'jpg', 'jpeg'], ['pdf-to-image', 'png', 'png']]) {
  const p = await page();
  await p.goto(`${origin}/tools/pdf-tools/${tool}`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(pdf);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const one = p.locator('a[download]').filter({ hasText: /Download Page 2/ });
  await one.waitFor({ timeout: 60000 });
  const href = await one.getAttribute('href');
  const d = await save(p, one);
  const m = await sharp(d.f).metadata();
  check(`${tool}: page 2 is a blob: link named after the PDF`, href.startsWith('blob:') && d.name === `safari-A-3pages-page-2.${ext}` && m.format === fmt, `${href.slice(0, 5)} ${d.name} ${m.format}`);
  const z = await save(p, p.getByRole('button', { name: /Download all pages/ }));
  const { unzipSync } = await import('fflate');
  const names = Object.keys(unzipSync(new Uint8Array(fs.readFileSync(z.f))));
  check(`${tool}: all pages as one ZIP`, z.name === 'safari-A-3pages-pages.zip' && names.length === 3 && names.every((n) => n.endsWith('.' + ext)), `${z.name}: ${names.join(', ')}`);
  await p.close();
}
{
  const p = await page();
  await p.goto(`${origin}/tools/audio-tools/audio-waveform`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(wav);
  const btn = p.getByRole('button', { name: /Download|PNG/ }).first();
  await p.waitForTimeout(3000);
  if (engine === webkit) console.log('SKIP audio-waveform: no Web Audio decoding in this WebKit');
  else { const d = await save(p, btn); const m = await sharp(d.f).metadata(); check('audio-waveform: PNG saved from a Blob, named after the audio', d.name === 'safari-tone-12s-waveform.png' && m.format === 'png', `${d.name} ${m.format}`); }
  await p.close();
}
if (process.env.MEDIA_FFMPEG && engine !== webkit) {
  const mp4 = path.join(dir, 'holiday.mp4');
  execFileSync(process.env.MEDIA_FFMPEG, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc=s=320x240:r=25:d=3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', mp4]);
  const p = await page();
  await p.goto(`${origin}/tools/video-tools/video-screenshot`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(mp4);
  await p.waitForFunction(() => document.querySelector('video')?.readyState >= 2, null, { timeout: 20000 });
  await p.getByRole('button', { name: /Capture/ }).first().click();
  const link = p.locator('a[download]').filter({ hasText: 'Download' }).first();
  await link.waitFor({ timeout: 20000 });
  const href = await link.getAttribute('href');
  const d = await save(p, link);
  const m = await sharp(d.f).metadata();
  check('video-screenshot: blob: link named after the video and the time', href.startsWith('blob:') && /^holiday-\d+\.\d\ds\.(png|jpg)$/.test(d.name) && m.width === 320, `${d.name} ${m.format} ${m.width}x${m.height}`);
  await p.close();
}
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);

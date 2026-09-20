// Real measurements of the ffmpeg.wasm video-trimmer in Chromium and Firefox.
// Usage: node scripts/browser-tests/measure-video-trimmer.mjs <baseUrl> <dir with s30.mp4 clip.mov surf.mp4 fake.mp4 big.mp4>
import { chromium, firefox } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://localhost:3100';
const dir = process.argv[3];
const url = base + '/tools/video-tools/video-trimmer';
const mvhd = (buf) => { const i = buf.indexOf('mvhd'); const v = buf[i + 4]; const o = i + 8 + (v === 1 ? 16 : 8); const ts = buf.readUInt32BE(o); const d = v === 1 ? Number(buf.readBigUInt64BE(o + 4)) : buf.readUInt32BE(o + 4); return d / ts; };

const cases = [
  { name: 's30.mp4 (30.5 s)  cut 0-30', file: 's30.mp4', from: 0, to: 30 },
  { name: 's30.mp4 (30.5 s)  cut 10-20', file: 's30.mp4', from: 10, to: 20 },
  { name: 'clip.mov (126 s)  cut 0-120', file: 'clip.mov', from: 0, to: 120 },
  { name: 'surf.mp4 (183 s)  cut 30-150', file: 'surf.mp4', from: 30, to: 150 },
];

for (const [bname, engine] of [['chromium', chromium], ['firefox', firefox]]) {
  console.log(`\n===== ${bname} =====`);
  const browser = await engine.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const wasmBytes = { total: 0, files: [] };
  ctx.on('response', async (r) => { if (/ffmpeg-core\.(wasm|js)/.test(r.url())) { try { const b = await r.body(); wasmBytes.total += b.length; wasmBytes.files.push(`${r.url().split('/').pop()}=${(b.length / 1048576).toFixed(1)}MB`); } catch {} } });
  let first = true;
  for (const c of cases) {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', path.join(dir, c.file));
    await page.waitForSelector('input[type=range]', { timeout: 30000 });
    const [rs, re] = await page.$$('input[type=range]');
    await re.fill(String(c.to)); await rs.fill(String(c.from));
    const t0 = Date.now();
    await page.click('button:has-text("Trim Video")');
    await page.waitForFunction(() => document.body.innerText.includes('Cutting'), null, { timeout: 120000 }).catch(() => {});
    const tLoad = Date.now() - t0;
    const dlp = page.waitForEvent('download', { timeout: 300000 }).catch(() => null);
    await page.waitForSelector('a:has-text("Download")', { timeout: 300000 });
    const tAll = Date.now() - t0;
    await page.waitForFunction(() => /long \(you asked/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => {});
    const info = await page.$eval('p.text-xs.text-neutral-500.text-center', (n) => n.innerText).catch(() => '?');
    await page.click('a:has-text("Download")');
    const d = await dlp; const p = d && await d.path(); const buf = p ? fs.readFileSync(p) : null;
    console.log(`${c.name}${first ? ' [COLD engine]' : ''}: engine ready ${(tLoad / 1000).toFixed(1)}s | total ${(tAll / 1000).toFixed(1)}s | cut phase ${((tAll - tLoad) / 1000).toFixed(1)}s | file ${d?.suggestedFilename()} ${buf ? (buf.length / 1048576).toFixed(1) + 'MB' : ''} | ftyp/moov ok: ${buf ? buf.includes('ftyp') && buf.includes('moov') : false} | container duration ${buf ? mvhd(buf).toFixed(1) + 's' : '?'} | page says: ${info}`);
    first = false;
    await page.close();
  }
  console.log('engine download (ffmpeg-core):', wasmBytes.files.join(', '), '=> total', (wasmBytes.total / 1048576).toFixed(1), 'MB');
  // failure paths
  for (const [label, file] of [['non-video renamed .mp4', 'fake.mp4'], ['320 MB file (over cap)', 'big.mp4']]) {
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.setInputFiles('input[type=file]', path.join(dir, file));
    await page.waitForTimeout(2500);
    const alert = await page.$('[role=alert]');
    const hasRange = await page.$('input[type=range]');
    console.log(`${label}: alert="${alert ? (await alert.innerText()).slice(0, 140) : 'none'}" sliders:${!!hasRange}`);
    await page.close();
  }
  await browser.close();
}

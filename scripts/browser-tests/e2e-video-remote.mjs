// End-to-end against a DEPLOYED site (preview or production) and the DEPLOYED
// media-processing service: nothing is mocked, the ticket comes from the site's
// own /api/media/ticket. Measures the total perceived time (click -> download
// link visible, upload included) and checks the downloaded file is real.
//
// Usage: node scripts/browser-tests/e2e-video-remote.mjs <entryUrl> <dir> [engine]
//   entryUrl: site origin, or (preview) the share URL carrying ?_vercel_share=...
//             -- it is only used for the first navigation and never printed/stored.
//   dir: folder holding s30.mp4 (30 s) and surf.mp4 (3 min)
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [entry, dir, engineName = 'chromium'] = process.argv.slice(2);
const engine = { chromium, firefox, webkit }[engineName];
const origin = new URL(entry).origin;
const bad = [];
const rows = [];

const browser = await engine.launch();
const ctx = await browser.newContext({ acceptDownloads: true });
// First navigation carries the share token (sets the bypass cookie); afterwards
// only plain paths are used.
if (new URL(entry).search) { const p = await ctx.newPage(); await p.goto(entry, { waitUntil: 'domcontentloaded' }); await p.close(); }

async function run(label, toolPath, file, pick, ext, magic) {
  const page = await ctx.newPage();
  await page.goto(origin + toolPath, { waitUntil: 'networkidle' });
  const isLegacy = /MediaRecorder/i.test(await page.innerText('body'));
  if (isLegacy) { bad.push(label + ': page is the LEGACY version (switch not active)'); console.log('  FAIL', label, 'legacy page'); await page.close(); return; }
  await page.setInputFiles('input[type=file]', path.join(dir, file));
  await page.waitForSelector('select:has(option[value=balanced]), select:has(option[value=mp4])');
  if (pick) await page.selectOption('select:has(option[value=mp4])', pick);
  const t0 = Date.now();
  await page.click('button:has-text("Compress Video"), button:has-text("Convert"):not(:has-text("Video Converter"))');
  const seen = []; const firstSeen = {};
  let link = null; let err = null;
  const deadline = Date.now() + 900000;
  while (Date.now() < deadline) {
    const txt = (await page.innerText('body')).replace(/\s+/g, ' ');
    const m = txt.match(/(Uploading|Converting|Downloading the result|Waiting for a free slot|Preparing)/);
    if (m && !(m[1] in firstSeen)) firstSeen[m[1]] = ((Date.now() - t0) / 1000).toFixed(1);
    const pm = txt.match(/(Uploading|Converting|Downloading the result)\D{0,12}(\d+)%/);
    if (pm) { const k = pm[1].split(' ')[0] + ':' + pm[2]; if (!seen.includes(k)) seen.push(k); }
    link = await page.$('a:has-text("Download ")');
    err = await page.$('p[role=alert]');
    if (link || err) break;
    await page.waitForTimeout(200);
  }
  const total = (Date.now() - t0) / 1000;
  let size = 0; let name = ''; let real = false;
  if (link) {
    const dP = page.waitForEvent('download'); await link.click(); const d = await dP;
    if (process.env.OUT) await d.saveAs(path.join(process.env.OUT, engineName + '-' + d.suggestedFilename()));
    const buf = fs.readFileSync(await d.path()); size = buf.length; name = d.suggestedFilename();
    real = size > 1000 && name.endsWith('.' + ext) && magic(buf);
  } else if (err) console.log('  page error:', await err.innerText());
  if (!real) bad.push(label);
  const progress = seen.length;
  console.log(`  ${real ? 'PASS' : 'FAIL'} ${label}: ${total.toFixed(1)} s total, ${name} ${(size / 1048576).toFixed(1)} MB, ${progress} distinct progress values, first seen at (s) ${JSON.stringify(firstSeen)}`);
  rows.push({ label, total, size, progress, firstSeen });
  await page.close();
}

const head = (s) => (b) => b.subarray(0, 64).toString('latin1').includes(s);
console.log(`===== ${engineName} on ${origin} =====`);
const FMT = process.env.FMT; // e.g. FMT=webm -> only the converter, MP4 -> FMT, on both videos
if (FMT) {
  const anyMagic = (b) => b.length > 1000;
  await run(`convert 30 s -> ${FMT}`, '/tools/video-tools/video-converter', 's30.mp4', FMT, FMT, anyMagic);
  await run(`convert 3 min -> ${FMT}`, '/tools/video-tools/video-converter', 'surf.mp4', FMT, FMT, anyMagic);
  await browser.close();
  console.log(bad.length ? `\n${bad.length} FAILED: ${bad.join('; ')}` : '\nall passed');
  process.exit(bad.length ? 1 : 0);
}
await run('compress 30 s', '/tools/video-tools/video-compressor', 's30.mp4', null, 'mp4', head('ftyp'));
await run('convert 30 s -> MP4', '/tools/video-tools/video-converter', 's30.mp4', 'mp4', 'mp4', head('ftyp'));
await run('compress 3 min', '/tools/video-tools/video-compressor', 'surf.mp4', null, 'mp4', head('ftyp'));
await run('convert 3 min -> MP4', '/tools/video-tools/video-converter', 'surf.mp4', 'mp4', 'mp4', head('ftyp'));
await browser.close();
console.log(bad.length ? `\n${bad.length} FAILED: ${bad.join('; ')}` : '\nall passed');
process.exit(bad.length ? 1 : 0);

// N visitors at once on a DEPLOYED site + media service: each one runs the same job in its own
// browser context. Reports, per visitor, what the page showed while waiting (queue position,
// "busy" message) and the total perceived time; then checks every output is a real file.
//
// Usage: node scripts/browser-tests/e2e-video-concurrency.mjs <siteOrigin> <dir with s30.mp4> <N> [tool] [format]
//   tool: compressor (default) | converter ; format: target for the converter (default mp4)
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [origin, dir, nStr = '4', tool = 'compressor', fmt = 'mp4'] = process.argv.slice(2);
const N = Number(nStr);
const url = origin + (tool === 'converter' ? '/tools/video-tools/video-converter' : '/tools/video-tools/video-compressor');
const browser = await chromium.launch();

async function visitor(i) {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.setInputFiles('input[type=file]', path.join(dir, 's30.mp4'));
  await page.waitForSelector('select:has(option[value=balanced]), select:has(option[value=mp4])');
  if (tool === 'converter') await page.selectOption('select:has(option[value=mp4])', fmt);
  const t0 = Date.now();
  const at = () => +((Date.now() - t0) / 1000).toFixed(1);
  await page.click('button:has-text("Compress Video"), button:has-text("Convert"):not(:has-text("Video Converter"))');
  const seen = []; let maxPos = 0; let busy = false; let firstProcessing = null; let waitedS = 0; let waitStart = null;
  let done = null; let err = null;
  while (at() < 900) {
    const txt = (await page.innerText('body')).replace(/\s+/g, ' ');
    const q = txt.match(/you are number (\d+) in line/);
    if (q) { maxPos = Math.max(maxPos, +q[1]); }
    const waiting = /Waiting for a free slot/.test(txt);
    if (waiting && waitStart === null) waitStart = at();
    if (!waiting && waitStart !== null) { waitedS += at() - waitStart; waitStart = null; }
    if (/All conversion slots are busy/.test(txt)) busy = true;
    if (/Converting\D{0,12}\d+%/.test(txt) && firstProcessing === null) firstProcessing = at();
    done = await page.$('a:has-text("Download ")');
    err = await page.$('p[role=alert]');
    if (done || err) break;
    await page.waitForTimeout(250);
  }
  const total = at();
  let size = 0; let ok = false;
  if (done) {
    const dP = page.waitForEvent('download'); await done.click(); const d = await dP;
    size = fs.statSync(await d.path()).size; ok = size > 1000;
  }
  const msg = err ? await err.innerText() : '';
  await ctx.close();
  return { visitor: i + 1, ok, total, size, maxQueuePosition: maxPos, sawBusyMessage: busy, startedConvertingAt: firstProcessing, waitedInLineS: +waitedS.toFixed(1), error: msg };
}

const results = await Promise.all(Array.from({ length: N }, (_, i) => visitor(i)));
for (const r of results.sort((a, b) => a.total - b.total)) console.log(JSON.stringify(r));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `${failed.length}/${N} FAILED` : `all ${N} succeeded`);
process.exit(failed.length ? 1 : 0);

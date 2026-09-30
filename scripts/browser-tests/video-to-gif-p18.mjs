// Video Tools > Video to GIF (P18 step 4): the tool must make an ANIMATED GIF (it used to only capture PNG frames),
// and keep frame extraction as an option. Checks, as a visitor:
//   1. "Make GIF" on a real MP4 -> one .gif file offered through the download row: GIF89a, several frames (graphic
//      control extensions), the width asked for (needs the media service: --real-service on a preview or www;
//      --cors-shim on a preview served through the local relay);
//   2. "Or extract frames as PNG images" -> N real PNG files, each offered, and "Download all (ZIP)".
// WebKit on Windows cannot decode H.264 (no frames to capture): part 2 is skipped there, and said so.
// Usage: node scripts/browser-tests/video-to-gif-p18.mjs <origin> [--browser=chromium|firefox|webkit] [--real-service] [--cors-shim] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import { realMediaService } from './lib/real-media-service.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const real = process.argv.includes('--real-service');
const MP4 = 'scripts/audit/fixtures/files/sample.mp4';
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
const svc = real ? realMediaService({ origin, corsShim: process.argv.includes('--cors-shim') }) : null;
if (svc) await svc.routeTickets(ctx);
const p = await ctx.newPage();
const errors = []; p.on('pageerror', (e) => errors.push(e.message));
await p.goto(origin + '/tools/video-tools/video-to-gif', { waitUntil: 'load' });
await p.waitForTimeout(1500);
check('title and promise: an animated GIF', (await p.locator('h1').innerText()) === 'Video to GIF' && /animated GIF/.test(await p.locator('main').innerText()));
await p.locator('input[type=file]').first().setInputFiles(MP4);
check('"Make GIF" offered for the chosen video', await p.getByRole('button', { name: 'Make GIF' }).isEnabled());

const fileBytes = (row) => p.evaluate(async (el) => Array.from(new Uint8Array(await (await fetch(el.querySelector('a[data-download]').href)).arrayBuffer())), row);
if (real) {
  await p.locator('label', { hasText: 'Length (seconds)' }).locator('input').fill('2');
  await p.locator('label', { hasText: 'Width' }).locator('select').selectOption('320');
  await p.getByRole('button', { name: 'Make GIF' }).click();
  const row = p.locator('[data-file-download]').filter({ has: p.locator('a[download$=".gif"]') }).first();
  await row.waitFor({ timeout: 240000 });
  const buf = Buffer.from(await fileBytes(await row.elementHandle()));
  const frames = buf.reduce((n, v, i) => n + (v === 0x21 && buf[i + 1] === 0xf9 ? 1 : 0), 0);
  const w = buf.readUInt16LE(6);
  check(`"Make GIF" -> a real animated GIF (GIF89a, ${frames} frames, ${w} px wide, ${buf.length} bytes)`, buf.subarray(0, 6).toString() === 'GIF89a' && frames >= 5 && w === 320, buf.subarray(0, 6).toString());
} else console.log(`SKIP ${name} "Make GIF" (needs the media service: run with --real-service on a preview or www)`);

if (name === 'webkit') console.log('SKIP webkit frame extraction (WebKit on Windows has no H.264 decoder)');
else {
  await p.getByRole('button', { name: /extract frames as PNG/ }).click();
  await p.getByRole('button', { name: /^Extract \d+ frames/ }).click();
  await p.locator('[data-frame-extractor] [data-download-all]').waitFor({ timeout: 90000 });
  const rows = await p.locator('[data-frame-extractor] [data-file-download]').elementHandles();
  let good = 0;
  for (const r of rows) { const bytes = await fileBytes(r); if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes.length > 1000) good++; }
  check(`frame extraction: ${rows.length} PNG files offered, all real`, rows.length === 15 && good === rows.length, `${good}/${rows.length}`);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('[data-frame-extractor] [data-download-all]').click()]);
  check(`frame extraction: "Download all" -> ${dl.suggestedFilename()}`, /-frames\.zip$/.test(dl.suggestedFilename()));
}
check('no page error', errors.length === 0, errors.join(' | '));
await b.close();
console.log(fails ? `${fails} FAIL (${name})` : `ALL PASS (${name}${real ? ', real media service' : ''})`);
process.exit(fails ? 1 : 0);

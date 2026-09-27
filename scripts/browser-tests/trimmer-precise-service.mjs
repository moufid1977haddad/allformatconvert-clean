// Video Trimmer, Precise cut through our video service (28/09) -- with the service PLAYED BY THIS TEST (routes
// intercepted, like service-tools-mock.mjs): in a browser where the local re-encode would be long (Firefox,
// WebKit; or a long clip), checks that ONLY the piece around the cut is sent (smaller than the video, starting
// on the keyframe before the start, copied without re-encoding), that the service is asked for the exact cut
// (clipStart inside the piece = start - keyframe, clipDuration = the length), and that what is downloaded is the
// service's MP4. Also: a short clip in Chromium stays in the browser (nothing sent).
// Needs a build with a test service URL: NEXT_PUBLIC_MEDIA_SERVICE_URL=https://media.test.invalid (or MOCK_SERVICE_URL).
// Usage: node scripts/browser-tests/trimmer-precise-service.mjs <origin> <ffmpeg> [--browser=firefox|webkit|chromium]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=firefox').slice(10);
const SERVICE = process.env.MOCK_SERVICE_URL || 'https://media.test.invalid';
const FP = FF.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vtsvc-'));

// 20 s of 1280x720, a keyframe every 2 s, with sound
const src = path.join(tmp, 'src.mp4');
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30:duration=20', '-f', 'lavfi', '-i', 'sine=d=20', '-c:v', 'libx264', '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', src]);
const back = path.join(tmp, 'back.mp4');
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=30:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', back]);
const BACK = fs.readFileSync(back);

const b = await { chromium, firefox, webkit }[browserName].launch();
const ctx = await b.newContext({ acceptDownloads: true });
// The service's protocol, as played by service-tools-mock.mjs: ticket, POST /v1/jobs (size, op, params), PUT chunks, start, status, result.
const jobs = [];
let chunks = [];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Expose-Headers': '*' };
await ctx.route('**/api/media/ticket', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jid: 'j' + (jobs.length + 1) + 'x'.repeat(16), ticket: 'test-ticket', expiresAt: Date.now() + 9e5 }) }));
await ctx.route(SERVICE + '/**', async (r) => {
  const req = r.request(); const u = new URL(req.url()); const m = req.method();
  if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const json = (status, o) => r.fulfill({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
  if (m === 'POST' && u.pathname === '/v1/jobs') { const body = req.postDataJSON(); jobs.push({ create: body }); chunks = []; return json(201, { chunkBytes: 1 << 20, totalChunks: Math.ceil(body.size / (1 << 20)) }); }
  if (m === 'PUT' && /\/chunks\/\d+$/.test(u.pathname)) { chunks[Number(u.pathname.split('/').pop())] = req.postDataBuffer(); return json(200, { ok: true }); }
  if (m === 'POST' && u.pathname.endsWith('/start')) return json(202, {});
  if (m === 'GET' && u.pathname.endsWith('/result')) return r.fulfill({ status: 200, headers: { ...cors, 'Content-Type': 'video/mp4' }, body: BACK });
  if (m === 'GET') return json(200, { status: 'done', progress: 100, outputExt: 'mp4', outputBytes: BACK.length });
  if (m === 'DELETE') return json(200, {});
  return json(404, {});
});

async function trimOnce(startS, endS) {
  const p = await ctx.newPage();
  p.setDefaultTimeout(300000);
  await p.goto(`${origin}/tools/video-tools/video-trimmer`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(src);
  await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /^Trim Video \((?!0\.0s)/.test(b.textContent) && !b.disabled), null, { timeout: 90000 });
  await p.locator('input[type=checkbox]').first().check();
  // start / end: set the two range inputs the page uses (by their order: start then end)
  const ranges = p.locator('input[type=range]');
  await ranges.nth(0).evaluate((e, v) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, v); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, String(startS));
  await ranges.nth(1).evaluate((e, v) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, v); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, String(endS));
  const jobsBefore = jobs.length;
  await p.getByRole('button', { name: /^Trim Video/ }).click();
  const dl = p.locator('a[download]').first();
  await dl.waitFor({ timeout: 300000 });
  const [d] = await Promise.all([p.waitForEvent('download'), dl.click()]);
  const f = path.join(tmp, `out-${startS}.mp4`); await d.saveAs(f);
  await p.close();
  return { sent: jobs.length > jobsBefore ? jobs.at(-1) : null, file: f, name: d.suggestedFilename() };
}

const r = await trimOnce(5.3, 15.3); // 10 s at 720p: long enough locally in Firefox/WebKit, and in Chromium > 45 s? (no: stays local)
if (browserName === 'chromium') {
  check('Chromium, 10 s of 720p: re-encoded in the browser, nothing sent', r.sent === null);
} else {
  const params = r.sent?.create?.params || {};
  const piece = Buffer.concat(chunks.filter(Boolean));
  const piecePath = path.join(tmp, 'piece.mkv'); fs.writeFileSync(piecePath, piece);
  let first = null, dur = null;
  try {
    first = parseFloat(execFileSync(FP, ['-v', 'error', '-select_streams', 'v:0', '-read_intervals', '%+#1', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', piecePath]).toString().split(/\s+/)[0]);
    dur = parseFloat(execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', piecePath]).toString());
  } catch {}
  check('the service is used for the precise cut (op convert, target mp4)', !!r.sent && r.sent.create?.op === 'convert' && params.target === 'mp4', JSON.stringify(r.sent?.create || {}).slice(0, 200));
  check(`only the piece is sent: ${(piece.length / 1e6).toFixed(2)} MB for a ${(fs.statSync(src).size / 1e6).toFixed(2)} MB video, ${dur?.toFixed(2)} s long`, piece.length > 0 && piece.length < fs.statSync(src).size * 0.8 && dur > 10 && dur < 14);
  // keyframes every 2 s: the one before 5.3 s is 4.0 s -> the start is 1.3 s into the piece (+ the piece's first video time)
  check(`exact cut asked: clipStart ${params.clipStart} (expected 1.3 + first video time ${first}), clipDuration ${params.clipDuration} (10)`, Math.abs(params.clipStart - (1.3 + (first || 0))) < 0.02 && params.clipDuration === 10);
  check(`the download is the service's MP4 (${r.name})`, fs.readFileSync(r.file).equals(BACK) && /\.mp4$/.test(r.name));
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${browserName})`);
process.exit(fails ? 1 : 0);

// Video Trimmer, Precise cut through the REAL media service (point 8, 28/09), end to end, in Firefox (or WebKit):
// a 1080p source whose every frame shows its own number (as its brightness), cut 5.30 s -> 15.30 s; the MP4
// downloaded must start on frame 159 (5.30 s at 30 fps) -- not on the keyframe before (frame 150) -- and last 10 s.
// On a preview the service does not send CORS headers for the preview's address: --cors-shim relays the service's
// calls through Playwright and adds that header, nothing else (as audio-opus-real.mjs). One ticket used.
// Usage: node scripts/browser-tests/trimmer-precise-real.mjs <origin> <ffmpeg> [--browser=webkit] [--cors-shim]
import { firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=webkit') ? webkit : firefox;
const FP = FF.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${engine.name()} ${n}`, info); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vtreal-'));
const src = path.join(tmp, 'numbered.mp4');
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=1920x1080:r=30:d=20', '-f', 'lavfi', '-i', 'sine=d=20', '-vf', "geq=lum='mod(N,256)':cb=128:cr=128", '-c:v', 'libx264', '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', src]);

const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
const serviceCalls = [];
await ctx.route(/railway\.app/, async (r) => {
  serviceCalls.push(r.request().method() + ' ' + new URL(r.request().url()).pathname);
  if (!process.argv.includes('--cors-shim')) return r.continue();
  const req = r.request();
  const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Authorization, Content-Type, X-Chunk-Sha256', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS', 'access-control-expose-headers': '*' };
  if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const resp = await r.fetch();
  return r.fulfill({ response: resp, headers: { ...resp.headers(), ...cors } });
});
const p = await ctx.newPage();
p.setDefaultTimeout(300000);
await p.goto(`${origin}/tools/video-tools/video-trimmer`, { waitUntil: 'networkidle' });
await p.locator('input[type=file]').setInputFiles(src);
await p.waitForFunction(() => [...document.querySelectorAll('button')].some((x) => /^Trim Video \((?!0\.0s)/.test(x.textContent) && !x.disabled), null, { timeout: 90000 });
await p.locator('input[type=checkbox]').first().check();
const setRange = (i, v) => p.locator('input[type=range]').nth(i).evaluate((e, val) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, val); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, String(v));
await setRange(0, 5.3); await setRange(1, 15.3);
const t0 = Date.now();
await p.getByRole('button', { name: /^Trim Video/ }).click();
const dl = p.locator('a[download]').first();
const got = await dl.waitFor({ timeout: 300000 }).then(() => true, () => false);
if (!got) {
  check('a result', false, (await p.locator('[role=alert], .text-red-400, .text-red-500, .text-red-600').allInnerTexts()).join(' | '));
} else {
  const [d] = await Promise.all([p.waitForEvent('download'), dl.click()]);
  const f = path.join(tmp, 'out.mp4'); await d.saveAs(f);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const dur = parseFloat(execFileSync(FP, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
  const y = execFileSync(FF, ['-v', 'error', '-i', f, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-'], { maxBuffer: 1 << 26 }).subarray(0, 1920 * 1080);
  let s = 0; for (let i = 0; i < y.length; i += 97) s += y[i]; const level = s / Math.ceil(y.length / 97);
  check(`the precise cut went through our service (${serviceCalls.filter((c) => c.startsWith('PUT')).length} chunk(s) sent)`, serviceCalls.some((c) => c.startsWith('POST /v1/jobs')));
  check(`first frame is frame 159 (5.30 s), not the keyframe at 5.00 s: brightness ${level.toFixed(1)}`, Math.abs(level - 159) < 2);
  check(`length ${dur.toFixed(3)} s for 10 s asked, ${secs} s from click to result`, Math.abs(dur - 10) < 0.07);
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${engine.name()})`);
process.exit(fails ? 1 : 0);

// Screen Recorder (30/09: it saved WebM, which the iPhone cannot open). Chromium, screen capture auto-accepted:
// 3 s recorded -> the download must be a real MP4 (H.264) when the browser can record MP4; and with MP4 recording
// hidden (as in Firefox), the WebM must be offered as an MP4 through the LOCAL media service (never production).
// Needs the site run with NEXT_PUBLIC_MEDIA_SERVICE_URL=http://localhost:8621 and MEDIA_FFMPEG.
// Usage: node scripts/browser-tests/screen-recorder-mp4.mjs <origin>
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startLocalMediaService } from './lib/local-media-service.mjs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const FP = process.env.MEDIA_FFMPEG.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
const codecs = (p) => JSON.parse(execFileSync(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', p]).toString());
const svc = await startLocalMediaService({ origin });
const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--auto-select-desktop-capture-source=Entire screen', '--auto-accept-this-tab-capture'] });
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function record(hideMp4) {
  const ctx = await b.newContext({ acceptDownloads: true });
  await svc.routeTickets(ctx);
  if (hideMp4) await ctx.addInitScript(() => { const o = MediaRecorder.isTypeSupported.bind(MediaRecorder); MediaRecorder.isTypeSupported = (t) => !/mp4/.test(t) && o(t); });
  const p = await ctx.newPage();
  await p.goto(origin + '/tools/video-tools/screen-recorder', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Start Recording' }).click();
  await p.waitForTimeout(3000);
  await p.getByRole('button', { name: 'Stop Recording' }).click();
  const link = p.locator('a[download]').filter({ hasText: 'Download Recording' });
  await link.waitFor({ timeout: 30000 });
  if (hideMp4) {
    await p.getByRole('button', { name: /Make an MP4/ }).click();
    await p.locator('a[download]').filter({ hasText: '(MP4)' }).waitFor({ timeout: 120000 }).catch(async (e) => { console.log('PAGE:', (await p.locator('body').innerText()).slice(0, 1500).replace(/\n+/g, ' | ')); throw e; });
  }
  const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const out = path.join(os.tmpdir(), `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(out);
  await ctx.close();
  return { out, name: d.suggestedFilename() };
}
try {
  let r = await record(false);
  let j = codecs(r.out);
  check('Chromium records MP4 directly', /\.mp4$/.test(r.name) && /mp4|mov/.test(j.format.format_name) && j.streams.some((s) => s.codec_name === 'h264'), `${r.name} ${j.format.format_name} ${j.streams.map((s) => s.codec_name)}`);
  r = await record(true);
  j = codecs(r.out);
  check('no MP4 recording (Firefox case): WebM turned into an MP4 by the service', /\.mp4$/.test(r.name) && j.streams.some((s) => s.codec_name === 'h264') && svc.jobs.length === 1, `${r.name} ${j.streams.map((s) => s.codec_name)} tickets ${svc.jobs.length}`);
} finally { await b.close(); svc.stop(); }
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);

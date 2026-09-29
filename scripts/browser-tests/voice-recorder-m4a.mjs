// Voice Recorder (30/09): AAC in MP4 (.m4a) where the browser can record it (Chromium here, fake microphone), WebM
// otherwise; the file must really be what its name says (ffprobe).
// Usage: node scripts/browser-tests/voice-recorder-m4a.mjs <origin> [--browser=firefox]   (MEDIA_FFMPEG for ffprobe)
import { chromium, firefox } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const isFx = process.argv.includes('--browser=firefox');
const FP = process.env.MEDIA_FFMPEG.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
const b = isFx
  ? await firefox.launch({ firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true } })
  : await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const ctx = await b.newContext({ acceptDownloads: true, ...(isFx ? {} : { permissions: ['microphone'] }) });
const p = await ctx.newPage();
await p.goto(origin + '/tools/audio-tools/voice-recorder', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: /Start Recording|Record/ }).first().click();
await p.waitForTimeout(2500);
await p.getByRole('button', { name: /Stop/ }).first().click();
const btn = p.getByRole('button', { name: /^Download/ }).or(p.locator('a[download]').filter({ hasText: /Download/ })).first();
await btn.waitFor({ timeout: 20000 });
const [d] = await Promise.all([p.waitForEvent('download'), btn.click()]);
const f = path.join(os.tmpdir(), `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(f);
const j = JSON.parse(execFileSync(FP, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f]).toString());
const codec = j.streams[0]?.codec_name, fmt = j.format.format_name, name = d.suggestedFilename();
const ok = isFx ? /\.webm$/.test(name) && /webm|matroska/.test(fmt) : /\.m4a$/.test(name) && /mp4|mov/.test(fmt) && codec === 'aac';
console.log(ok ? 'PASS' : 'FAIL', `${isFx ? 'firefox' : 'chromium'}: ${name} ${fmt} ${codec} ${Number(j.format.duration).toFixed(2)} s`);
await b.close(); process.exit(ok ? 0 : 1);

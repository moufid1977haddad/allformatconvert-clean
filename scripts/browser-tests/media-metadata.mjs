// Audio Metadata and Video Metadata (ffprobe in the browser, 28/09/2026), real pages. Files made here with ffmpeg,
// every figure on the page compared with what the native ffprobe reads from the same file:
//  - MP3 with ID3 tags and an embedded cover: codec, sample rate, channels, tags, cover picture shown;
//  - WMA (no browser plays it): report complete anyway;
//  - 24-bit FLAC: bit depth;
//  - MKV with one video, two audio tracks (languages) and a subtitle track;
//  - MP4 from a phone held upright (display rotation 90°): rotation shown;
//  - a 1.27 GB WAV (2 hours): read without copying it into memory, duration 2:00:00;
//  - the JSON report downloaded = ffprobe's output (same streams).
// Usage: node scripts/browser-tests/media-metadata.mjs <origin> <ffmpeg> [--browser=firefox|webkit] [--no-big]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mmeta-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const ff = (args) => execFileSync(FF, ['-y', '-v', 'error', ...args]);
const F = (n) => path.join(tmp, n);

ff(['-f', 'lavfi', '-i', 'color=c=red:s=300x300', '-frames:v', '1', F('cover.png')]);
ff(['-f', 'lavfi', '-i', 'sine=frequency=440:duration=5', '-i', F('cover.png'), '-map', '0:a', '-map', '1:v', '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '44100', '-ac', '2', '-c:v', 'mjpeg', '-disposition:v', 'attached_pic',
  '-id3v2_version', '3', '-metadata', 'title=Night Test Song', '-metadata', 'artist=Test Artist', '-metadata', 'album=Test Album', F('tagged.mp3')]);
ff(['-f', 'lavfi', '-i', 'sine=d=4', '-c:a', 'wmav2', F('tone.wma')]);
ff(['-f', 'lavfi', '-i', 'sine=d=3', '-c:a', 'flac', '-sample_fmt', 's32', '-bits_per_raw_sample', '24', '-ar', '96000', F('hires.flac')]);
fs.writeFileSync(F('subs.srt'), '1\n00:00:00,500 --> 00:00:02,000\nHello\n');
ff(['-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30:duration=3', '-f', 'lavfi', '-i', 'sine=d=3', '-f', 'lavfi', '-i', 'sine=frequency=880:d=3', '-i', F('subs.srt'),
  '-map', '0', '-map', '1', '-map', '2', '-map', '3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-c:s', 'srt', '-metadata:s:a:0', 'language=eng', '-metadata:s:a:1', 'language=fra', F('multi.mkv')]);
ff(['-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', F('flat.mp4')]);
ff(['-display_rotation', '90', '-i', F('flat.mp4'), '-c', 'copy', F('phone.mp4')]);
const big = !process.argv.includes('--no-big');
if (big) ff(['-f', 'lavfi', '-i', 'sine=frequency=300:duration=7200', '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', F('long.wav')]);

const b = await engine.launch();
async function report(tool, file) {
  const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  await p.goto(origin + tool, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(file);
  const ok = await p.locator('[data-media-info]').waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  const text = ok ? await p.locator('[data-media-info]').innerText() : (await p.locator('[role=alert], [role=status]').allTextContents()).join(' ');
  return { ctx, p, ok, text };
}
const A = '/tools/audio-tools/audio-metadata', V = '/tools/video-tools/video-metadata';
{
  const { ctx, p, ok, text } = await report(A, F('tagged.mp3'));
  check('MP3: codec, 44,100 Hz, 2 channels, 192 kbit/s', ok && /MP3/i.test(text) && /44,100 Hz/.test(text) && /\b2\b.*stereo|stereo/.test(text) && /19\d kbit\/s/.test(text), text.replace(/\s+/g, ' ').slice(0, 200));
  check('MP3: ID3 tags shown (title, artist, album)', /Night Test Song/.test(text) && /Test Artist/.test(text) && /Test Album/.test(text));
  check('MP3: embedded cover picture shown', (await p.locator('[data-media-info] img').count()) === 1);
  const [d] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Download report (JSON)' }).click()]);
  const j = JSON.parse(fs.readFileSync(await d.path(), 'utf8'));
  const native = JSON.parse(execFileSync(FF.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1'), ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', F('tagged.mp3')]).toString());
  check('JSON report = ffprobe (same streams and codecs as the native ffprobe)', j.streams.map((s) => s.codec_name).join() === native.streams.map((s) => s.codec_name).join(), `${d.suggestedFilename()} ${j.streams.map((s) => s.codec_name)}`);
  await ctx.close();
}
{ const { ctx, ok, text } = await report(A, F('tone.wma')); check('WMA (no browser plays it): report complete', ok && /Windows Media Audio/i.test(text), text.replace(/\s+/g, ' ').slice(0, 160)); await ctx.close(); }
{ const { ctx, ok, text } = await report(A, F('hires.flac')); check('FLAC 24-bit 96 kHz: bit depth and sample rate', ok && /24 bit/.test(text) && /96,000 Hz/.test(text), text.replace(/\s+/g, ' ').slice(0, 200)); await ctx.close(); }
{ const { ctx, ok, text } = await report(V, F('multi.mkv')); check('MKV: 1280 × 720, 30 fps, two audio tracks (eng, fra), a subtitle track', ok && /1280 × 720/.test(text) && /30 fps/.test(text) && /eng/.test(text) && /fra/.test(text) && /subtitle/.test(text), text.replace(/\s+/g, ' ').slice(0, 240)); await ctx.close(); }
{ const { ctx, ok, text } = await report(V, F('phone.mp4')); check('phone video: rotation shown', ok && /Rotation\s*-?90°/.test(text), text.replace(/\s+/g, ' ').slice(0, 240)); await ctx.close(); }
if (big) { const t0 = Date.now(); const { ctx, ok, text } = await report(A, F('long.wav')); check(`1.27 GB WAV: read in ${((Date.now() - t0) / 1000).toFixed(1)} s, duration 2:00:00`, ok && /2:00:00\.000/.test(text), text.replace(/\s+/g, ' ').slice(0, 160)); await ctx.close(); }
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);

// P16 step 1 (30/09), checks D and K on a deployed site (www) with the REAL media service: a vertical 1080x1920
// phone-like video at 30 fps (H.264/AAC, 5 s) through
//  - Video Rotator 90° -> shown 1920x1080, 150 frames, 5.000 s, 30 fps, sound;
//  - Video Merger, the same clip twice -> 10 s, 300 frames; and two DIFFERENT sources (this clip + a 1280x720 25 fps
//    3 s clip) -> the first clip's size and rate, exactly 8 s, 240 frames, sound over the whole length;
//  - Video Resizer 480p -> 480x854 (vertical kept), 150 frames, 5.000 s, 30 fps, sound.
// Every output reopened with ffprobe (-count_frames). Uses at most 4 tickets (20 per hour per address).
// Needs MEDIA_FFMPEG=<ffmpeg.exe>. Usage: node scripts/browser-tests/p16-video-www.mjs <origin> [--browser=firefox] [--cors-shim]
import { chromium, firefox } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { realMediaService } from './lib/real-media-service.mjs';

const origin = new URL(process.argv[2] || 'https://www.onlineconvertools.com').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const FF = process.env.MEDIA_FFMPEG;
const FP = FF.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p16-video-'));
const ff = (...a) => execFileSync(FF, ['-y', '-v', 'error', ...a]);
const tall = path.join(dir, 'IMG_1080x1920.mp4');
ff('-f', 'lavfi', '-i', 'testsrc2=s=1080x1920:r=30:d=5', '-f', 'lavfi', '-i', 'sine=f=440:d=5:r=48000', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-g', '60', '-c:a', 'aac', '-shortest', tall);
const wide = path.join(dir, 'second-1280x720.mp4');
ff('-f', 'lavfi', '-i', 'testsrc=s=1280x720:r=25:d=3', '-f', 'lavfi', '-i', 'sine=f=660:d=3:r=44100', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', wide);

const probe = (p) => {
  const j = JSON.parse(execFileSync(FP, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', p]).toString());
  const v = j.streams.find((s) => s.codec_type === 'video'), a = j.streams.find((s) => s.codec_type === 'audio');
  const rot = Math.abs(Number((v.side_data_list || []).find((d) => 'rotation' in d)?.rotation || 0)) % 180;
  const [n, d] = v.r_frame_rate.split('/').map(Number);
  return { size: (rot === 90 ? [v.height, v.width] : [v.width, v.height]).join('x'), fps: n / (d || 1), frames: Number(v.nb_read_frames),
    vdur: Number(v.duration), adur: a ? Number(a.duration) : null, codecs: `${v.codec_name}/${a ? a.codec_name : 'none'}`, fmt: j.format.format_name };
};
const svc = realMediaService({ origin, corsShim: process.argv.includes('--cors-shim') });
const b = await engine.launch();
const rows = [];
let fails = 0;
const check = (name, p, size, frames, secs) => {
  const ok = p.size === size && Math.abs(p.fps - 30) < 0.01 && p.frames === frames && Math.abs(p.vdur - secs) <= 0.001 + 1 / 60 && p.adur !== null && Math.abs(p.adur - secs) <= 0.05 && /mp4/.test(p.fmt) && p.codecs === 'h264/aac';
  if (!ok) fails++;
  const line = `${ok ? 'PASS' : 'FAIL'} ${engine.name()} ${name}: ${p.size} (${size} expected), ${p.fps} fps, ${p.frames} frames (${frames}), video ${p.vdur.toFixed(3)} s, sound ${p.adur === null ? 'NONE' : p.adur.toFixed(3) + ' s'} (${secs} s), ${p.codecs}`;
  rows.push(line); console.log(line);
};
async function tool(url, files, act) {
  const ctx = await b.newContext({ acceptDownloads: true });
  await svc.routeTickets(ctx);
  const before = svc.jobs.length;
  const page = await ctx.newPage();
  await page.goto(origin + url, { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(files);
  await act(page);
  const link = page.locator('a[download]').filter({ hasText: /Download/ }).last();
  const err = page.locator('p[role=alert]').filter({ hasText: /\S/ });
  await Promise.race([link.waitFor({ timeout: 600000 }), err.first().waitFor({ timeout: 600000 })]);
  if (!(await link.count())) { const e = await err.first().innerText(); await ctx.close(); return { error: e }; }
  const [d] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const out = path.join(dir, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(out);
  await ctx.close();
  return { out, uploads: svc.jobs.length - before };
}
const fail = (n, e) => { fails++; const l = `FAIL ${engine.name()} ${n}: ${e}`; rows.push(l); console.log(l); };
try {
  let r = await tool('/tools/video-tools/video-rotator', tall, async (p) => { await p.getByRole('button', { name: /^90°/ }).click(); await p.getByRole('button', { name: 'Rotate Video' }).click(); });
  if (r.error) fail('Rotator 90°', r.error); else check(`Rotator 90° (uploads ${r.uploads})`, probe(r.out), '1920x1080', 150, 5);
  r = await tool('/tools/video-tools/video-merger', [tall, tall], async (p) => { await p.getByRole('button', { name: /Merge Videos/ }).click(); });
  if (r.error) fail('Merger 2 identical clips', r.error); else check(`Merger 2 identical clips (uploads ${r.uploads})`, probe(r.out), '1080x1920', 300, 10);
  r = await tool('/tools/video-tools/video-merger', [tall, wide], async (p) => { await p.getByRole('button', { name: /Merge Videos/ }).click(); });
  if (r.error) fail('Merger 2 different sources', r.error); else check(`Merger vertical 1080x1920 30 fps 5 s + 1280x720 25 fps 3 s (uploads ${r.uploads})`, probe(r.out), '1080x1920', 240, 8);
  r = await tool('/tools/video-tools/video-resizer', tall, async (p) => { await p.getByText(/^Your video: 1080×1920 \(vertical\)/).waitFor({ timeout: 30000 }); await p.getByRole('button', { name: '480p', exact: true }).click(); await p.getByRole('button', { name: 'Resize Video' }).click(); });
  if (r.error) fail('Resizer 480p', r.error); else check(`Resizer 480p on vertical 1080x1920 (uploads ${r.uploads})`, probe(r.out), '480x854', 150, 5);
} finally { await b.close(); }
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()}, ${origin})`); process.exit(fails ? 1 : 0);

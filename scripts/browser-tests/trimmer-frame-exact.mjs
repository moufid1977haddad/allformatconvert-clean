// Video Trimmer, "Precise cut" exact to the frame (30/09). Real Safari 17.6 on the Mac, production 828cfe75: a 1 s -> 5 s
// cut of a 30 fps video gave 118 frames (3.933 s), sound 3.99 s. Cause (reproduced): "-ss" before "-i" is shifted by
// the container's start time, and when the sound starts before the video (B-frames, phone MOVs, the MKV piece the
// page sends to the service) the cut landed 1-2 frames late and "-t" cut the end.
// Here, against the REAL media service started locally (lib/local-media-service.mjs) -- never production:
//  A. an MP4 whose frames show their own number (grey level), 1920x1080, 30 fps, B-frames, a keyframe every 2 s, AAC;
//  B. the same as a MOV whose sound starts 21 ms before the picture (as phone files and the piece do).
// Cut 1.0 -> 5.0 s: exactly 120 frames, video 4.000 s, sound 4.000 s, both from 0; A starts on frame 30.
// Chromium re-encodes a short clip in the page (ffmpeg.wasm); Firefox and WebKit send the piece to the service.
// Needs: the site built with NEXT_PUBLIC_MEDIA_SERVICE_URL=http://localhost:8621, MEDIA_FFMPEG=<ffmpeg.exe>.
// Usage: node scripts/browser-tests/trimmer-frame-exact.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startLocalMediaService } from './lib/local-media-service.mjs';

const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const FF = process.env.MEDIA_FFMPEG;
const FP = FF.replace(/ffmpeg(\.exe)?$/i, (m, e) => 'ffprobe' + (e || ''));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trim-exact-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };

const A = path.join(dir, 'numbered.mp4');
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=1920x1080:r=30:d=10', '-f', 'lavfi', '-i', 'sine=d=10:r=48000',
  '-vf', "geq=lum='mod(N,256)':cb=128:cr=128", '-c:v', 'libx264', '-preset', 'veryfast', '-g', '60', '-keyint_min', '60', '-sc_threshold', '0', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', A]);
const mkv = path.join(dir, 'm.mkv'), B = path.join(dir, 'IMG_0002.MOV');
execFileSync(FF, ['-y', '-v', 'error', '-i', A, '-c', 'copy', '-avoid_negative_ts', 'make_zero', mkv]);
execFileSync(FF, ['-y', '-v', 'error', '-i', mkv, '-c', 'copy', '-f', 'mov', B]);
const starts = JSON.parse(execFileSync(FP, ['-v', 'error', '-show_entries', 'stream=codec_type,start_time', '-of', 'json', B]).toString()).streams;
console.log('B stream starts:', starts.map((s) => `${s.codec_type} ${s.start_time}`).join(', '));

const svc = await startLocalMediaService({ origin });
const b = await engine.launch();
try {
  for (const [label, src, firstFrame] of [['A numbered MP4', A, 30], ['B MOV, sound before picture', B, null]]) {
    const ctx = await b.newContext({ acceptDownloads: true });
    await svc.routeTickets(ctx);
    const before = svc.jobs.length;
    const p = await ctx.newPage();
    p.setDefaultTimeout(300000);
    await p.goto(`${origin}/tools/video-tools/video-trimmer`, { waitUntil: 'networkidle' });
    await p.locator('input[type=file]').setInputFiles(src);
    await p.waitForFunction(() => [...document.querySelectorAll('button')].some((x) => /^Trim Video \((?!0\.0s)/.test(x.textContent) && !x.disabled), null, { timeout: 120000 });
    await p.getByLabel(/Precise cut/).check();
    const setRange = (i, v) => p.locator('input[type=range]').nth(i).evaluate((e, val) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, val); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, String(v));
    await setRange(0, 1); await setRange(1, 5);
    await p.getByRole('button', { name: /^Trim Video \(4\.0s\)/ }).click();
    const dl = p.locator('a[download]').first();
    if (!(await dl.waitFor({ timeout: 600000 }).then(() => true, () => false))) {
      check(`${label}: a result`, false, (await p.locator('[role=alert]').allInnerTexts()).join(' | '));
      await ctx.close(); continue;
    }
    const [d] = await Promise.all([p.waitForEvent('download'), dl.click()]);
    const out = path.join(dir, `${label[0]}-${d.suggestedFilename()}`); await d.saveAs(out);
    const onService = svc.jobs.length > before;
    const j = JSON.parse(execFileSync(FP, ['-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,nb_read_frames,duration,start_time,r_frame_rate', '-of', 'json', out]).toString());
    const v = j.streams.find((s) => s.codec_type === 'video'), a = j.streams.find((s) => s.codec_type === 'audio');
    check(`${label} (${onService ? 'our service' : 'in the page'}): ${v.nb_read_frames} frames for 120, ${v.r_frame_rate} fps`, Number(v.nb_read_frames) === 120 && v.r_frame_rate === '30/1');
    check(`${label}: video ${Number(v.duration).toFixed(3)} s and sound ${a ? Number(a.duration).toFixed(3) : 'none'} s for 4 s, both from 0`,
      Math.abs(Number(v.duration) - 4) < 0.001 && !!a && Math.abs(Number(a.duration) - 4) < 0.022 && Number(v.start_time) === 0 && Number(a.start_time) === 0);
    if (firstFrame !== null) {
      const y = execFileSync(FF, ['-v', 'error', '-i', out, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-'], { maxBuffer: 1 << 26 }).subarray(0, 1920 * 1080);
      let s = 0; for (let i = 0; i < y.length; i += 97) s += y[i]; const level = s / Math.ceil(y.length / 97);
      check(`${label}: first frame is frame ${firstFrame} (1.00 s), grey level ${level.toFixed(1)}`, Math.abs(level - firstFrame) < 1.5);
    }
    await ctx.close();
  }
} finally {
  await b.close(); svc.stop();
}
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);

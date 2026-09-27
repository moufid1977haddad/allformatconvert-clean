// Video Trimmer, fast cut vs "Precise cut" (28/09/2026), real page. Source made here: 6 s, 25 fps, a keyframe every
// 2 s (like a phone video, only shorter), a 440 Hz tone. Cut 1.3 -> 3.7 s asked (2.4 s).
//  - precise: an MP4 of 2.4 s (+/- 0.08) whose FIRST frame is the source's frame at 1.3 s (PSNR against every
//    source frame from 0.5 to 2.5 s: the best match must be 1.3 s), sound present;
//  - fast: the same format as the source, starting on the keyframe at 0 s (the best match is 0.0 s) -- as announced.
// Usage: node scripts/browser-tests/video-trimmer-precise.mjs <origin> <ffmpeg> [--browser=firefox|webkit] [--hd]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const ffprobe = FF.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vtp-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };

const src = path.join(tmp, 'clip.mp4');
const HD = process.argv.includes('--hd'); // timing only: 1080p, 12 s, 10 s kept
const ODD = process.argv.includes('--odd'); // 641x361 source (4:4:4, which allows odd sizes): the precise MP4 must still be made
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', `testsrc2=size=${HD ? '1920x1080' : ODD ? '641x361' : '640x360'}:rate=25:duration=${HD ? 12 : 6}`, '-f', 'lavfi', '-i', `sine=d=${HD ? 12 : 6}`, '-c:v', 'libx264', '-g', '50', '-keyint_min', '50', '-sc_threshold', '0', '-pix_fmt', ODD ? 'yuv444p' : 'yuv420p', '-c:a', 'aac', '-shortest', src]);
const frameAt = (f, t, out) => execFileSync(FF, ['-y', '-v', 'error', '-ss', String(t), '-i', f, '-frames:v', '1', '-vf', 'scale=160:90', '-f', 'rawvideo', '-pix_fmt', 'gray', out]);
const psnr = (a, b) => { let e = 0; for (let i = 0; i < a.length; i++) e += (a[i] - b[i]) ** 2; e /= a.length; return e === 0 ? 99 : 10 * Math.log10(255 * 255 / e); };
const refs = []; for (let t = 0; t <= 2.5001; t += 0.04) { const o = path.join(tmp, `r${t.toFixed(2)}.raw`); frameAt(src, t.toFixed(2), o); refs.push([+t.toFixed(2), fs.readFileSync(o)]); }
const bestMatch = (f) => { const o = path.join(tmp, 'first.raw'); frameAt(f, 0, o); const x = fs.readFileSync(o); return refs.map(([t, r]) => [t, psnr(x, r)]).sort((a, b) => b[1] - a[1])[0]; };

const b = await engine.launch();
for (const precise of [false, true]) {
  const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  await p.goto(origin + '/tools/video-tools/video-trimmer', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(src);
  await p.locator('input[type=range]').first().waitFor({ timeout: 90000 });
  const setRange = (i, v) => p.locator('input[type=range]').nth(i).evaluate((el, v) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  await setRange(0, 1.3); await setRange(1, HD ? 11.3 : 3.7);
  if (precise) await p.getByLabel(/Precise cut/).check();
  const t0 = Date.now();
  await p.getByRole('button', { name: HD ? /Trim Video \(10\.0s\)/ : /Trim Video \(2\.4s\)/ }).click();
  const ok = await p.locator('a[download]').first().waitFor({ timeout: 1200000 }).then(() => true).catch(() => false);
  if (!ok) { check(`${precise ? 'precise' : 'fast'}: a result`, false, (await p.locator('[role=alert]').allTextContents()).join(' ')); await ctx.close(); continue; }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').first().click()]);
  const out = path.join(tmp, `${precise ? 'precise' : 'fast'}-${d.suggestedFilename()}`); await d.saveAs(out);
  const dur = Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString());
  const [t, q] = bestMatch(out);
  const vol = String(spawnSync(FF, ['-v', 'info', '-i', out, '-af', 'volumedetect', '-f', 'null', '-']).stderr).match(/mean_volume: (-?[\d.]+) dB/);
  if (precise) {
    check(`precise: ${d.suggestedFilename()} lasts ${dur.toFixed(2)} s for ${HD ? 10 : 2.4} s, first frame = source at ${t} s (PSNR ${q.toFixed(1)} dB), sound ${vol ? vol[1] + ' dB' : 'none'}, made in ${secs} s`, /\.mp4$/.test(out) && Math.abs(dur - (HD ? 10 : 2.4)) <= 0.08 && Math.abs(t - 1.3) <= 0.041 && q > 30 && !!vol);
  } else {
    check(`fast: ${d.suggestedFilename()} lasts ${dur.toFixed(2)} s, starts on the keyframe at ${t} s (as announced), made in ${secs} s`, /\.mp4$/.test(out) && Math.abs(t - 0) <= 0.041);
  }
  await ctx.close();
}
await b.close();
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);

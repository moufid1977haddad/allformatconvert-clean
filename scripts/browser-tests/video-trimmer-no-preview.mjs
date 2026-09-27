// Video Trimmer with containers the browser cannot preview (AVI and WMV in every browser; also MP4 under Playwright's
// WebKit on Windows, which has no video decoder): until 28/09/2026 the page only said the sliders were unavailable,
// although ffmpeg.wasm cuts these files without decoding them. Now ffmpeg.wasm reads the length and the cut runs.
// Output reopened here by ffprobe: same container, a video stream, the length asked (a copy cut starts on a
// keyframe: the sources are made with a keyframe every second, so 1 -> 3 s must give 2 s +/- 1 s).
// Usage: node scripts/browser-tests/video-trimmer-no-preview.mjs <origin> <ffmpeg> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const ffprobe = FF.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vtnp-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const lavfi = ['-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=25:duration=6', '-f', 'lavfi', '-i', 'sine=d=6'];
const SRC = {
  avi: ['-c:v', 'mpeg4', '-g', '25', '-c:a', 'mp3'],
  wmv: ['-c:v', 'wmv2', '-g', '25', '-c:a', 'wmav2'],
  mp4: ['-c:v', 'libx264', '-g', '25', '-pix_fmt', 'yuv420p', '-c:a', 'aac'],
};
const b = await engine.launch();
for (const [ext, args] of Object.entries(SRC)) {
  const f = path.join(tmp, `clip.${ext}`); execFileSync(FF, ['-y', '-v', 'error', ...lavfi, ...args, '-shortest', f]);
  const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  await p.goto(origin + '/tools/video-tools/video-trimmer', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(f);
  const ok = await p.locator('input[type=range]').first().waitFor({ timeout: 90000 }).then(() => true).catch(() => false);
  const said = (await p.locator('[role=status], [role=alert]').allTextContents()).join(' ');
  check(`.${ext}: start/end appear`, ok, said);
  if (!ok) { await ctx.close(); continue; }
  const setRange = (i, v) => p.locator('input[type=range]').nth(i).evaluate((el, v) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
  await setRange(0, 1); await setRange(1, 3);
  await p.getByRole('button', { name: /Trim/ }).first().click();
  const a = await p.locator('a[download]').first().waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  if (!a) { check(`.${ext}: trimmed`, false, (await p.locator('[role=alert]').allTextContents()).join(' ')); await ctx.close(); continue; }
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').first().click()]);
  const out = path.join(tmp, `${browserName}-${d.suggestedFilename()}`); await d.saveAs(out);
  const j = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', out]).toString());
  const dur = Number(j.format.duration);
  check(`.${ext}: ${d.suggestedFilename()} — video stream, ${dur.toFixed(2)} s for 2 s asked (copy cut: from the keyframe at or before the start, so up to +1 s here)`, path.extname(out) === '.' + ext && j.streams.some((s) => s.codec_type === 'video') && dur >= 1.9 && dur <= 3.1, j.format.format_name);
  await ctx.close();
}
await b.close();
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);

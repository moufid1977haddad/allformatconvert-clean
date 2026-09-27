// Audio Trimmer with formats the browser's own player cannot read (WMA and AC3 in every browser; everything in
// Playwright's WebKit on Windows, which has no audio playback): until 28/09/2026 the start/end controls never
// appeared and nothing was said, because the duration came only from the <audio> element. Now ffmpeg.wasm reads the
// duration, the page says there is no preview, and the trim runs. The output is reopened here by ffprobe.
// Usage: node scripts/browser-tests/audio-trimmer-no-preview.mjs <origin> <ffmpeg> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, ffmpeg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const ffprobe = ffmpeg.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atnp-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

const FF_ = ffmpeg;
const SRC = [['wma', ['-c:a', 'wmav2']], ['ac3', ['-c:a', 'ac3']], ['wav', ['-c:a', 'pcm_s16le']]].map(([ext, codec]) => {
  const f = path.join(tmp, `tone6.${ext}`);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6', ...codec, f]);
  return [ext, f];
});
{ // a WebM written to a pipe, like MediaRecorder's: no length in its header (the player says Infinity)
  const f = path.join(tmp, 'tone6-live.webm');
  const b = execFileSync(FF_, ['-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6', '-c:a', 'libopus', '-f', 'webm', 'pipe:1'], { maxBuffer: 1 << 26 });
  fs.writeFileSync(f, b); SRC.push(['webm', f]);
}
const dur = (f) => Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

const b = await engine.launch();
for (const [ext, f] of SRC) {
  const ctx = await b.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto(origin + '/tools/audio-tools/audio-trimmer', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(f);
  const ok = await p.locator('#at-end').waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
  const said = await p.locator('[role=status]').allTextContents();
  const canPlay = await p.evaluate((e) => document.createElement('audio').canPlayType({ wma: 'audio/x-ms-wma', ac3: 'audio/ac3', wav: 'audio/wav', webm: 'audio/webm' }[e]), ext);
  check(`${browserName} .${ext}: start/end controls appear, end = 6`, ok && (await p.locator('#at-end').inputValue()) === '6', `status ${JSON.stringify(said)} · canPlayType "${canPlay}"`);
  if (!ok) { await ctx.close(); continue; }
  const hasPlayer = (await p.locator('audio').count()) > 0;
  check(`${browserName} .${ext}: no preview -> said; preview -> a player`, hasPlayer || said.some((t) => /no preview/.test(t)), `player ${hasPlayer}`);
  await p.locator('#at-start').fill('1'); await p.locator('#at-end').fill('4.5');
  await p.getByRole('button', { name: 'Trim Audio' }).click();
  const a = await p.locator('a[download]').waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  if (!a) { check(`${browserName} .${ext}: trimmed`, false, (await p.locator('[role=alert]').allTextContents()).join(' ')); await ctx.close(); continue; }
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').click()]);
  const out = path.join(tmp, `${browserName}-${d.suggestedFilename()}`); await d.saveAs(out);
  const got = dur(out);
  check(`${browserName} .${ext}: ${d.suggestedFilename()} lasts ${got.toFixed(3)} s for 3.5 s`, path.extname(out) === '.' + ext && Math.abs(got - 3.5) < 0.1);
  await ctx.close();
}
await b.close();
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);

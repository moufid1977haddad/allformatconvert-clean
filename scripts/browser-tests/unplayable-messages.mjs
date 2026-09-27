// Media Player and Video Screenshot with a file the browser cannot play (AVI here; also WMA for the player):
// until 28/09/2026 the player showed a dead control and nothing else, and the screenshot tool said "wait for it to
// load" (it never would). Now each says the browser cannot play the format and points to the converter; a
// playable file (MP4, WAV) raises no message.
// Usage: node scripts/browser-tests/unplayable-messages.mjs <origin> <ffmpeg> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'unpl-'));
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const F = (n) => path.join(tmp, n);
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=25:duration=3', '-f', 'lavfi', '-i', 'sine=d=3', '-c:v', 'mpeg4', '-c:a', 'mp3', '-shortest', F('clip.avi')]);
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=25:duration=3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', F('clip.mp4')]);
execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=d=3', '-c:a', 'wmav2', F('tone.wma')]);

const b = await engine.launch();
async function said(tool, file) {
  const p = await b.newPage();
  await p.goto(origin + tool, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(file);
  await p.waitForTimeout(5000);
  const t = (await p.locator('[role=alert]').allTextContents()).join(' ').trim();
  await p.close();
  return t;
}
const canMp4 = await (async () => { const p = await b.newPage(); const r = await p.evaluate(() => document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"')); await p.close(); return r; })();
let t = await said('/tools/video-tools/media-player', F('clip.avi'));
check('media player, AVI: says it cannot play it, points to the converter', /cannot play this AVI/.test(t) && /Video Converter/.test(t), t.slice(0, 140));
t = await said('/tools/video-tools/media-player', F('tone.wma'));
check('media player, WMA: says it cannot play it, points to the audio converter', /cannot play this WMA/.test(t) && /Audio Converter/.test(t), t.slice(0, 140));
if (canMp4 && browserName !== 'webkit') { t = await said('/tools/video-tools/media-player', F('clip.mp4')); check('media player, MP4: plays, no message', t === '', t); }
else console.log('SKIP media player MP4: this engine cannot play H.264 (Playwright WebKit on Windows answers canPlayType but has no decoder)');
t = await said('/tools/video-tools/video-screenshot', F('clip.avi'));
check('video screenshot, AVI: says the format cannot be played (not "wait for it to load")', /cannot play this video's format/.test(t), t.slice(0, 140));
await b.close();
console.log(fails ? `${fails} FAILED (${browserName})` : `all passed (${browserName})`);
process.exit(fails ? 1 : 0);

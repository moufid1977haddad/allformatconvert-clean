// Audio and video tools, audit of 29/09 (second pass): each check states the CORRECT behaviour; run against the build
// before the fixes it shows the defects, after them it must pass. Inputs are WAV files written here sample by sample
// (exact, no encoder involved); outputs are read back from the page (canvas pixels) or decoded with a native ffmpeg.
// Usage: node scripts/browser-tests/av-audit-2.mjs <origin> [--browser=chromium|firefox] [--ffmpeg=<path>] [--only=<name>]
// (Playwright's WebKit on Windows has no AudioContext.)
import { chromium, firefox, webkit } from '@playwright/test';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const b = await ({ chromium, firefox, webkit })[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
let fails = 0, passes = 0;
const errors = [];
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
let page;
const open = async (p) => { page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`${p}: ${e.message}`)); await page.goto(origin + p, { waitUntil: 'networkidle' }); };
const T = async (n, fn) => { if (only && !n.startsWith(only)) return; try { await fn(); } catch (e) { fails++; console.log('FAIL', `${name} ${n}`, String(e.message).split('\n')[0].slice(0, 200)); } finally { if (page) await page.close().catch(() => {}); page = null; } };

// 16-bit PCM WAV from per-channel sample functions f(t) in [-1, 1].
function wav(seconds, rate, channels) {
  const n = Math.round(seconds * rate), c = channels.length;
  const buf = Buffer.alloc(44 + n * c * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * c * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(c, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * c * 2, 28); buf.writeUInt16LE(c * 2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * c * 2, 40);
  for (let i = 0; i < n; i++) channels.forEach((f, k) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f(i / rate) * 32767))), 44 + (i * c + k) * 2));
  return buf;
}

// Stereo: left silent, right a positive-only pulse train (0 .. +0.8), as a DC-offset or one-sided signal.
await T('audio-waveform', async () => {
  await open('/tools/audio-tools/audio-waveform');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'right-only.wav', mimeType: 'audio/wav', buffer: wav(1, 8000, [() => 0, (t) => ((t * 50) % 1 < 0.5 ? 0.8 : 0)]) });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const c = document.querySelector('canvas'); const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data;
    let up = 0, down = 0;
    for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) { const k = (y * c.width + i) * 4; if (d[k + 2] > 150 && d[k] < 160 && d[k + 1] < 160) { if (y < c.height / 2 - 2) up++; else if (y > c.height / 2 + 2) down++; } }
    return { up, down, h: c.height, w: c.width };
  });
  check('audio-waveform: a sound present only on the right channel is drawn (not a flat line)', r.up + r.down > r.w * 10, JSON.stringify(r));
  check('audio-waveform: positive samples are drawn above the centre line (not upside down)', r.up > 10 * Math.max(1, r.down), JSON.stringify(r));
});

// 440 Hz sine at amplitude 0.5, boosted 4x to WAV: without a limiter half the samples are cut flat at full scale.
const pcm16 = (buf) => { const i = buf.indexOf('data'); const n = buf.readUInt32LE(i + 4); const ch = buf.readUInt16LE(22); const out = []; for (let k = i + 8; k < i + 8 + n && k + 1 < buf.length; k += 2 * ch) out.push(buf.readInt16LE(k) / 32768); return out; };
await T('audio-booster', async () => {
  await open('/tools/audio-tools/audio-booster');
  const src = wav(1, 44100, [(t) => 0.5 * Math.sin(2 * Math.PI * 440 * t)]);
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'tone.wav', mimeType: 'audio/wav', buffer: src });
  await page.locator('input[type="range"]').first().fill('4');
  await page.locator('select').filter({ has: page.locator('option[value="wav"]') }).first().selectOption('wav');
  await page.getByRole('button', { name: 'Boost Audio' }).click();
  const href = await page.locator('a[download$=".wav"]').first().getAttribute('href', { timeout: 120000 });
  const out = Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href));
  const s = pcm16(out).slice(4410, -4410); // steady part
  const clipped = s.filter((v) => Math.abs(v) >= 0.999).length / s.length;
  const rms = Math.sqrt(s.reduce((a, v) => a + v * v, 0) / s.length), rms0 = 0.5 / Math.SQRT2;
  check('audio-booster: boosting a loud file does not cut the waveform flat (limiter, as mp3louder)', clipped < 0.001, `clipped samples ${(clipped * 100).toFixed(1)} %`);
  check('audio-booster: the result is still clearly louder (RMS x1.5 or more)', rms / rms0 > 1.5, `RMS x${(rms / rms0).toFixed(2)}`);
});

// Video Rotator / Filter / Resizer: a 3 s 320x240 clip (moving test pattern + tone); the visible player is paused for
// 1.5 s during processing. The output must contain the whole clip, its end included, and no long frozen stretch.
const FF = (process.argv.find((a) => a.startsWith('--ffmpeg=')) || '').slice(9);
if (FF) {
  const { execFileSync } = await import('node:child_process');
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'av2-'));
  const src = path.join(tmp, 'src.webm');
  execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=30:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:v', 'libvpx', '-b:v', '1M', '-c:a', 'libvorbis', '-shortest', src]);
  for (const [tool, button, pick] of [['video-rotator', 'Rotate Video'], ['video-filter', 'Apply Filter', 'Invert'], ['video-resizer', 'Resize Video']]) {
    await T(tool, async () => {
      await open(`/tools/video-tools/${tool}`);
      await page.locator('input[type="file"]').first().setInputFiles({ name: 'src.webm', mimeType: 'video/webm', buffer: fs.readFileSync(src) });
      await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2, null, { timeout: 20000 });
      if (pick) await page.getByRole('button', { name: pick, exact: true }).click();
      await page.getByRole('button', { name: button }).first().click();
      await page.waitForTimeout(1000);
      await page.evaluate(() => document.querySelector('video').pause());
      await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelector('video').play());
      const href = await page.locator('a[download^="rotated."], a[download^="filtered"], a[download^="resized"], a[download]').filter({ hasText: /Download/ }).first().getAttribute('href', { timeout: 30000 });
      const out = path.join(tmp, `${tool}.webm`);
      fs.writeFileSync(out, Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href)));
      // Distinct pictures in the last second of the source's timeline: one frame per 0.1 s, compared by MD5.
      const md5 = execFileSync(FF, ['-v', 'error', '-i', out, '-an', '-vf', 'fps=10', '-f', 'framemd5', '-'], { maxBuffer: 1 << 26 }).toString().split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(',').pop().trim());
      const lastSecond = md5.slice(-10);
      const distinct = new Set(lastSecond).size;
      let longestFreeze = 1, run = 1;
      for (let i = 1; i < md5.length; i++) { run = md5[i] === md5[i - 1] ? run + 1 : 1; longestFreeze = Math.max(longestFreeze, run); }
      check(`${tool}: paused 1.5 s during processing, the output still moves to the end (no frozen picture)`, distinct >= 6 && longestFreeze <= 4, `distinct pictures in last second ${distinct}/10, longest freeze ${longestFreeze / 10} s, pictures ${md5.length}`);
    });
  }
}

// Video Watermark on a phone-style clip: black 320x240 H.264 whose display matrix says "rotate 90" (shown 240x320).
// Watermark "WM" bottom-right. The output, as a player shows it, must be 240x320 with the mark at the bottom right.
if (FF) await T('video-watermark', async () => {
  const { execFileSync } = await import('node:child_process');
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'av2wm-'));
  const plain = path.join(tmp, 'plain.mp4'), rot = path.join(tmp, 'rot.mp4');
  execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=black:size=320x240:rate=25:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', plain]);
  execFileSync(FF, ['-y', '-v', 'error', '-display_rotation', '90', '-i', plain, '-c', 'copy', rot]);
  await open('/tools/video-tools/video-watermark');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'phone.mp4', mimeType: 'video/mp4', buffer: fs.readFileSync(rot) });
  await page.waitForTimeout(1500);
  await page.locator('input[type="text"]:visible').last().fill('WM');
  await page.locator('input[type="range"]').first().fill('1');
  await page.getByRole('button', { name: 'bottom-right', exact: true }).click();
  await page.getByRole('button', { name: 'Add Watermark' }).click();
  const href = await page.locator('a[download$="-watermarked.mp4"]').first().getAttribute('href', { timeout: 180000 });
  const out = path.join(tmp, 'out.mp4');
  fs.writeFileSync(out, Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href)));
  // One frame as a player shows it (ffmpeg applies the display matrix by default), gray.
  const probe = JSON.parse(execFileSync(FF.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1'), ['-v', 'error', '-show_entries', 'stream=width,height:stream_side_data=rotation', '-of', 'json', out]).toString()).streams[0];
  const rotation = (probe.side_data_list || []).map((d) => d.rotation).find((r) => r !== undefined) || 0;
  const shownW = Math.abs(rotation) % 180 === 90 ? probe.height : probe.width, shownH = Math.abs(rotation) % 180 === 90 ? probe.width : probe.height;
  const g = execFileSync(FF, ['-v', 'error', '-i', out, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 24 });
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < shownH; y++) for (let x = 0; x < shownW; x++) if (g[y * shownW + x] > 128) { sx += x; sy += y; n++; }
  check('video-watermark: a phone video (rotation tag) keeps its shown size, 240x320, not turned twice', shownW === 240 && shownH === 320, `stored ${probe.width}x${probe.height}, rotation ${rotation}, shown ${shownW}x${shownH}`);
  check('video-watermark: the mark is at the bottom right of the picture as shown', n > 20 && sx / n > shownW * 0.6 && sy / n > shownH * 0.75, `white pixels ${n}, centre ${(sx / Math.max(n, 1)).toFixed(0)},${(sy / Math.max(n, 1)).toFixed(0)}`);
});

// The same text mark on WHITE footage must still be visible (dark pixels where the mark is).
if (FF) await T('video-watermark-white', async () => {
  const { execFileSync } = await import('node:child_process');
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'av2wmw-'));
  const src = path.join(tmp, 'white.mp4');
  execFileSync(FF, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=white:size=320x240:rate=25:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', src]);
  await open('/tools/video-tools/video-watermark');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'white.mp4', mimeType: 'video/mp4', buffer: fs.readFileSync(src) });
  await page.waitForTimeout(1500);
  await page.locator('input[type="text"]:visible').last().fill('WM');
  await page.getByRole('button', { name: 'Add Watermark' }).click();
  const href = await page.locator('a[download$="-watermarked.mp4"]').first().getAttribute('href', { timeout: 180000 });
  const out = path.join(tmp, 'out.mp4');
  fs.writeFileSync(out, Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href)));
  const g = execFileSync(FF, ['-v', 'error', '-i', out, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { maxBuffer: 1 << 24 });
  const dark = [...g].filter((v) => v < 128).length;
  check('video-watermark: a text mark stays visible on white footage (outlined)', dark > 20, `dark pixels ${dark}`);
});

// Screen Recorder: while recording, the live preview shows the captured screen (Chromium's fake capture picker).
if (name === 'chromium') await T('screen-recorder', async () => {
  const sb = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--auto-select-desktop-capture-source=Entire screen', '--auto-accept-this-tab-capture'] });
  try {
    const p = await (await sb.newContext()).newPage();
    await p.goto(origin + '/tools/video-tools/screen-recorder', { waitUntil: 'networkidle' });
    await p.getByRole('button', { name: 'Start Recording' }).click();
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => { const v = document.querySelector('video'); return v ? { attached: !!v.srcObject, w: v.videoWidth } : null; });
    const err = await p.locator('p.text-red-500, [role="alert"]').allInnerTexts().catch(() => []);
    if (r === null && err.length) { console.log('SKIP screen-recorder: capture not available here:', err.join(' ')); return; }
    check('screen-recorder: the live preview shows the screen being recorded', r && r.attached && r.w > 0, JSON.stringify(r));
    await p.getByRole('button', { name: 'Stop Recording' }).click().catch(() => {});
  } finally { await sb.close(); }
});

console.log(`\n${name}: ${passes} passed, ${fails} failed`);
if (errors.length) console.log('page errors:', errors.join('\n'));
await b.close();
process.exit(fails ? 1 : 0);

// P21 phase 3 (02/10): the audio formats added to the audio tools (M4R, M4B, MP2, WV, CAF, AU, MKA), made by the REAL
// Audio Converter page (ffmpeg.wasm in the browser) from a 6-second stereo WAV, then read back by the native ffprobe:
// right container and codec, 2 channels, duration 6 s ± 0.1, file named with the right extension.
// Usage: node scripts/browser-tests/p21-audio-formats.mjs <origin> <path to ffprobe> [--browser=chromium|firefox|webkit]
//        [--formats=m4r,mp2] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FFPROBE] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[name];
const only = (process.argv.find((a) => a.startsWith('--formats=')) || '').slice(10).split(',').filter(Boolean);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p21-audio-'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };

// 6 s stereo 44.1 kHz 16-bit WAV: 440 Hz left, 660 Hz right
const sr = 44100, secs = 6, n = sr * secs;
const wav = Buffer.alloc(44 + n * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 4, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(sr, 24); wav.writeUInt32LE(sr * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) { wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / sr) * 12000), 44 + i * 4); wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 660 * i / sr) * 12000), 46 + i * 4); }
const wavPath = path.join(tmp, 'tone.wav'); fs.writeFileSync(wavPath, wav);

const EXPECT = {
  m4r: { format: /mp4|mov|ipod/, codec: 'aac' }, m4b: { format: /mp4|mov|ipod/, codec: 'aac' }, mp2: { format: /mp2|mp3/, codec: 'mp2' },
  wv: { format: /wv/, codec: 'wavpack' }, caf: { format: /caf/, codec: 'pcm_s16le' }, au: { format: /au/, codec: 'pcm_s16be' },
  mka: { format: /matroska/, codec: 'flac' },
};
const b = await engine.launch();
for (const [fmt, exp] of Object.entries(EXPECT)) {
  if (only.length && !only.includes(fmt)) continue;
  const ctx = await b.newContext({ acceptDownloads: true });
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${origin}/tools/audio-tools/audio-converter`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(wavPath);
  await p.locator('select').first().selectOption(fmt);
  await p.getByRole('button', { name: /^Convert/ }).click();
  const row = p.locator('[data-file-download]').first();
  const ok = await row.waitFor({ timeout: 180000 }).then(() => true, () => false);
  if (!ok) { check(`${fmt}: a result`, false, (await p.locator('[role=alert], .text-red-500, .text-red-400').allInnerTexts()).join(' ') + errors.join(' | ')); await ctx.close(); continue; }
  const [dl] = await Promise.all([p.waitForEvent('download'), row.locator('a[data-download]').click()]);
  const out = path.join(tmp, dl.suggestedFilename()); await dl.saveAs(out);
  let info;
  try { info = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', out]).toString()); }
  catch (e) { check(`${fmt}: ffprobe reads the file`, false, String(e.stderr || e)); await ctx.close(); continue; }
  const s = info.streams.find((x) => x.codec_type === 'audio') || {};
  const dur = Number(info.format.duration || s.duration);
  check(`${fmt}: "${path.basename(out)}" is ${exp.codec} in ${info.format.format_name}, ${s.channels} ch, ${dur.toFixed(2)} s`,
    path.extname(out) === '.' + fmt && exp.format.test(info.format.format_name) && s.codec_name === exp.codec && s.channels === 2 && Math.abs(dur - secs) < 0.1 && !errors.length,
    errors.join(' | '));
  await ctx.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);

// Audit of the tools that cut or copy audio without re-encoding, measured like Audio Merger
// (docs/audit/RAPPORT-audio-merger-format-sortie.md): real pages, results decoded here by a native ffmpeg.
//  - Audio Trimmer, stream-copy path (MP3, M4A, OGG, Opus without a fade): cut 1.3 -> 4.7 s asked; where the kept
//    audio really starts and ends in the source (located by cross-correlation on white noise), its length.
//  - Audio Splitter, each format split into the same format at 4 s: part lengths, where part 2 really starts in the
//    source, and the gap (+) or overlap (-) between the end of part 1 and the start of part 2.
//  - every result is played to the end by the browser that made it (<audio>: duration, `ended`), when it can play it.
// Usage: node scripts/browser-tests/cut-join-audit.mjs <origin> <ffmpeg> [--browser=firefox|webkit] [--only=trimmer]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cutjoin-'));
const R = 44100;
const ff = (args) => execFileSync(FF, ['-v', 'error', ...args], { maxBuffer: 1 << 28 });
const pcm = (f) => { const b = ff(['-i', f, '-map', '0:a', '-ac', '1', '-ar', String(R), '-f', 's16le', '-']); return new Int16Array(b.buffer, b.byteOffset, b.length / 2); };

// 10 s of seeded white noise (every position unique), 44.1 kHz stereo 16-bit
const noise = crypto.randomBytes(10 * R * 2); const rnd = (i) => noise.readInt16LE(i * 2) / 32768; // not a short LCG: its cycle made the search lock on a copy
const N = 10 * R; const src = Buffer.alloc(44 + N * 4);
src.write('RIFF', 0); src.writeUInt32LE(36 + N * 4, 4); src.write('WAVEfmt ', 8); src.writeUInt32LE(16, 16); src.writeUInt16LE(1, 20); src.writeUInt16LE(2, 22);
src.writeUInt32LE(R, 24); src.writeUInt32LE(R * 4, 28); src.writeUInt16LE(4, 32); src.writeUInt16LE(16, 34); src.write('data', 36); src.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { const v = Math.round(rnd(i) * 8000); src.writeInt16LE(v, 44 + i * 4); src.writeInt16LE(v, 46 + i * 4); }
const wav = path.join(tmp, 'noise.wav'); fs.writeFileSync(wav, src);
const ENC = { wav: [], mp3: ['-c:a', 'libmp3lame', '-b:a', '192k'], m4a: ['-c:a', 'aac', '-b:a', '192k'], ogg: ['-c:a', 'libvorbis', '-q:a', '6'], opus: ['-c:a', 'libopus', '-b:a', '128k'], flac: ['-c:a', 'flac'], wma: ['-c:a', 'wmav2', '-b:a', '192k'] };
const SRC = {}; for (const [ext, a] of Object.entries(ENC)) { SRC[ext] = path.join(tmp, `noise.${ext}`); if (ext === 'wav') fs.copyFileSync(wav, SRC[ext]); else ff(['-y', '-i', wav, ...a, SRC[ext]]); }
const ref = pcm(wav); // the source as heard

// Where does `x` (from sample `from`, `len` samples) sit in the reference, searched around `near` (samples)?
function locate(x, from, len, near, span = Math.round(0.25 * R)) {
  let best = -1, at = null;
  const xs = x.subarray(from, from + len); let xx = 0; for (const v of xs) xx += v * v;
  for (let o = Math.max(0, near - span); o <= Math.min(ref.length - len, near + span); o++) {
    let xy = 0, yy = 0; for (let i = 0; i < len; i++) { const y = ref[o + i]; xy += xs[i] * y; yy += y * y; }
    const c = xy / Math.sqrt(xx * yy + 1e-9); if (c > best) { best = c; at = o; }
  }
  return { at, corr: best };
}
const ms = (samples) => +((samples / R) * 1000).toFixed(1);

const b = await engine.launch(engine === firefox ? { firefoxUserPrefs: { 'media.autoplay.default': 0 } } : {});
const rows = [];
async function playToEnd(p) {
  return p.evaluate(async () => {
    const a = [...document.querySelectorAll('audio')].pop(); if (!a) return null;
    a.muted = true; a.playbackRate = 4;
    await new Promise((r) => { if (a.readyState >= 1) r(); else { a.onloadedmetadata = r; a.onerror = r; setTimeout(r, 8000); } });
    if (a.error || !Number.isFinite(a.duration)) return { playable: false };
    const ended = await new Promise((r) => { a.onended = () => r(true); setTimeout(() => r(false), 20000); a.play().catch(() => r(false)); });
    return { playable: true, dur: +a.duration.toFixed(3), ended };
  }).catch(() => null);
}
async function saveAll(p) {
  const out = [];
  for (const a of await p.locator('a[download]').all()) { const [d] = await Promise.all([p.waitForEvent('download'), a.click()]); const f = path.join(tmp, `${browserName}-${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(f); out.push(f); }
  return out;
}

if (!only || only === 'trimmer') for (const ext of ['mp3', 'm4a', 'ogg', 'opus']) {
  const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  await p.goto(origin + '/tools/audio-tools/audio-trimmer', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(SRC[ext]);
  await p.locator('#at-end').waitFor({ timeout: 60000 });
  await p.locator('#at-start').fill('1.3'); await p.locator('#at-end').fill('4.7');
  await p.getByRole('button', { name: 'Trim Audio' }).click(); await p.locator('a[download]').waitFor({ timeout: 120000 });
  const play = await playToEnd(p);
  const [f] = await saveAll(p);
  const x = pcm(f); const s = locate(x, Math.round(0.1 * R), Math.round(0.05 * R), Math.round(1.4 * R)); const e = locate(x, x.length - Math.round(0.15 * R), Math.round(0.05 * R), Math.round(4.55 * R));
  const startAt = s.at - Math.round(0.1 * R), endAt = e.at + Math.round(0.15 * R);
  rows.push({ tool: 'audio-trimmer (copy)', case: `${ext} 1.3 -> 4.7`, file: path.basename(f).replace(/^.*?-\d+-/, ''), length_s: +(x.length / R).toFixed(3), start_err_ms: ms(startAt - Math.round(1.3 * R)), end_err_ms: ms(endAt - Math.round(4.7 * R)), corr: +Math.min(s.corr, e.corr).toFixed(3), play });
  await ctx.close();
}

if (!only || only === 'splitter') for (const ext of ['wav', 'mp3', 'flac', 'm4a', 'ogg', 'wma']) {
  const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage();
  await p.goto(origin + '/tools/audio-tools/audio-splitter', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(SRC[ext]);
  const ok = await p.locator('input[type=range]').waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
  if (!ok) { rows.push({ tool: 'audio-splitter', case: `${ext} at 4 s`, error: 'no split control (duration not read)' }); await ctx.close(); continue; }
  await p.locator('#split-at').fill('4');
  await p.locator('select:not(.goog-te-combo)').selectOption(ext === 'm4a' ? 'm4a' : ext);
  await p.getByRole('button', { name: /Split/ }).click();
  const done = await p.locator('a[download]').nth(1).waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  if (!done) { rows.push({ tool: 'audio-splitter', case: `${ext} at 4 s`, error: (await p.locator('[role=alert], .text-red-600').allTextContents()).join(' ') || 'no parts' }); await ctx.close(); continue; }
  const play = await playToEnd(p);
  const [f1, f2] = await saveAll(p);
  const x1 = pcm(f1), x2 = pcm(f2);
  const e1 = locate(x1, x1.length - Math.round(0.15 * R), Math.round(0.05 * R), Math.round(3.85 * R)); const end1 = e1.at + Math.round(0.15 * R);
  const s2 = locate(x2, Math.round(0.1 * R), Math.round(0.05 * R), Math.round(4.1 * R)); const start2 = s2.at - Math.round(0.1 * R);
  rows.push({ tool: 'audio-splitter', case: `${ext} -> ${ext} at 4 s`, part1_s: +(x1.length / R).toFixed(3), part2_s: +(x2.length / R).toFixed(3), sum_s: +((x1.length + x2.length) / R).toFixed(3), part1_end_err_ms: ms(end1 - 4 * R), part2_start_err_ms: ms(start2 - 4 * R), gap_ms: ms(start2 - end1), corr: +Math.min(e1.corr, s2.corr).toFixed(3), play_last_part: play });
  await ctx.close();
}
await b.close();
for (const r of rows) console.log(JSON.stringify(r));
fs.writeFileSync(path.join(os.tmpdir(), `cut-join-audit-${browserName}.json`), JSON.stringify(rows, null, 1));

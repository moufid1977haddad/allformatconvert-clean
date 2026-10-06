// P37 lot 1, bug 6, proof in the real page: Audio Converter (ffmpeg.wasm in the browser) writes AC3 and MP2 at the
// bitrate chosen in "Quality" (128 kbps was written at 192 before P37). The bitrate is read from the files' own frame
// headers (no ffprobe needed): AC-3 frmsizecod (ATSC A/52 table), MPEG-1 Layer II bitrate index (ISO 11172-3).
// Nothing is sent to the media service (AC3 and MP2 are made in the browser; any /media request is refused here).
// Usage: node scripts/p37/audio-bitrate-browser.mjs <origin, e.g. http://localhost:3000> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const entry = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!entry) { console.error('usage: node scripts/p37/audio-bitrate-browser.mjs <origin> [--browser=chromium]'); process.exit(2); }
const origin = new URL(entry).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[name];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p37-bitrate-'));
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };

// 4 s stereo 48 kHz 16-bit WAV
const sr = 48000, secs = 4, n = sr * secs;
const wav = Buffer.alloc(44 + n * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 4, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(sr, 24); wav.writeUInt32LE(sr * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) { wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / sr) * 12000), 44 + i * 4); wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 660 * i / sr) * 12000), 46 + i * 4); }
const wavPath = path.join(tmp, 'tone.wav'); fs.writeFileSync(wavPath, wav);

const AC3_TABLE = [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 448, 512, 576, 640];
const MP2_TABLE = [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384];
function headerKbps(fmt, b) {
  if (fmt === 'ac3') { const i = b.indexOf(Buffer.from([0x0b, 0x77])); return i < 0 ? null : AC3_TABLE[(b[i + 4] & 0x3f) >> 1]; }
  let i = 0;
  if (b.toString('latin1', 0, 3) === 'ID3') i = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]);
  for (; i < b.length - 3; i++) if (b[i] === 0xff && (b[i + 1] & 0xfe) === 0xfc) return MP2_TABLE[b[i + 2] >> 4]; // MPEG-1, Layer II
  return null;
}

const b = await engine.launch();
for (const fmt of ['ac3', 'mp2']) {
  for (const kbps of [128, 192, 256]) {
    const ctx = await b.newContext({ acceptDownloads: true });
    await ctx.route(/vercel\.live/, (r) => r.abort());
    await ctx.route(/\/(media|jobs|upload)\b/, (r) => r.fulfill({ status: 503, body: 'no media service in this test' }));
    const p = await ctx.newPage();
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(`${origin}/tools/audio-tools/audio-converter`, { waitUntil: 'load' });
    await p.waitForTimeout(1000);
    await p.locator('input[type=file]').first().setInputFiles(wavPath);
    await p.locator('select').first().selectOption(fmt);
    await p.getByLabel('Quality').selectOption(String(kbps));
    await p.getByRole('button', { name: /^Convert/ }).click();
    const row = p.locator('[data-file-download]').first();
    const ok = await row.waitFor({ timeout: 180000 }).then(() => true, () => false);
    if (!ok) { check(`${fmt} ${kbps}k: a result`, false, (await p.locator('[role=alert], .text-red-500, .text-red-400').allInnerTexts()).join(' ') + errors.join(' | ')); await ctx.close(); continue; }
    const [dl] = await Promise.all([p.waitForEvent('download'), row.locator('a[data-download]').click()]);
    const out = path.join(tmp, `${kbps}-${dl.suggestedFilename()}`); await dl.saveAs(out);
    const got = headerKbps(fmt, fs.readFileSync(out));
    check(`${fmt.toUpperCase()} "Quality" ${kbps} kbps: frame header says ${got} kbps`, got === kbps && !errors.length, errors.join(' | '));
    await ctx.close();
  }
}
await b.close();
console.log(`\n${fails ? `${fails} FAIL` : 'all PASS'} (${name})`);
process.exitCode = fails ? 1 : 0;

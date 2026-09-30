// Audio Splitter, P19 (01/10): the split point defaults to the MIDDLE of the file (it was 30 s clamped to the end:
// 5.9 s of a 6 s file, a 0.1 s part 2), and two modes of the split tools of the market were added — equal parts
// (NoteVibes, ChunkAudio) and a piece every N seconds (ChunkAudio). Each part is checked in the WAV that comes out:
// its length in samples, and the parts put back together are the source, sample for sample.
// Usage: node scripts/browser-tests/audio-splitter-modes.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };

// 6.000 s of 16-bit mono at 8 kHz: a ramp that never repeats, so any lost or doubled sample shows
const R = 8000, N = 6 * R;
const src = new Int16Array(N); for (let i = 0; i < N; i++) src[i] = ((i * 37) % 60000) - 30000;
function wav(samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(R, 24); b.writeUInt32LE(R * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40); Buffer.from(samples.buffer).copy(b, 44);
  return b;
}
function pcmOf(buf) { // the data chunk of a WAV, wherever it is (ffmpeg may add a LIST chunk)
  let o = 12;
  while (o < buf.length - 8) { const id = buf.toString('ascii', o, o + 4), len = buf.readUInt32LE(o + 4); if (id === 'data') return new Int16Array(buf.buffer.slice(buf.byteOffset + o + 8, buf.byteOffset + o + 8 + len)); o += 8 + len + (len % 2); }
  return new Int16Array(0);
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'splitter-'));
const SRC = path.join(dir, 'tone.wav'); fs.writeFileSync(SRC, wav(src));

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);

async function run(label, setup, expectSeconds) {
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  try {
    await p.goto(`${origin}/tools/audio-tools/audio-splitter`, { waitUntil: 'load', timeout: 60000 });
    await p.locator('input[type=file]').setInputFiles(SRC);
    await p.locator('#split-at').waitFor({ timeout: 60000 });
    const def = await p.locator('#split-at').inputValue();
    if (label === 'default') check('default split point = the middle of the file (3 s of 6 s)', def === '3', `split point ${def}`);
    await setup(p);
    const plan = await p.locator('[data-split-plan]').innerText();
    check(`${label}: the page lists ${expectSeconds.length} parts before splitting`, plan.startsWith(`${expectSeconds.length} parts`), plan);
    await p.getByRole('button', { name: 'Split Audio' }).click();
    await p.locator('[data-file-download]').nth(expectSeconds.length - 1).waitFor({ timeout: 120000 });
    await p.waitForTimeout(500);
    const rows = await p.locator('[data-file-download]').count();
    const files = [];
    for (let i = 0; i < rows; i++) {
      const row = p.locator('[data-file-download]').nth(i);
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), row.locator('a[data-download]').click()]);
      files.push({ name: dl.suggestedFilename(), pcm: pcmOf(fs.readFileSync(await dl.path())) });
    }
    const got = files.map((f) => +(f.pcm.length / R).toFixed(3));
    check(`${label}: ${expectSeconds.length} WAV parts of ${expectSeconds.join(' / ')} s`, rows === expectSeconds.length && got.every((s, i) => Math.abs(s - expectSeconds[i]) <= 0.001), `${rows} parts: ${got.join(' / ')} s`);
    const joined = new Int16Array(files.reduce((n, f) => n + f.pcm.length, 0)); let o = 0; for (const f of files) { joined.set(f.pcm, o); o += f.pcm.length; }
    check(`${label}: the parts put back together are the source, sample for sample`, joined.length === N && joined.every((v, i) => v === src[i]), `${joined.length} samples of ${N}`);
    const width = String(expectSeconds.length).length;
    check(`${label}: names part${'1'.padStart(width, '0')}_tone.wav … in order`, files.every((f, i) => f.name === `part${String(i + 1).padStart(width, '0')}_tone.wav`), files.map((f) => f.name).join(', '));
    check(`${label}: no page error`, errors.length === 0, errors.join(' | '));
  } catch (e) { check(`${label}: split done`, false, String(e.message).split('\n')[0].slice(0, 200)); }
  await p.close().catch(() => {});
}

await run('default', async () => {}, [3, 3]);
await run('equal parts x4', async (p) => { await p.getByRole('radio', { name: 'Equal parts' }).click(); await p.locator('#split-parts').fill('4'); }, [1.5, 1.5, 1.5, 1.5]);
await run('equal parts x12', async (p) => { await p.getByRole('radio', { name: 'Equal parts' }).click(); await p.locator('#split-parts').fill('12'); }, Array(12).fill(0.5));
await run('every 2.5 s', async (p) => { await p.getByRole('radio', { name: 'Every N seconds' }).click(); await p.locator('#split-every').fill('2.5'); }, [2.5, 2.5, 1]);
{ // too many parts: said before, button disabled
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/audio-tools/audio-splitter`, { waitUntil: 'load', timeout: 60000 });
  await p.locator('input[type=file]').setInputFiles(SRC);
  await p.locator('#split-at').waitFor({ timeout: 60000 });
  await p.getByRole('radio', { name: 'Every N seconds' }).click(); await p.locator('#split-every').fill('0.05');
  const plan = await p.locator('[data-split-plan]').innerText();
  check('every 0.1 s on 6 s (60 parts) is allowed; 0.05 is raised to the 0.1 s minimum', /^60 parts/.test(plan), plan);
  await p.close();
}
await b.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);

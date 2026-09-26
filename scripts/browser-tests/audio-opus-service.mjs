// Opus of Audio Booster, Audio Splitter and Audio Compressor sent to the media service (libopus), real pages, with
// the service PLAYED BY THIS TEST (routes intercepted): what it proves is the wiring -- the tool's own processing is
// done in the browser, the service receives a lossless FLAC of exactly that, with the right parameters, and the file
// it returns is what the visitor downloads. libopus's quality itself was settled on 24/09 (Zimtohrli, 6/6) and the
// real encode is covered by services/media-processing/tests (run_kbps_unit.py here; run_tests.py where ffmpeg is).
// Needs a build made with a test service URL (never a real one, no env file involved):
//   NEXT_PUBLIC_MEDIA_SERVICE_URL=https://media.test.invalid npm run build && npx next start -p 3100
// Usage: node scripts/browser-tests/audio-opus-service.mjs <origin> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const SERVICE = 'https://media.test.invalid';
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

// 4 s, 44.1 kHz stereo 16-bit WAV: a 440 Hz tone at 1/8 of full scale (so a 2x boost does not clip)
function wav(seconds = 4, rate = 44100) {
  const n = seconds * rate; const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { const v = Math.round(4096 * Math.sin((2 * Math.PI * 440 * i) / rate)); b.writeInt16LE(v, 44 + i * 4); b.writeInt16LE(v, 46 + i * 4); }
  return b;
}
// FLAC STREAMINFO: sample rate (20 bits at byte 18) and total samples (36 bits from byte 21)
function flacInfo(u8) {
  if (Buffer.from(u8.subarray(0, 4)).toString('latin1') !== 'fLaC') return null;
  const rate = (u8[18] << 12) | (u8[19] << 4) | (u8[20] >> 4);
  const total = (u8[21] & 0x0f) * 2 ** 32 + ((u8[22] << 24) >>> 0) + (u8[23] << 16) + (u8[24] << 8) + u8[25];
  return { rate, seconds: total / rate };
}
const input = path.join(os.tmpdir(), 'opus-service-tone.wav'); fs.writeFileSync(input, wav());
const OPUS_BACK = Buffer.concat([Buffer.from('OggS'), Buffer.alloc(2044, 7)]); // what "the service" returns

const b = await engine.launch(); const ctx = await b.newContext({ acceptDownloads: true });
let jobs = [];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
await ctx.route('**/api/media/ticket', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jid: 'j' + (jobs.length + 1), ticket: 'test-ticket' }) }));
await ctx.route(SERVICE + '/**', async (r) => {
  const req = r.request(); const u = new URL(req.url()); const m = req.method();
  if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const json = (status, o) => r.fulfill({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
  if (m === 'POST' && u.pathname === '/v1/jobs') { const body = req.postDataJSON(); jobs.push({ ...body, chunks: [] }); return json(201, { chunkBytes: 1 << 20, totalChunks: Math.ceil(body.size / (1 << 20)) }); }
  const job = jobs.at(-1);
  if (m === 'PUT' && /\/chunks\/\d+$/.test(u.pathname)) { job.chunks.push(req.postDataBuffer()); return json(200, {}); }
  if (m === 'POST' && u.pathname.endsWith('/start')) return json(202, {});
  if (m === 'GET' && u.pathname.endsWith('/result')) return r.fulfill({ status: 200, headers: { ...cors, 'Content-Type': 'audio/ogg' }, body: OPUS_BACK });
  if (m === 'GET') return json(200, { status: 'done', outputExt: 'opus', outputBytes: OPUS_BACK.length });
  if (m === 'DELETE') return json(200, {});
  return json(404, {});
});
const sent = (j) => new Uint8Array(Buffer.concat(j.chunks));
async function open(tool) {
  const p = await ctx.newPage(); jobs = [];
  await p.goto(`${origin}/tools/audio-tools/${tool}`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(input);
  return p;
}
async function downloads(p, n) { const out = []; for (const a of await p.locator('a[download]').all()) { const [d] = await Promise.all([p.waitForEvent('download'), a.click()]); out.push({ name: d.suggestedFilename(), bytes: fs.readFileSync(await d.path()) }); } return out.slice(0, n); }

{ // Audio Booster, 2x, Opus
  const p = await open('audio-booster');
  await p.locator('main select, select.w-full').first().selectOption('opus');
  await p.getByRole('button', { name: 'Boost Audio' }).click();
  await p.locator('a[download]').waitFor({ timeout: 120000 });
  const f = flacInfo(sent(jobs[0])); const [d] = await downloads(p, 1);
  check('booster: one job, FLAC of the whole 4 s sent, params {target: opus, quality: medium}', jobs.length === 1 && f && Math.abs(f.seconds - 4) < 0.05 && JSON.stringify(jobs[0].params) === '{"target":"opus","quality":"medium"}', JSON.stringify({ jobs: jobs.length, flac: f, params: jobs[0]?.params }));
  check('booster: the service\'s Opus is what is downloaded, named boosted_….opus', d && d.name === 'boosted_opus-service-tone.opus' && d.bytes.equals(OPUS_BACK), d?.name);
  await p.locator('main select, select.w-full').first().selectOption('mp3'); jobs = [];
  await p.getByRole('button', { name: 'Boost Audio' }).click(); await p.waitForTimeout(500);
  await p.waitForFunction(() => !document.body.innerText.includes('Boosting...'), null, { timeout: 120000 });
  check('booster: MP3 still made in the browser, no job sent', jobs.length === 0, `${jobs.length} jobs`);
  await p.close();
}
{ // Audio Splitter: 4 s split at 3 s (the page's default for a 4 s file), Opus
  const p = await open('audio-splitter');
  await p.locator('main select, select.w-full').first().selectOption('opus');
  await p.waitForFunction(() => document.querySelector('input[type=range]')?.max === '3');
  await p.getByRole('button', { name: /Split/ }).click();
  await p.locator('a[download]').nth(1).waitFor({ timeout: 120000 });
  const f = jobs.map((j) => flacInfo(sent(j))); const ds = await downloads(p, 2);
  check('splitter: two jobs, FLACs of 3 s and 1 s, both Opus at the default', jobs.length === 2 && Math.abs(f[0]?.seconds - 3) < 0.05 && Math.abs(f[1]?.seconds - 1) < 0.05 && jobs.every((j) => j.params.target === 'opus' && j.params.kbps === undefined), JSON.stringify(f));
  check('splitter: part1_/part2_….opus downloaded, the service\'s bytes', ds.map((d) => d.name).join() === 'part1_opus-service-tone.opus,part2_opus-service-tone.opus' && ds.every((d) => d.bytes.equals(OPUS_BACK)), ds.map((d) => d.name).join());
  await p.close();
}
{ // Audio Compressor, 64 kbit/s, Opus
  const p = await open('audio-compressor');
  await p.getByRole('button', { name: '64k', exact: true }).click();
  await p.locator('main select, select.w-full').first().selectOption('opus');
  await p.getByRole('button', { name: /Compress/ }).click();
  await p.locator('a[download]').waitFor({ timeout: 120000 });
  const f = flacInfo(sent(jobs[0])); const [d] = await downloads(p, 1);
  check('compressor: FLAC of 4 s sent with kbps 64 (the bitrate picked)', jobs.length === 1 && f && Math.abs(f.seconds - 4) < 0.05 && jobs[0].params.kbps === 64 && jobs[0].params.target === 'opus', JSON.stringify({ flac: f, params: jobs[0]?.params }));
  check('compressor: the service\'s Opus is downloaded', d && d.name.endsWith('.opus') && d.bytes.equals(OPUS_BACK), d?.name);
  await p.close();
}
{ // Audio Converter (already on the service since 23/09): same download naming, fixed at the same time
  const p = await open('audio-converter');
  await p.locator('main select, select.w-full').first().selectOption('opus');
  await p.getByRole('button', { name: /Convert/ }).first().click();
  await p.locator('a[download]').waitFor({ timeout: 120000 });
  const [d] = await downloads(p, 1);
  check('converter: Opus from the service saved as .opus (Firefox used to rename it .ogg)', d && d.name === 'opus-service-tone.opus' && d.bytes.equals(OPUS_BACK) && jobs.length === 1, d?.name);
  await p.close();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
await b.close(); process.exit(fails ? 1 : 0);

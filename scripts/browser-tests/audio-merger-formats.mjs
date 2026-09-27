// Audio Merger's output-format choice, real page, real files, results decoded here by a native ffmpeg:
// - the default picked for each mix of inputs (lossless stays lossless), and what the page says about it;
// - each of the 14 formats: file name, codec, full length, and for lossless outputs every sample exact
//   (done by ffmpeg.wasm in the browser, whose build differs from the native one that checks it);
// - 24-bit, floating-point and mono inputs kept exactly; a non-default bitrate honoured;
// - Opus: the joined audio is sent to the media service as a FLAC of the full length with the bitrate picked, and the
//   service's file is what is downloaded (the service is PLAYED BY THIS TEST, like audio-opus-service.mjs; the real
//   libopus path is audio-merger-join.mjs / audio-opus-real.mjs on a preview and on www);
// - Cancel stops a merge and the next one works.
// With a build made with NEXT_PUBLIC_MEDIA_SERVICE_URL=https://media.test.invalid (no env file involved).
// Usage: node scripts/browser-tests/audio-merger-formats.mjs <origin> <ffmpeg> [--browser=firefox]
import { chromium, firefox, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [entry, FF] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const FP = FF.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'merger-formats-'));
const run = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: tmp, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
const probe = (f) => { const j = JSON.parse(execFileSync(FP, ['-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels,sample_fmt,bits_per_raw_sample:format=format_name', '-of', 'json', f], { cwd: tmp }).toString()); return { ...j.streams[0], container: j.format.format_name }; };
const decodedSecs = (f) => run(['-i', f, '-map', '0:a', '-ac', '1', '-f', 's16le', '-']).length / 2 / Number(probe(f).sample_rate);
const pcmHash = (files, fmt = 's32le') => { const h = crypto.createHash('sha256'); for (const f of files) h.update(run(['-i', f, '-map', '0:a', '-af', probe(f).channels === 1 ? 'pan=stereo|c0=c0|c1=c0' : 'anull', '-f', fmt, '-'])); return h.digest('hex'); };
const src = (name, secs, seed, extra) => { run(['-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.3:sample_rate=48000:seed=${seed}`, '-t', String(secs), ...extra, name]); return path.join(tmp, name); };
const S16 = ['-ar', '44100', '-ac', '2', '-sample_fmt', 's16'];
const F = {
  flac: src('a.flac', 3, 1, S16), flac2: src('b.flac', 2, 2, S16), wav: src('c.wav', 2, 3, [...S16, '-c:a', 'pcm_s16le']),
  f24: src('d24.flac', 2, 4, ['-ar', '44100', '-ac', '2', '-sample_fmt', 's32', '-bits_per_raw_sample', '24']),
  f24b: src('e24.flac', 1, 5, ['-ar', '44100', '-ac', '2', '-sample_fmt', 's32', '-bits_per_raw_sample', '24']),
  wf32: src('f32.wav', 1, 6, ['-ar', '44100', '-ac', '2', '-c:a', 'pcm_f32le']),
  mono: src('mono.flac', 1.5, 7, ['-ar', '44100', '-ac', '1', '-sample_fmt', 's16']),
  f48: src('g48.flac', 1, 8, ['-ar', '48000', '-ac', '2', '-sample_fmt', 's16']),
  mp3: src('h.mp3', 2, 9, ['-ar', '44100', '-ac', '2', '-b:a', '192k']), mp3b: src('i.mp3', 1, 10, ['-ar', '44100', '-ac', '2', '-b:a', '192k']),
  opus: src('j.opus', 1, 11, ['-c:a', 'libopus', '-b:a', '96k']), opusb: src('k.opus', 1, 12, ['-c:a', 'libopus', '-b:a', '96k']),
  m4a: src('l.m4a', 1, 13, ['-ar', '44100', '-c:a', 'aac', '-b:a', '128k']), m4ab: src('m.m4a', 1, 14, ['-ar', '44100', '-c:a', 'aac', '-b:a', '128k']),
  long1: src('long1.flac', 600, 15, S16), long2: src('long2.flac', 600, 16, S16),
};
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };

// The simulated media service (Opus only).
const SERVICE = 'https://media.test.invalid';
const OPUS_BACK = Buffer.concat([Buffer.from('OggS'), Buffer.alloc(2044, 7)]);
let jobs = [];
const b = await engine.launch(); const ctx = await b.newContext({ acceptDownloads: true });
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

async function open(inputs) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/audio-tools/audio-merger`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(inputs);
  await p.locator('#merge-format').waitFor({ timeout: 120000 });
  return p;
}
async function mergeAndSave(p, tag) {
  await p.getByRole('button', { name: 'Merge Audio Files' }).click();
  await Promise.race([p.locator('a[download]').waitFor({ timeout: 240000 }), p.locator('text=/Merge failed/').waitFor({ timeout: 240000 }).then(async () => { throw new Error(await p.locator('text=/Merge failed/').innerText()); })]);
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]').click()]);
  const f = path.join(tmp, `${tag}-${d.suggestedFilename()}`); await d.saveAs(f);
  return { f, name: d.suggestedFilename() };
}

// 1. Defaults, one page per mix of inputs.
for (const [label, inputs, want, noteRe] of [
  ['FLAC + FLAC', [F.flac, F.flac2], 'flac', /Lossless: the merged file holds every sample/],
  ['FLAC + WAV (Clideo: MP3)', [F.flac, F.wav], 'flac', /Lossless/],
  ['WAV + WAV', [F.wav, F.wav], 'wav', /Lossless/],
  ['float WAV + FLAC', [F.wf32, F.flac], 'wav', /Lossless/],
  ['MP3 + MP3', [F.mp3, F.mp3b], 'mp3', /Joined seamlessly/],
  ['Opus + Opus', [F.opus, F.opusb], 'opus', /libopus/],
  ['M4A + M4A', [F.m4a, F.m4ab], 'm4a', /Joined seamlessly/],
  ['FLAC + MP3', [F.flac, F.mp3], 'mp3', /Joined seamlessly/],
  ['48 kHz + 44.1 kHz FLAC', [F.f48, F.flac], 'flac', /converted to 48 kHz/],
]) {
  const p = await open(inputs);
  const got = await p.locator('#merge-format').inputValue();
  const notes = await p.locator('[data-testid=merge-notes]').innerText().catch(() => '');
  const kb = await p.locator('#merge-kbps').inputValue().catch(() => null);
  check(`default for ${label}: ${want}`, got === want && noteRe.test(notes), `${got} kbps=${kb} | ${notes.replace(/\s+/g, ' ').slice(0, 140)}`);
  if (label === 'FLAC + MP3') {
    await p.locator('#merge-format').selectOption('flac');
    check('choosing a lossy format for lossless files is said; FLAC for lossy files says "no further loss"', /No further quality loss/.test(await p.locator('[data-testid=merge-notes]').innerText()));
  }
  await p.close();
}

// 2. Every format: FLAC 3 s + WAV 2 s (lossless, 44.1 kHz 16-bit).
const EXPECT = { flac: 'flac', wav: 'pcm_s16le', aiff: 'pcm_s16be', alac: 'alac', caf: 'pcm_s16be', w64: 'pcm_s16le', mp3: 'mp3', m4a: 'aac', aac: 'aac', m4r: 'aac', ogg: 'vorbis', wma: 'wmav2', ac3: 'ac3' };
const EXT = { alac: 'm4a' };
const exactRef = pcmHash([F.flac, F.wav]);
for (const v of Object.keys(EXPECT)) {
  const p = await open([F.flac, F.wav]);
  try {
    await p.locator('#merge-format').selectOption(v);
    const { f, name } = await mergeAndSave(p, v);
    const pr = probe(f); const secs = decodedSecs(f);
    const lossless = ['flac', 'wav', 'aiff', 'alac', 'caf', 'w64'].includes(v);
    // Lossless: exact. Lossy: no audio lost, and at most one codec frame of silence after the end (2048 samples = 46 ms):
    // ffmpeg's AAC and AC3 encoders pad their last frame (+15.5 ms here; Clideo +10.9 ms) and a raw .aac also keeps the
    // 1024-sample priming it has no field for (+38.7 ms). The joins themselves are checked by audio-merger-join.mjs.
    const lenOk = lossless ? Math.abs(secs - 5) <= 0.0001 : secs >= 5 - 0.001 && secs <= 5 + 0.047;
    const exact = lossless ? pcmHash([f]) === exactRef : null;
    check(`${v}: merged_audio.${EXT[v] || v}, ${EXPECT[v]}, ${lossless ? '5 s, every sample exact' : 'all 5 s kept'}`,
      name === `merged_audio.${EXT[v] || v}` && pr.codec_name === EXPECT[v] && lenOk && exact !== false,
      `${name} ${pr.codec_name} ${pr.container} ${secs.toFixed(4)} s${lossless ? ` exact=${exact}` : ''}`);
  } catch (e) { check(`${v}: finished`, false, String(e.message || e).slice(0, 200)); }
  await p.close();
}

// 3. Opus: joined losslessly here, sent as FLAC with the bitrate picked, the service's bytes downloaded.
// --real-service (a preview or www build, whose service is the real one): skipped here, proven by audio-merger-join.mjs.
if (!process.argv.includes('--real-service')) {
  const p = await open([F.flac, F.wav]); jobs = [];
  await p.locator('#merge-format').selectOption('opus');
  await p.locator('#merge-kbps').selectOption('128');
  const { f, name } = await mergeAndSave(p, 'opus');
  const flac = path.join(tmp, 'sent.flac'); fs.writeFileSync(flac, Buffer.concat(jobs[0]?.chunks || []));
  const ok = jobs.length === 1 && jobs[0].params.target === 'opus' && jobs[0].params.kbps === 128 && probe(flac).codec_name === 'flac' && pcmHash([flac]) === exactRef;
  check('opus: one job, the exact joined audio sent as FLAC, kbps 128', ok, JSON.stringify(jobs[0]?.params));
  check('opus: the service\'s file downloaded as merged_audio.opus', name === 'merged_audio.opus' && fs.readFileSync(f).equals(OPUS_BACK), name);
  await p.close();
}

// 4. Depth, float, mono, bitrate -- inside ffmpeg.wasm.
for (const [label, inputs, v, test] of [
  ['24-bit FLAC kept 24-bit and exact', [F.f24, F.f24b], 'flac', (f, pr) => pr.bits_per_raw_sample === '24' && pcmHash([f]) === pcmHash([F.f24, F.f24b])],
  ['float WAV kept float and exact', [F.wf32, F.wav], 'wav', (f, pr) => pr.codec_name === 'pcm_f32le' && pcmHash([f], 'f64le') === pcmHash([F.wf32, F.wav], 'f64le')],
  ['mono duplicated at full level, exact', [F.mono, F.flac], 'flac', (f) => pcmHash([f]) === pcmHash([F.mono, F.flac])],
  ['MP3 at 128 kbit/s when picked', [F.mp3, F.mp3b], 'mp3', (f) => { const kb = (fs.statSync(f).size * 8) / 1000 / decodedSecs(f); return kb > 110 && kb < 145; }],
]) {
  const p = await open(inputs);
  try {
    if ((await p.locator('#merge-format').inputValue()) !== v) await p.locator('#merge-format').selectOption(v);
    if (label.startsWith('MP3')) await p.locator('#merge-kbps').selectOption('128');
    const { f } = await mergeAndSave(p, label.slice(0, 6).replace(/\W/g, ''));
    const pr = probe(f); check(label, test(f, pr), `${pr.codec_name} ${pr.sample_fmt} ${pr.bits_per_raw_sample}`);
  } catch (e) { check(label, false, String(e.message || e).slice(0, 200)); }
  await p.close();
}

// 5. Cancel a long merge (2 x 10 min), then merge again.
{
  const p = await open([F.long1, F.long2]);
  await p.locator('#merge-format').selectOption('mp3');
  await p.getByRole('button', { name: 'Merge Audio Files' }).click();
  await p.getByRole('button', { name: 'Cancel' }).waitFor({ timeout: 60000 }); await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Cancel' }).click();
  await p.getByRole('button', { name: 'Merge Audio Files' }).waitFor({ timeout: 10000 });
  const err = await p.locator('text=/Merge failed/').count();
  await p.locator('#merge-format').selectOption('flac');
  const { f } = await mergeAndSave(p, 'after-cancel');
  check('cancel: back to the button, no error, and the next merge (FLAC, 20 min) is exact', err === 0 && Math.abs(decodedSecs(f) - 1200) < 0.001, `errors=${err}`);
  await p.close();
}
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`);
await b.close(); process.exit(fails ? 1 : 0);

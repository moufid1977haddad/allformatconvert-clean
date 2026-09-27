// The planner's ffmpeg commands, run by a native ffmpeg on real files: every format decodes back, lossless outputs
// are sample-exact (same rate) against the inputs decoded one by one, lossy outputs sit near the bitrate asked.
// The page runs the same commands in ffmpeg.wasm; audio-merger-join.mjs proves that path in the browsers.
// Run: node scripts/audio-merge-tests/02-commands-native.mjs <ffmpeg>
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planMerge, planLastCount, parseSampleCount, parseProbe, defaultFormat, MERGE_FORMATS } from '../../app/lib/audioMerge.js';

const FF = process.argv[2]; const FP = FF.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-cmd-'));
const run = (args) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: tmp, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'] });
const probe = (f) => parseProbe(execFileSync(FP, ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,sample_rate,channels,sample_fmt,bits_per_raw_sample,bits_per_sample:format=format_name,duration', '-of', 'json', f], { cwd: tmp }).toString());
const src = (name, secs, seed, extra = []) => { run(['-f', 'lavfi', '-i', `anoisesrc=color=pink:amplitude=0.3:sample_rate=48000:seed=${seed}`, '-t', String(secs), ...extra, name]); return name; };
// Exact PCM of a file at its own rate/depth, as 32-bit little-endian integers (or doubles for float), in stereo.
// Mono is duplicated with pan (ffmpeg's -ac 2 would lower it by 3 dB, which is exactly what the merger must not do).
const pcmHash = (files, fmt = 's32le') => { const h = crypto.createHash('sha256'); for (const f of files) h.update(run(['-i', f, '-map', '0:a', '-af', probe(f).channels === 1 ? 'pan=stereo|c0=c0|c1=c0' : 'anull', '-f', fmt, '-'])); return h.digest('hex'); };
// Length by decoding every sample (a raw .aac has no length field: ffprobe only estimates it from the bitrate).
const decodedSecs = (f) => run(['-i', f, '-map', '0:a', '-ac', '1', '-f', 's16le', '-']).length / 2 / probe(f).sampleRate;

let pass = 0, fails = 0, seq = 0;
const ok = (n, fn) => { try { fn(); pass++; console.log('PASS', n); } catch (e) { fails++; console.log('FAIL', n, e.message.slice(0, 300)); } };

// Sources: 16-bit 44.1k stereo FLAC, 16-bit 44.1k stereo WAV, 24-bit 44.1k FLAC, mono 44.1k FLAC, 48k FLAC, float WAV, MP3.
src('f16.flac', 3, 1, ['-ar', '44100', '-ac', '2', '-sample_fmt', 's16']);
src('w16.wav', 2, 2, ['-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le']);
src('f24.flac', 2, 3, ['-ar', '44100', '-ac', '2', '-sample_fmt', 's32', '-bits_per_raw_sample', '24']);
src('mono.flac', 1.5, 4, ['-ar', '44100', '-ac', '1', '-sample_fmt', 's16']);
src('f48k.flac', 1, 5, ['-ar', '48000', '-ac', '2', '-sample_fmt', 's16']);
src('wf32.wav', 1, 6, ['-ar', '44100', '-ac', '2', '-c:a', 'pcm_f32le']);
src('m.mp3', 2, 7, ['-ar', '44100', '-ac', '2', '-b:a', '192k']);

function merge(files, fmt, kbps) {
  const probes = files.map(probe);
  const plan = planMerge(probes, files, fmt, kbps);
  run(plan.args);
  const out = `out${++seq}-${fmt}-${kbps || 'x'}.${plan.ext}`; fs.renameSync(path.join(tmp, plan.outputName), path.join(tmp, out));
  return { out, plan, probes, p: probe(out) };
}
const secs = (files) => files.reduce((a, f) => a + probe(f).duration, 0);

ok('16-bit lossless in every lossless format: sample-exact, same depth', () => {
  for (const f of MERGE_FORMATS.filter((x) => x.lossless)) {
    const { out, p } = merge(['f16.flac', 'w16.wav'], f.value);
    assert.equal(pcmHash([out]), pcmHash(['f16.flac', 'w16.wav']), `${f.value} not exact`);
    assert.ok(/s16/.test(p.sampleFmt) || p.bits === 16, `${f.value} depth ${p.sampleFmt}/${p.bits}`);
  }
});
ok('FLAC header gives the full length (the old copy kept the 1st file\'s)', () => {
  const { p } = merge(['f16.flac', 'f16.flac', 'f16.flac'], 'flac');
  assert.ok(Math.abs(p.duration - 9) < 0.001, `duration ${p.duration}`);
});
ok('24-bit kept in FLAC, WAV, AIFF, ALAC, CAF, W64 (sample-exact)', () => {
  for (const v of ['flac', 'wav', 'aiff', 'alac', 'caf', 'w64']) {
    const { out, p } = merge(['f24.flac', 'f16.flac'], v);
    assert.equal(pcmHash([out]), pcmHash(['f24.flac', 'f16.flac']), `${v} not exact`);
    assert.ok(p.bits === 24 || /s32/.test(p.sampleFmt), `${v}: ${p.sampleFmt}/${p.bits}`);
  }
});
ok('mono + stereo: mono duplicated at full level, sample-exact', () => {
  const { out } = merge(['mono.flac', 'f16.flac'], 'flac');
  assert.equal(pcmHash([out]), pcmHash(['mono.flac', 'f16.flac'])); // -ac 2 on a mono file duplicates it too
});
ok('float WAV: default WAV, kept as float, exact', () => {
  const files = ['wf32.wav', 'w16.wav']; assert.equal(defaultFormat(files.map(probe)), 'wav');
  const { out, p } = merge(files, 'wav'); assert.equal(p.codec, 'pcm_f32le');
  assert.equal(pcmHash([out], 'f64le'), pcmHash(files, 'f64le'));
});
ok('mixed rates: resampled to the highest, length exact', () => {
  const { p, plan } = merge(['f48k.flac', 'f16.flac'], 'flac');
  assert.equal(plan.rate, 48000); assert.equal(p.sampleRate, 48000);
  assert.ok(Math.abs(p.duration - 4) < 0.001, `duration ${p.duration}`);
});
ok('every lossy format at every offered bitrate decodes, full length, near the bitrate', () => {
  for (const f of MERGE_FORMATS.filter((x) => x.kbps)) {
    for (const k of f.kbps) {
      const { out } = merge(['f16.flac', 'm.mp3'], f.value, k); const d = decodedSecs(out);
      const kb = (fs.statSync(path.join(tmp, out)).size * 8) / 1000 / d;
      assert.ok(Math.abs(d - 5) < 0.08, `${f.value} ${k}k: ${d} s`);
      const want = f.shownKbps?.[k] || k; // the figure the page shows
      assert.ok(kb > want * 0.6 && kb < want * 1.25, `${f.value} ${k}k: measured ${kb.toFixed(0)} kbit/s`);
    }
    console.log('   ', f.value, f.kbps.join('/'));
  }
});
// Crossfade (off by default). Samples of a file as signed 16-bit stereo interleaved.
// volumedetect prints its count on stderr.
const require_stderr = (args) => spawnSync(FF, ['-hide_banner', ...args], { cwd: tmp }).stderr.toString();
const s16 = (f) => { const b = run(['-i', f, '-map', '0:a', '-f', 's16le', '-']); return new Int16Array(b.buffer, b.byteOffset, b.length / 2); };
const rms = (a, from, to) => { let s = 0; for (let i = from; i < to; i++) s += a[i] * a[i]; return Math.sqrt(s / (to - from)); };
function fadeMerge(files, fmt, fade, kbps) {
  const probes = files.map(probe); const plan = planMerge(probes, files, fmt, kbps, fade); run(plan.args);
  const out = `fade${++seq}.${plan.ext}`; fs.renameSync(path.join(tmp, plan.outputName), path.join(tmp, out)); return { out, plan };
}
ok('crossfade: length = sum - joins x overlap, to the sample; outside the overlaps every sample unchanged', () => {
  src('x1.flac', 3, 11, ['-ar', '44100', '-ac', '2', '-sample_fmt', 's16']); src('x2.flac', 2, 12, ['-ar', '44100', '-ac', '2', '-sample_fmt', 's16']);
  src('x3.flac', 2.5, 13, ['-ar', '44100', '-ac', '2', '-sample_fmt', 's16']);
  const { out, plan } = fadeMerge(['x1.flac', 'x2.flac', 'x3.flac'], 'flac', { seconds: 0.5, curve: 'qsin' });
  const o = s16(out), a = s16('x1.flac'), b = s16('x2.flac'), c = s16('x3.flac'), n = plan.fadeSamples * 2; // stereo
  assert.equal(o.length, a.length + b.length + c.length - 2 * n, `length ${o.length / 88200} s`);
  const same = (x, xFrom, y, yFrom, len) => { for (let i = 0; i < len; i++) if (x[xFrom + i] !== y[yFrom + i]) return `sample ${i}: ${x[xFrom + i]} vs ${y[yFrom + i]}`; return true; };
  assert.equal(same(o, 0, a, 0, a.length - n), true, 'file 1 before its crossfade');
  assert.equal(same(o, a.length, b, n, b.length - 2 * n), true, 'file 2 between its crossfades');
  assert.equal(same(o, o.length - (c.length - n), c, n, c.length - n), true, 'file 3 after its crossfade');
});
ok('fade without overlap: full length kept; silent at the join, full level outside the fades', () => {
  const { out, plan } = fadeMerge(['x1.flac', 'x2.flac'], 'flac', { seconds: 0.5, curve: 'tri', overlap: false });
  const o = s16(out), a = s16('x1.flac'), b = s16('x2.flac'), n = plan.fadeSamples * 2;
  assert.equal(o.length, a.length + b.length, `length ${o.length / 88200} s`);
  let same = 0; for (let i = 0; i < a.length - n; i++) if (o[i] === a[i]) same++;
  assert.equal(same, a.length - n, 'file 1 before its fade-out');
  const w = 441 * 2; assert.ok(rms(o, a.length - w, a.length + w) < rms(o, 0, a.length - n) * 0.05, 'not silent at the join');
});
ok('fade-in / fade-out: exact count of the last file, silence at both ends, joins untouched', () => {
  const files = ['m.mp3', 'mono.flac']; const probes = files.map(probe);
  const c = planLastCount(probes, files, 'wav');
  const err = require_stderr(c.args);
  const lastSamples = parseSampleCount(err, c.channels);
  assert.equal(lastSamples, 1.5 * 44100, `count ${lastSamples}`);
  const { out, plan } = fadeMerge(files, 'wav', { seconds: 0.5, curve: 'qsin', joins: [false], fadeIn: true, fadeOut: true, lastSamples });
  const o = s16(out); const n = plan.fadeSamples * 2;
  assert.equal(o.length, (2 * 44100 + lastSamples) * 2);
  assert.ok(Math.abs(o[0]) + Math.abs(o[1]) < 50, `first sample ${o[0]}`); assert.ok(Math.abs(o.at(-1)) + Math.abs(o.at(-2)) < 50, `last sample ${o.at(-1)}`);
  const mono = s16('mono.flac'); let same = 0; const off = 2 * 44100 * 2; // mono file duplicated to both channels
  for (let i = 0; i < mono.length - plan.fadeSamples; i++) if (o[off + 2 * i] === mono[i] && o[off + 2 * i + 1] === mono[i]) same++;
  assert.equal(same, mono.length - plan.fadeSamples, 'last file before its fade-out');
  assert.ok(rms(o, o.length - n, o.length - n / 2) > rms(o, o.length - n / 2, o.length), 'level falls through the fade-out');
});
ok('crossfade loudness, two different signals: equal power stays level, linear dips about 3 dB halfway', () => {
  const lvl = {};
  for (const curve of ['qsin', 'tri']) {
    const { out, plan } = fadeMerge(['x1.flac', 'x2.flac'], 'wav', { seconds: 1, curve });
    const o = s16(out), n = plan.fadeSamples * 2, start = s16('x1.flac').length - n, mid = start + n / 2, w = 4410 * 2;
    lvl[curve] = 20 * Math.log10(rms(o, mid - w, mid + w) / rms(o, 0, start - w));
  }
  console.log('    level halfway through the overlap, against before it: equal power', lvl.qsin.toFixed(2), 'dB, linear', lvl.tri.toFixed(2), 'dB');
  assert.ok(Math.abs(lvl.qsin) < 0.5, `equal power ${lvl.qsin}`); assert.ok(lvl.tri < -2.5 && lvl.tri > -3.5, `linear ${lvl.tri}`);
});
ok('crossfade of two loud in-phase files into 16 bits: clipped at full scale, never wrapped around', () => {
  run(['-f', 'lavfi', '-i', 'sine=frequency=220:sample_rate=44100', '-t', '2', '-af', 'volume=7.6', '-ac', '2', '-sample_fmt', 's16', 'loud.flac']); // peak ~0.95
  const { out, plan } = fadeMerge(['loud.flac', 'loud.flac'], 'flac', { seconds: 1, curve: 'qsin' });
  const o = s16(out), ref = s16('loud.flac'), n = plan.fadeSamples * 2, start = ref.length - n;
  let wrong = 0; for (let i = start; i < start + n; i++) if (Math.sign(o[i]) !== Math.sign(ref[i]) && Math.abs(ref[i]) > 3000) wrong++;
  assert.equal(wrong, 0, `${wrong} samples flipped sign (wrap-around)`);
});
ok('crossfade into every lossy format: length = sum - overlap (within one encoder block)', () => {
  for (const f of MERGE_FORMATS.filter((x) => x.kbps)) {
    const { out } = fadeMerge(['f16.flac', 'm.mp3'], f.value, { seconds: 1, curve: 'tri' }, f.defaultKbps); const d = decodedSecs(out);
    assert.ok(Math.abs(d - 4) < 0.08, `${f.value}: ${d} s`);
  }
});
console.log(fails ? `${fails} FAILED, ${pass} passed` : `${pass} passed`);
process.exit(fails ? 1 : 0);

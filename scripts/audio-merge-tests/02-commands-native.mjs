// The planner's ffmpeg commands, run by a native ffmpeg on real files: every format decodes back, lossless outputs
// are sample-exact (same rate) against the inputs decoded one by one, lossy outputs sit near the bitrate asked.
// The page runs the same commands in ffmpeg.wasm; audio-merger-join.mjs proves that path in the browsers.
// Run: node scripts/audio-merge-tests/02-commands-native.mjs <ffmpeg>
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planMerge, parseProbe, defaultFormat, MERGE_FORMATS } from '../../app/lib/audioMerge.js';

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
console.log(fails ? `${fails} FAILED, ${pass} passed` : `${pass} passed`);
process.exit(fails ? 1 : 0);

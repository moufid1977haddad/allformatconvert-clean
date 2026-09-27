// Audio Merger planner: default format, depth, rate, channels, command. Run: node scripts/audio-merge-tests/01-plan.mjs
import assert from 'node:assert/strict';
import { defaultFormat, planMerge, sourceFormat, depthOf, combinedDepth, parseProbe, MERGE_FORMATS } from '../../app/lib/audioMerge.js';

let pass = 0;
const ok = (n, fn) => { fn(); pass++; console.log('PASS', n); };
const P = (codec, container, extra = {}) => ({ codec, container, sampleRate: 44100, channels: 2, sampleFmt: 's16', bits: 16, ...extra });
const flac = P('flac', 'flac'), wav = P('pcm_s16le', 'wav'), mp3 = P('mp3', 'mp3', { sampleFmt: 'fltp', bits: 0 });
const m4a = P('aac', 'mov,mp4,m4a,3gp,3g2,mj2', { sampleFmt: 'fltp' }), opus = P('opus', 'ogg', { sampleRate: 48000, sampleFmt: 'fltp' });

ok('source formats', () => {
  assert.equal(sourceFormat(m4a), 'm4a'); assert.equal(sourceFormat(P('aac', 'aac')), 'aac');
  assert.equal(sourceFormat(P('pcm_s16be', 'aiff')), 'aiff'); assert.equal(sourceFormat(P('alac', 'mov,mp4,m4a')), 'alac');
  assert.equal(sourceFormat(P('vorbis', 'ogg')), 'ogg'); assert.equal(sourceFormat(P('amr_nb', 'amr')), null);
});
ok('default: all lossless never becomes lossy (Clideo turns FLAC+WAV into MP3)', () => {
  assert.equal(defaultFormat([flac, flac]), 'flac');
  assert.equal(defaultFormat([wav, wav]), 'wav');
  assert.equal(defaultFormat([flac, wav]), 'flac');
  assert.equal(defaultFormat([P('pcm_s16be', 'aiff'), P('pcm_s16be', 'aiff')]), 'aiff');
  assert.equal(defaultFormat([P('alac', 'mov,mp4,m4a'), flac]), 'flac');
});
ok('default: float or 32-bit lossless goes to WAV (FLAC would round it)', () => {
  assert.equal(defaultFormat([P('pcm_f32le', 'wav', { sampleFmt: 'flt', bits: 0 }), flac]), 'wav');
  assert.equal(defaultFormat([P('flac', 'flac', { sampleFmt: 's32', bits: 24 }), flac]), 'flac');
  assert.equal(defaultFormat([P('pcm_s32le', 'wav', { sampleFmt: 's32', bits: 32 }), P('pcm_s32le', 'wav', { sampleFmt: 's32', bits: 32 })]), 'wav');
});
ok('default: same lossy format kept, anything mixed -> MP3', () => {
  assert.equal(defaultFormat([mp3, mp3]), 'mp3'); assert.equal(defaultFormat([opus, opus]), 'opus');
  assert.equal(defaultFormat([m4a, m4a]), 'm4a'); assert.equal(defaultFormat([flac, mp3]), 'mp3');
  assert.equal(defaultFormat([m4a, P('aac', 'aac')]), 'mp3');
  assert.equal(defaultFormat([P('aac', 'aac'), P('aac', 'aac')]), 'm4a'); // raw AAC: same codec, a container that keeps the length
});
ok('depths', () => {
  assert.equal(depthOf(P('pcm_s24le', 'wav', { sampleFmt: 's32', bits: 24 })), 24);
  assert.equal(depthOf(mp3), 16);
  assert.equal(combinedDepth([16, 'f32', 24]), 'f32'); assert.equal(combinedDepth([32, 'f32']), 'f64');
});
ok('FLAC 24-bit keeps 24 bits, WAV 24-bit uses pcm_s24le', () => {
  const hi = P('flac', 'flac', { sampleFmt: 's32', bits: 24 });
  const f = planMerge([hi, flac], ['i0.flac', 'i1.flac'], 'flac');
  assert.deepEqual(f.args.slice(-7), ['-c:a', 'flac', '-sample_fmt', 's32', '-bits_per_raw_sample', '24', 'output.flac']);
  assert.match(f.args.join(' '), /aformat=sample_fmts=s32:sample_rates=44100:channel_layouts=stereo/);
  assert.equal(planMerge([hi, flac], ['a', 'b'], 'wav').args.at(-2), 'pcm_s24le');
  assert.equal(f.rounded, false);
  assert.equal(planMerge([P('pcm_f32le', 'wav', { sampleFmt: 'flt' })], ['a'], 'flac').rounded, true);
});
ok('mono into stereo is duplicated, not lowered by 3 dB', () => {
  const g = planMerge([P('flac', 'flac', { channels: 1 }), flac], ['a', 'b'], 'flac').args.join(' ');
  assert.match(g, /\[0:a:0\]pan=stereo\|c0=c0\|c1=c0,aformat/);
  assert.doesNotMatch(g, /\[1:a:0\]pan/);
});
ok('highest rate kept; resampled only where needed; lossy caps', () => {
  const p = planMerge([P('flac', 'flac', { sampleRate: 48000 }), flac], ['a', 'b'], 'flac');
  assert.equal(p.rate, 48000); assert.equal(p.resampled, true);
  assert.match(p.args.join(' '), /\[1:a:0\]aresample=48000/); assert.doesNotMatch(p.args.join(' '), /\[0:a:0\]aresample/);
  assert.equal(planMerge([P('flac', 'flac', { sampleRate: 96000 })], ['a'], 'mp3').rate, 48000);
  assert.equal(planMerge([P('flac', 'flac', { sampleRate: 22050 })], ['a'], 'ac3').rate, 32000);
  assert.equal(planMerge([P('flac', 'flac', { channels: 6 })], ['a'], 'mp3').channels, 2);
});
ok('bitrate: chosen if offered, else the format default', () => {
  assert.equal(planMerge([mp3], ['a'], 'mp3', 128).kbps, 128);
  assert.equal(planMerge([mp3], ['a'], 'mp3', 999).kbps, 320);
  assert.equal(planMerge([mp3], ['a'], 'm4a').kbps, 256);
  assert.equal(planMerge([flac], ['a'], 'flac', 128).kbps, null);
  assert.deepEqual(planMerge([mp3], ['a'], 'mp3').args.slice(-5), ['-c:a', 'libmp3lame', '-b:a', '320k', 'output.mp3']);
});
ok('m4r muxed as m4a, named .m4r; metadata of file 1 not stamped on the whole merge', () => {
  const r = planMerge([mp3], ['a'], 'm4r'); assert.equal(r.outputName, 'output.m4a'); assert.equal(r.ext, 'm4r');
  assert.ok(r.args.includes('-map_metadata'));
});
ok('WMA end padded to a whole frame (its encoder drops the last partial one)', () => {
  assert.ok(planMerge([mp3], ['a'], 'wma').args.join(' ').includes('concat=n=1:v=0:a=1[j];[j]apad=pad_len=2048[out]'));
  assert.doesNotMatch(planMerge([mp3], ['a'], 'mp3').args.join(' '), /apad/);
});
ok('14 formats, each with a unique value', () => {
  assert.equal(MERGE_FORMATS.length, 14); assert.equal(new Set(MERGE_FORMATS.map((f) => f.value)).size, 14);
});
ok('parseProbe reads ffprobe json', () => {
  const p = parseProbe({ streams: [{ codec_type: 'audio', codec_name: 'flac', sample_rate: '48000', channels: 1, sample_fmt: 's32', bits_per_raw_sample: '24' }], format: { format_name: 'flac', duration: '3.5' } });
  assert.deepEqual(p, { codec: 'flac', container: 'flac', sampleRate: 48000, channels: 1, sampleFmt: 's32', bits: 24, duration: 3.5 });
});
console.log(`${pass} passed`);

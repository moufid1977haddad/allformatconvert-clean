// Audio Merger: output formats, the default choice, and the ffmpeg.wasm command that joins the files.
//
// Every join decodes each file on its own (so each file's encoder delay / Opus pre-skip / end padding is removed by
// its own headers), joins the samples, then encodes ONCE. Measured 26/09/2026 (docs/audit/RAPPORT-audio-merger-
// format-sortie.md): the old "stream copy" left 18-40 ms silences at MP3/AAC joins, corrupted the first 50 ms after
// each Opus join, and wrote the FIRST file's length into a merged FLAC's header (both browsers stopped playing there).
// Chained Ogg was measured too and rejected (no duration in <audio>, +13 ms in Chromium). Lossless outputs stay
// sample-exact: the bit depth and sample rate are kept, mono is duplicated (never the -3 dB default upmix).

const LOSSLESS_CODEC = /^(flac|alac|pcm_|wavpack|ape$|tta$|mlp$|truehd$|shorten$|mp4als$)/;
export const isLosslessCodec = (codec) => LOSSLESS_CODEC.test(codec || '');

// What each probed input already is, as one of our output format values (null: none of ours, e.g. AMR).
export function sourceFormat({ codec, container = '' }) {
  if (!codec) return null;
  if (codec === 'flac') return 'flac';
  if (codec === 'alac') return 'alac';
  if (codec.startsWith('pcm_')) {
    if (container.includes('aiff')) return 'aiff';
    if (container.includes('caf')) return 'caf';
    if (container.includes('w64')) return 'w64';
    return 'wav';
  }
  if (codec === 'mp3') return 'mp3';
  if (codec === 'aac') return /mp4|mov|m4a/.test(container) ? 'm4a' : 'aac';
  if (codec === 'vorbis') return 'ogg';
  if (codec === 'opus') return 'opus';
  if (codec === 'wmav1' || codec === 'wmav2') return 'wma';
  if (codec === 'ac3') return 'ac3';
  return null;
}

// Sample depth of one input: 16 | 24 | 32 (integer) | 'f32' | 'f64'. Lossy inputs decode to float but carry no
// real depth beyond their codec: they count as 16 (their lossless target then holds them exactly enough).
export function depthOf({ codec, sampleFmt = '', bits = 0 }) {
  if (!isLosslessCodec(codec)) return 16;
  if (/^(pcm_f64|dbl)/.test(codec) || sampleFmt.startsWith('dbl')) return 'f64';
  if (/^pcm_f32/.test(codec) || sampleFmt.startsWith('flt')) return 'f32';
  const b = Number(bits) || (/s32/.test(sampleFmt) ? 32 : 16);
  return b > 24 ? 32 : b > 16 ? 24 : 16;
}
export function combinedDepth(depths) {
  if (depths.includes('f64') || (depths.includes('f32') && depths.includes(32))) return 'f64';
  if (depths.includes('f32')) return 'f32';
  return Math.max(16, ...depths.filter((d) => typeof d === 'number'));
}

const LOSSY_KBPS = [320, 256, 192, 160, 128, 96, 64];
const le = { 16: 'pcm_s16le', 24: 'pcm_s24le', 32: 'pcm_s32le', f32: 'pcm_f32le', f64: 'pcm_f64le' };
const be = { 16: 'pcm_s16be', 24: 'pcm_s24be', 32: 'pcm_s32be', f32: 'pcm_f32be', f64: 'pcm_f64be' };
const pcm = (table) => (d) => ['-c:a', table[d]];
// FLAC and ALAC hold integers up to 24 bits here; a 32-bit or float source is rounded to 24 bits (said on the page).
const upTo24 = (d) => (typeof d === 'number' && d <= 24 ? d : 24);

export const MERGE_FORMATS = [
  { value: 'flac', label: 'FLAC', ext: 'flac', mime: 'audio/flac', lossless: true, maxDepth: 24,
    args: (d) => ['-c:a', 'flac', ...(upTo24(d) === 24 ? ['-sample_fmt', 's32', '-bits_per_raw_sample', '24'] : ['-sample_fmt', 's16'])] },
  { value: 'wav', label: 'WAV', ext: 'wav', mime: 'audio/wav', lossless: true, args: pcm(le) },
  { value: 'aiff', label: 'AIFF', ext: 'aiff', mime: 'audio/aiff', lossless: true, args: pcm(be) },
  { value: 'alac', label: 'ALAC (Apple Lossless, .m4a)', ext: 'm4a', mime: 'audio/mp4', lossless: true, maxDepth: 24,
    args: (d) => ['-c:a', 'alac', ...(upTo24(d) === 24 ? ['-sample_fmt', 's32p', '-bits_per_raw_sample', '24'] : ['-sample_fmt', 's16p'])] },
  { value: 'caf', label: 'CAF (Core Audio)', ext: 'caf', mime: 'audio/x-caf', lossless: true, args: pcm(be) },
  { value: 'w64', label: 'W64 (Wave64, over 4 GB)', ext: 'w64', mime: 'audio/x-w64', lossless: true, args: pcm(le) },
  { value: 'mp3', label: 'MP3', ext: 'mp3', mime: 'audio/mpeg', kbps: LOSSY_KBPS, defaultKbps: 320, maxRate: 48000, maxChannels: 2,
    args: (k) => ['-c:a', 'libmp3lame', '-b:a', `${k}k`] },
  { value: 'm4a', label: 'M4A (AAC)', ext: 'm4a', mime: 'audio/mp4', kbps: LOSSY_KBPS, defaultKbps: 256, maxRate: 96000,
    args: (k) => ['-c:a', 'aac', '-b:a', `${k}k`] },
  // Raw AAC (ADTS) has no field for the encoder's 1024-sample priming (+23 ms at the start) nor for the length (Chromium
  // showed 12.95 s for 12.14 s): offered for players that need it, never picked by default (M4A instead, same codec).
  { value: 'aac', label: 'AAC (.aac, raw)', ext: 'aac', mime: 'audio/aac', kbps: LOSSY_KBPS, defaultKbps: 256, maxRate: 96000,
    args: (k) => ['-c:a', 'aac', '-b:a', `${k}k`] },
  // An iPhone ringtone is an M4A named .m4r (iOS takes 40 s at most, said on the page).
  { value: 'm4r', label: 'M4R (iPhone ringtone)', ext: 'm4r', muxExt: 'm4a', mime: 'audio/mp4', kbps: LOSSY_KBPS, defaultKbps: 256, maxRate: 48000,
    args: (k) => ['-c:a', 'aac', '-b:a', `${k}k`] },
  { value: 'ogg', label: 'OGG (Vorbis)', ext: 'ogg', mime: 'audio/ogg', kbps: LOSSY_KBPS, defaultKbps: 256, maxRate: 48000,
    args: (k) => ['-c:a', 'libvorbis', '-b:a', `${k}k`] },
  // Encoded by libopus on our media service (lib/opusService.js); ffmpeg's native encoder only without the service.
  { value: 'opus', label: 'Opus', ext: 'opus', mime: 'audio/opus', kbps: [256, 192, 160, 128, 96, 64], defaultKbps: 192, maxRate: 48000,
    args: (k) => ['-c:a', 'opus', '-strict', '-2', '-b:a', `${k}k`] },
  // ffmpeg's WMA encoder snaps to steps: asked 256/160/128/96/64, it writes ~275/183/137/110/69 kbit/s (measured on 60 s,
  // 26/09/2026; 192 also gives 275). The page shows the real figure (shownKbps).
  { value: 'wma', label: 'WMA', ext: 'wma', mime: 'audio/x-ms-wma', kbps: [256, 160, 128, 96, 64], defaultKbps: 256, maxRate: 48000, maxChannels: 2,
    shownKbps: { 256: 275, 160: 183, 128: 137, 96: 110, 64: 69 },
    // It also drops the last incomplete 2048-sample frame (-31 ms of audio on 5 s; Clideo's WMA loses 12 ms): the end is
    // padded with silence to a whole frame, so every sample is kept.
    padEnd: 2048,
    args: (k) => ['-c:a', 'wmav2', '-b:a', `${k}k`] },
  { value: 'ac3', label: 'AC3 (Dolby Digital)', ext: 'ac3', mime: 'audio/ac3', kbps: [640, 448, 384, 320, 256, 192], defaultKbps: 448, maxRate: 48000, maxChannels: 6,
    rates: [32000, 44100, 48000], args: (k) => ['-c:a', 'ac3', '-b:a', `${k}k`] },
];
export const getMergeFormat = (value) => MERGE_FORMATS.find((f) => f.value === value);

// probes: [{ codec, container, sampleRate, channels, sampleFmt, bits }]
// All lossless -> lossless (the same format when they share one, else FLAC, or WAV when FLAC cannot hold the depth).
// All the same lossy format -> that format (raw .aac -> .m4a, same codec, exact length). Anything else -> MP3 (what every measured competitor does).
export function defaultFormat(probes) {
  const fmts = probes.map(sourceFormat);
  const same = fmts.every((f) => f && f === fmts[0]) ? fmts[0] : null;
  if (probes.every((p) => isLosslessCodec(p.codec))) {
    const d = combinedDepth(probes.map(depthOf));
    const fits = (v) => { const f = getMergeFormat(v); return !f.maxDepth || (typeof d === 'number' && d <= f.maxDepth); };
    if (same && fits(same)) return same;
    return fits('flac') ? 'flac' : 'wav';
  }
  if (same === 'aac') return 'm4a';
  return same || 'mp3';
}

// ffmpeg.wasm keeps the log level of the previous command: after the page's `ffprobe -v error` it printed nothing
// more, so the merge's progress ("time=") never showed and a sample count could not be read (measured 26/09/2026).
const LOG_INFO = ['-loglevel', 'info'];

const LAYOUT = { 1: 'mono', 2: 'stereo', 3: '2.1', 4: 'quad', 5: '5.0', 6: '5.1', 7: '6.1', 8: '7.1' };
const FILTER_FMT = { 16: 's16', 24: 's32', 32: 's32', f32: 'flt', f64: 'dbl' };

// Crossfade and fades (all off by default -- the default join adds and removes nothing). Measured on 26/09/2026
// (docs/audit/RAPPORT-audio-merger-ordre-fondu.md): 123apps crossfades every join unless told otherwise, over half the
// shorter file up to 3 s, never chosen by the visitor, and offers a fade-in at the start and a fade-out at the end by the
// same rule; Clideo offers a 0.8 s crossfade behind a box; onlineconverter 1 to 10 s (whole seconds) for all joins at
// once, with or without overlap. All three are linear. Here: 0.1 to 10 s, join by join, equal power or linear, with
// overlap (each crossfaded join shortens the result by its length) or without (fade out, then fade in: the length is
// kept), plus an optional fade-in at the start and fade-out at the end.
export const FADE_CURVES = [
  // Equal power: sin/cos gains, the loudness of two different songs stays level through the overlap.
  { value: 'qsin', label: 'Equal power (steady loudness)' },
  // Linear: gains add up to 1 (what 123apps and Clideo do); two different songs dip by about 3 dB halfway.
  { value: 'tri', label: 'Linear' },
];
export const FADE_MIN = 0.1;
export const FADE_MAX = 10;
export const FADE_DEFAULT = 2;
const curveOf = (fade) => (FADE_CURVES.some((c) => c.value === fade.curve) ? fade.curve : FADE_CURVES[0].value);

// The longest fade these files allow: a file can't give more than its length to its fades (half of it each when both
// of its ends fade), rounded down to 0.1 s. joins[i]: files i and i+1 are crossfaded; ends: { fadeIn, fadeOut }.
export function maxCrossfade(durations, joins, ends = {}) {
  let max = FADE_MAX;
  const last = durations.length - 1;
  durations.forEach((d, i) => {
    const sides = (joins[i - 1] || (i === 0 && ends.fadeIn) ? 1 : 0) + (joins[i] || (i === last && ends.fadeOut) ? 1 : 0);
    if (sides) max = Math.min(max, (Number(d) || 0) / sides);
  });
  return Math.max(0, Math.floor(max * 10 + 1e-9) / 10);
}

// Output rate, channels and the per-file filter steps (mono duplicated, resampled if needed, common format).
function layoutOf(probes, fmt) {
  const depth = combinedDepth(probes.map(depthOf));
  let rate = Math.max(...probes.map((p) => Number(p.sampleRate) || 44100));
  if (fmt.maxRate && rate > fmt.maxRate) rate = fmt.maxRate;
  if (fmt.rates && !fmt.rates.includes(rate)) rate = fmt.rates.find((r) => r >= rate) || 48000;
  let channels = Math.max(...probes.map((p) => Number(p.channels) || 2));
  if (fmt.maxChannels && channels > fmt.maxChannels) channels = fmt.maxChannels;
  if (!LAYOUT[channels]) channels = 2;
  const steps = (p, sampleFmt) => {
    const s = [];
    // Mono into stereo: the same samples on both sides (ffmpeg's default upmix lowers them by 3 dB).
    if (Number(p.channels) === 1 && channels === 2) s.push('pan=stereo|c0=c0|c1=c0');
    if ((Number(p.sampleRate) || rate) !== rate) s.push(`aresample=${rate}:filter_size=64:phase_shift=10:cutoff=0.97`);
    s.push(`aformat=sample_fmts=${sampleFmt}:sample_rates=${rate}:channel_layouts=${LAYOUT[channels]}`);
    return s;
  };
  return { depth, rate, channels, steps };
}

// A fade-out at the end starts a fixed number of samples before the last one, so that count must be exact -- a
// container's duration is only an estimate for some formats (raw AAC, some MP3). The page runs this command on the
// last file first: it decodes it through the same steps as the merge and prints "n_samples: N" (N / channels = frames).
export function planLastCount(probes, inputNames, formatValue) {
  const fmt = getMergeFormat(formatValue);
  const { steps, channels } = layoutOf(probes, fmt);
  return { channels, args: [...LOG_INFO, '-i', inputNames.at(-1), '-map', '0:a:0', '-af', [...steps(probes.at(-1), 'flt'), 'volumedetect'].join(','), '-f', 'null', '-'] };
}
// ffmpeg may set the filter up twice and print a first "n_samples: 0": the largest count is the real one.
export const parseSampleCount = (log, channels) => {
  const n = [...String(log || '').matchAll(/n_samples:\s*(\d+)/g)].map((m) => Number(m[1]));
  return n.length && Math.max(...n) > 0 ? Math.round(Math.max(...n) / channels) : null;
};

// The join: inputs named in order, the chosen format, the chosen bitrate (lossy only), and optional fades
// { seconds, curve, joins: [bool per join], overlap (default true), fadeIn, fadeOut, lastSamples (needed by fadeOut:
// the last file's length in output samples, from planLastCount) } -- with nothing ticked the command is the exact join.
// Returns { args, outputName, ext, mime, depth, rate, channels, rounded, resampled, fadedJoins, fadeSamples, lostSamples }.
export function planMerge(probes, inputNames, formatValue, kbps, fade = null) {
  const fmt = getMergeFormat(formatValue);
  if (!fmt) throw new Error(`Unknown output format: ${formatValue}`);
  const { depth, rate, channels, steps } = layoutOf(probes, fmt);
  const sampleFmt = fmt.lossless ? FILTER_FMT[fmt.maxDepth ? upTo24(depth) : depth] : 'fltp';
  const on = Boolean(fade && fade.seconds > 0);
  const joins = probes.slice(1).map((_, i) => on && Boolean(fade.joins ? fade.joins[i] : true));
  const fadedJoins = joins.filter(Boolean).length;
  const fadeIn = on && Boolean(fade.fadeIn), fadeOut = on && Boolean(fade.fadeOut);
  const anyFade = fadedJoins > 0 || fadeIn || fadeOut;
  const fadeSamples = anyFade ? Math.round(fade.seconds * rate) : 0;
  if (fadeOut && !(fade.lastSamples > 0)) throw new Error('A fade-out needs the exact length of the last file (planLastCount).');
  const curve = anyFade ? curveOf(fade) : null;
  // Fades are mixed in floating point (doubles for 32-bit integers, which floats can't hold exactly), so an overlap
  // that sums above full scale is clipped by the final conversion rather than by the mixing code of whichever ffmpeg
  // build runs it. Outside the fades the samples pass through unchanged, and the conversion back to 16/24 bits is exact.
  const chainFmt = anyFade ? (fmt.lossless && (depth === 32 || depth === 'f64') ? 'dbl' : 'flt') : sampleFmt;
  const last = probes.length - 1;
  const chains = probes.map((p, i) => {
    const s = steps(p, chainFmt);
    if (i === 0 && fadeIn) s.push(`afade=t=in:ss=0:ns=${fadeSamples}:curve=${curve}`);
    if (i === last && fadeOut) s.push(`afade=t=out:ss=${Math.max(0, fade.lastSamples - fadeSamples)}:ns=${fadeSamples}:curve=${curve}`);
    return `[${i}:a:0]${s.join(',')}[a${i}]`;
  });
  let joined;
  if (!anyFade) {
    joined = `${probes.map((_, i) => `[a${i}]`).join('')}concat=n=${probes.length}:v=0:a=1`;
  } else if (!fadedJoins) {
    joined = `${probes.map((_, i) => `[a${i}]`).join('')}concat=n=${probes.length}:v=0:a=1,aformat=sample_fmts=${sampleFmt}`;
  } else {
    // File by file: a crossfade overlaps the last fadeSamples of what is already joined with the first ones of the
    // next file (or, without overlap, fades them out then the next file in); an unticked join is the plain join.
    const js = [];
    let cur = 'a0';
    for (let i = 1; i < probes.length; i++) {
      const next = i === last ? 'x' : `x${i}`;
      js.push(joins[i - 1]
        ? `[${cur}][a${i}]acrossfade=ns=${fadeSamples}:o=${fade.overlap === false ? 0 : 1}:c1=${curve}:c2=${curve}[${next}]`
        : `[${cur}][a${i}]concat=n=2:v=0:a=1[${next}]`);
      cur = next;
    }
    joined = `${js.join(';')};[x]aformat=sample_fmts=${sampleFmt}`;
  }
  const graph = `${chains.join(';')};${joined}${fmt.padEnd ? `[j];[j]apad=pad_len=${fmt.padEnd}` : ''}[out]`;
  const outputName = `output.${fmt.muxExt || fmt.ext}`;
  const k = fmt.kbps ? (fmt.kbps.includes(Number(kbps)) ? Number(kbps) : fmt.defaultKbps) : null;
  const codecArgs = fmt.lossless ? fmt.args(depth) : fmt.args(k);
  const args = [...LOG_INFO, ...inputNames.flatMap((n) => ['-i', n]), '-filter_complex', graph, '-map', '[out]', '-map_metadata', '-1', ...codecArgs, outputName];
  const rounded = fmt.lossless && fmt.maxDepth && !(typeof depth === 'number' && depth <= fmt.maxDepth);
  const resampled = probes.some((p) => (Number(p.sampleRate) || rate) !== rate);
  // Samples the crossfades take off the plain join (none without overlap).
  const lostSamples = fadedJoins && fade.overlap !== false ? fadedJoins * fadeSamples : 0;
  return { args, outputName, ext: fmt.ext, mime: fmt.mime, kbps: k, depth, rate, channels, rounded, resampled, fadedJoins, fadeSamples, lostSamples, fadeIn, fadeOut };
}

// ffprobe -of json output -> the fields planMerge needs.
export function parseProbe(json) {
  const j = typeof json === 'string' ? JSON.parse(json) : json;
  const s = (j.streams || []).find((x) => x.codec_type === 'audio') || (j.streams || [])[0];
  if (!s) return null;
  return {
    codec: s.codec_name, container: j.format?.format_name || '', sampleRate: Number(s.sample_rate) || 0,
    channels: Number(s.channels) || 0, sampleFmt: s.sample_fmt || '', bits: Number(s.bits_per_raw_sample) || Number(s.bits_per_sample) || 0,
    duration: Number(j.format?.duration) || Number(s.duration) || 0,
  };
}

// Shared ffmpeg.wasm output-format definitions for the audio-tools family
// (audio-converter, audio-booster, audio-compressor, audio-splitter).
//
// Every entry here was proven against a real downloaded file, not just
// found in ffmpeg's documented codec list -- this project's ffmpeg.wasm
// core (@ffmpeg/core 0.12.9, configured with --enable-gpl but WITHOUT
// --enable-libopencore-amrnb/amrwb) actually encodes each of these:
//   mp3/wav/aac/flac/ogg/m4a - pre-existing, proven by production use
//   opus -> ffmpeg's native encoder (libopus crashes in this core, see the entry below)
//   wma  -> wmav2 (native encoder, asf muxer)
//   aiff -> pcm_s16be (native, aiff muxer)
//   alac -> alac (native encoder; ffmpeg has no ".alac" muxer, so it's
//           muxed into .m4a like real-world Apple Lossless files, and the
//           encoder must be requested explicitly since .m4a defaults to AAC)
//   ac3  -> ac3 (native encoder)
// AMR was tested and deliberately excluded: ffmpeg reports "Default
// encoder for format amr (codec amr_nb) is probably disabled" and the
// exec() fails -- this build has no amr_nb/amr_wb encoder (opencore-amr is
// not compiled in), even though it CAN decode AMR files it's given as
// input. Do not add 'amr' as an output format without recompiling ffmpeg's
// core with --enable-libopencore-amrnb.
export const AUDIO_OUTPUT_FORMATS = [
  { value: 'mp3', label: 'MP3', ext: 'mp3', mime: 'audio/mpeg' },
  { value: 'wav', label: 'WAV', ext: 'wav', mime: 'audio/wav' },
  { value: 'aac', label: 'AAC', ext: 'aac', mime: 'audio/aac' },
  { value: 'flac', label: 'FLAC', ext: 'flac', mime: 'audio/flac' },
  { value: 'ogg', label: 'OGG (Vorbis)', ext: 'ogg', mime: 'audio/ogg' },
  { value: 'm4a', label: 'M4A (AAC)', ext: 'm4a', mime: 'audio/mp4' },
  // libopus crashes in this ffmpeg.wasm core ("RuntimeError: memory access out of bounds", reproduced
  // 2026-09-23 with float AND 16-bit input): ffmpeg's own Opus encoder is used in the browser instead
  // (valid Ogg Opus, OpusHead checked). Audio Converter sends Opus to the media service (real libopus).
  { value: 'opus', label: 'Opus', ext: 'opus', mime: 'audio/opus', extraArgs: ['-c:a', 'opus', '-strict', '-2'] },
  { value: 'wma', label: 'WMA', ext: 'wma', mime: 'audio/x-ms-wma' },
  { value: 'aiff', label: 'AIFF', ext: 'aiff', mime: 'audio/aiff' },
  { value: 'alac', label: 'ALAC (Apple Lossless, .m4a)', ext: 'm4a', mime: 'audio/mp4', extraArgs: ['-c:a', 'alac'] },
  { value: 'ac3', label: 'AC3 (Dolby Digital)', ext: 'ac3', mime: 'audio/ac3' },
  // P21 (02/10), format coverage (CloudConvert's audio converter offers M4R, M4B, MP2, AU, CAF, WV, MKA). Each one
  // proven on a real file read back by ffprobe (scripts/browser-tests/p21-audio-formats.mjs). ffmpeg names no muxer
  // after .m4r / .m4b: both are AAC in Apple's MP4 ("ipod" muxer), as iTunes writes them.
  { value: 'm4r', label: 'M4R (iPhone ringtone, AAC)', ext: 'm4r', mime: 'audio/mp4', // its real type (Save / Share, previews); the Download link is retyped octet-stream since P31, so Firefox keeps .m4r
    extraArgs: ['-c:a', 'aac', '-f', 'ipod'] },
  { value: 'm4b', label: 'M4B (audiobook, AAC)', ext: 'm4b', mime: 'audio/mp4', extraArgs: ['-c:a', 'aac', '-f', 'ipod'] },
  { value: 'mp2', label: 'MP2 (MPEG Layer II)', ext: 'mp2', mime: 'audio/mpeg', extraArgs: ['-c:a', 'mp2'] },
  { value: 'wv', label: 'WV (WavPack, lossless)', ext: 'wv', mime: 'audio/x-wavpack', extraArgs: ['-c:a', 'wavpack'] },
  { value: 'caf', label: 'CAF (Apple Core Audio)', ext: 'caf', mime: 'audio/x-caf', extraArgs: ['-c:a', 'pcm_s16le'] },
  { value: 'au', label: 'AU (Sun / NeXT)', ext: 'au', mime: 'audio/basic', extraArgs: ['-c:a', 'pcm_s16be'] },
  { value: 'mka', label: 'MKA (Matroska audio, FLAC)', ext: 'mka', mime: 'audio/x-matroska', extraArgs: ['-c:a', 'flac'] },
];

// Formats where a target bitrate (-b:a) is meaningful -- lossless codecs
// (WAV/FLAC/AIFF/ALAC) ignore or reject a bitrate target, so Audio
// Compressor's format choices are restricted to this subset.
export const COMPRESSIBLE_AUDIO_FORMATS = AUDIO_OUTPUT_FORMATS.filter((f) =>
  ['mp3', 'aac', 'm4a', 'ogg', 'opus', 'wma', 'ac3', 'm4b', 'mp2'].includes(f.value)
);

export function getAudioFormat(value) {
  return AUDIO_OUTPUT_FORMATS.find((f) => f.value === value) || AUDIO_OUTPUT_FORMATS[0];
}

// P21 (02/10): quality choice for the lossy formats. Without -b:a, ffmpeg encodes MP3 / AAC at 128 kbps; 123apps
// offers 64 to 320 kbps ("Standard 128" by default), CloudConvert a bitrate field. Default here 192 kbps (above the
// usual "standard"), up to 320. Lossless formats ignore it.
export const AUDIO_BITRATES = [[128, 'Standard — 128 kbps'], [192, 'High — 192 kbps'], [256, 'Very high — 256 kbps'], [320, 'Best — 320 kbps']];
export const DEFAULT_AUDIO_KBPS = 192;
const BITRATE_FORMATS = new Set(['mp3', 'aac', 'm4a', 'm4r', 'm4b', 'ogg', 'wma', 'ac3', 'mp2']);
export const formatTakesBitrate = (formatValue) => BITRATE_FORMATS.has(getAudioFormat(formatValue).value);

// Builds the ffmpeg output filename + extra codec args + download MIME for
// a chosen format value (see getAudioFormat's ALAC comment for why this
// isn't just `output.${value}`). `kbps`: optional target bitrate for the lossy formats.
// P24 (03/10): sample rate and channels, as 123apps' audio converter ("sample rate", "channels") and FreeConvert
// (44.1 / 48 kHz) offer. Each format only takes the rates its encoder can write; another choice is refused with a
// sentence before encoding (never resampled to something else silently).
export const AUDIO_SAMPLE_RATES = [['', 'Keep the original'], [48000, '48 kHz (video)'], [44100, '44.1 kHz (CD)'], [32000, '32 kHz'], [22050, '22.05 kHz'], [16000, '16 kHz (speech)'], [8000, '8 kHz (telephone)']];
export const AUDIO_CHANNELS = [['', 'Keep the original'], [1, 'Mono'], [2, 'Stereo']];
// mp2 is offered up to 320 kbps, which MPEG-2 (16-24 kHz) Layer II cannot hold (160 at most); libvorbis has no setting for our
// bitrates below 32 kHz (review 03/10): those rates are refused with the sentence below instead of failing obscurely.
const RATES_BY_FORMAT = { opus: [48000, 24000, 16000, 12000, 8000], ac3: [48000, 44100, 32000], mp2: [48000, 44100, 32000], ogg: [48000, 44100, 32000] };
export function buildOutputSpec(formatValue, kbps, { sampleRate, channels } = {}) {
  const fmt = getAudioFormat(formatValue);
  const rate = Number(sampleRate) || 0, ch = Number(channels) || 0;
  const allowed = RATES_BY_FORMAT[fmt.value];
  if (rate && allowed && !allowed.includes(rate)) throw new Error(`${fmt.label} cannot be written at ${rate / 1000} kHz. Choose ${allowed.map((r) => r / 1000 + ' kHz').join(', ')}, or keep the original rate.`);
  const resample = [...(rate ? ['-ar', String(rate)] : []), ...(ch ? ['-ac', String(ch)] : [])];
  // P37: the chosen bitrate is written as chosen. AC3 and MP2 were raised to 192 kbps, so "Standard — 128 kbps" gave a
  // 192 kbps file; 128 is a valid bitrate of both (AC-3 table 32-640, MPEG-1 Layer II table 32-384).
  const bitrateArgs = kbps && BITRATE_FORMATS.has(fmt.value) ? ['-b:a', `${kbps}k`] : [];
  return { outputName: 'output.' + fmt.ext, extraArgs: [...(fmt.extraArgs || []), ...bitrateArgs, ...resample], mime: fmt.mime, ext: fmt.ext };
}

// A real input file's own extension, sanitized to plain alphanumerics so it
// can't break out of ffmpeg's virtual filesystem path or (for the concat
// list-file case elsewhere) a quoted list-file line. Falls back to 'dat'
// for an extension-less or unusual filename -- ffmpeg still demuxes most
// formats from content, not extension, so this only affects the few
// formats (raw PCM, etc.) that truly need the extension as a hint.
export function sanitizedInputExt(file) {
  const raw = (file.name.split('.').pop() || 'dat').toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(raw) ? raw : 'dat';
}

// P31 (03/10): what the first bytes of each output format must be. An iPhone saved an M4R as "….m4r.html" (an HTML
// page under the file's name): a result is checked before it is offered, and a wrong one fails loudly instead.
const sig = (b, off, s) => [...s].every((c, i) => b[off + i] === c.charCodeAt(0));
const mpegSync = (b) => b[0] === 0xff && (b[1] & 0xe0) === 0xe0;
const OUTPUT_MAGIC = {
  mp3: (b) => sig(b, 0, 'ID3') || mpegSync(b), mp2: (b) => sig(b, 0, 'ID3') || mpegSync(b),
  wav: (b) => sig(b, 0, 'RIFF') && sig(b, 8, 'WAVE'), aac: (b) => (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) || sig(b, 0, 'ADIF'),
  flac: (b) => sig(b, 0, 'fLaC'), ogg: (b) => sig(b, 0, 'OggS'), opus: (b) => sig(b, 0, 'OggS'),
  m4a: (b) => sig(b, 4, 'ftyp'), m4r: (b) => sig(b, 4, 'ftyp'), m4b: (b) => sig(b, 4, 'ftyp'), alac: (b) => sig(b, 4, 'ftyp'),
  wma: (b) => b[0] === 0x30 && b[1] === 0x26 && b[2] === 0xb2 && b[3] === 0x75, aiff: (b) => sig(b, 0, 'FORM') && sig(b, 8, 'AIF'),
  ac3: (b) => b[0] === 0x0b && b[1] === 0x77, wv: (b) => sig(b, 0, 'wvpk'), caf: (b) => sig(b, 0, 'caff'), au: (b) => sig(b, 0, '.snd'),
  mka: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
};
export const AUDIO_OUTPUT_MAGIC = OUTPUT_MAGIC;
/** null when `bytes` really is the format `value`; otherwise the sentence to show (never offer such a file). */
export function audioOutputProblem(value, bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const fmt = getAudioFormat(value);
  if (!b.length) return 'The converted file came out empty. Please try again, or choose another format.';
  const ok = OUTPUT_MAGIC[fmt.value];
  if (ok && !ok(b)) return `The converted file is not a real ${fmt.label} file, so it is not offered. Please try again, or choose another format.`;
  return null;
}

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
  { value: 'm4r', label: 'M4R (iPhone ringtone, AAC)', ext: 'm4r', mime: 'application/octet-stream', // audio/mp4 and audio/x-m4r made Firefox save it as .m4a (measured 02/10)
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

// Builds the ffmpeg output filename + extra codec args + download MIME for
// a chosen format value (see getAudioFormat's ALAC comment for why this
// isn't just `output.${value}`).
export function buildOutputSpec(formatValue) {
  const fmt = getAudioFormat(formatValue);
  return { outputName: 'output.' + fmt.ext, extraArgs: fmt.extraArgs || [], mime: fmt.mime, ext: fmt.ext };
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

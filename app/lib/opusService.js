// Opus for the audio tools that process in the browser (Audio Booster, Audio Splitter, Audio Compressor), as Audio
// Converter already does: the tool renders its result losslessly (FLAC) with ffmpeg.wasm, then the media service
// encodes it with the real libopus.
// Why: ffmpeg's native Opus encoder (the only one that runs in ffmpeg.wasm -- libopus crashes there, see
// lib/audioFormats.js) came out further from the source than libopus 6 times out of 6 at equal size on the Zimtohrli
// metric (24/09/2026, scripts/browser-tests/opus-zimtohrli.py). Without the service configured, the tools keep the
// in-browser encoder.
import { runMediaJob, mediaServiceConfigured } from './mediaJob';

export const opusOnService = (format) => format === 'opus' && mediaServiceConfigured();

// ffmpeg.wasm output arguments for the lossless intermediate sent to the service.
export const LOSSLESS_INTERMEDIATE = { name: 'intermediate.flac', args: ['-c:a', 'flac'] };

// bytes: the FLAC rendered by the tool. kbps: an exact bitrate (Audio Compressor), else the service's default
// (128 kbit/s, same as Audio Converter). Returns the Opus Blob.
export async function encodeOpusOnService(bytes, baseName, { kbps, onPct, signal } = {}) {
  const file = new File([bytes], `${baseName}.flac`, { type: 'audio/flac' });
  const out = await runMediaJob({
    file, op: 'convert', params: { target: 'opus', quality: 'medium', ...(kbps ? { kbps: Number(kbps) } : {}) }, signal,
    onStage: (s) => { if (onPct && typeof s.pct === 'number') onPct(s.pct); },
  });
  if (!out.bytes || out.ext !== 'opus') throw new Error('The service returned no Opus file.');
  // The service sends it as audio/ogg; Firefox then saves "name.opus" as "name.ogg" (measured 26/09/2026).
  return new Blob([out.blob], { type: 'audio/opus' });
}

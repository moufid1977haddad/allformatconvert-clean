// Video Converter's request to the video service, built from the page's settings (pure, tested in node:
// scripts/p37/video-converter.test.mjs).
export const AUDIO_TARGETS = [
  ['mp3', 'MP3'], ['m4a', 'M4A (AAC)'], ['aac', 'AAC'], ['wav', 'WAV'], ['aiff', 'AIFF'], ['ogg', 'OGG (Vorbis)'], ['opus', 'Opus'],
  ['flac', 'FLAC'], ['wma', 'WMA'], ['ac3', 'AC3'], ['amr', 'AMR (voice, 8 kHz mono)'],
];
// P25 (03/10, E5): FreeConvert's "advanced settings" and 123apps' editors — mirror, speed, volume, fades and an exact
// CRF — for the video outputs the service edits (MP4 in H.264 / H.265 / AV1, MOV, M4V). Nothing sent when left as is:
// the request (and the service's command) is then exactly the one of before.
export const EDITABLE = ['mp4', 'h265', 'av1', 'mov', 'm4v'];

export function advancedParams(p) {
  const out = {};
  if (p.flip) out.flip = p.flip;
  if (p.speed && p.speed !== '1') out.speed = Number(p.speed);
  if (p.volume !== '' && Number(p.volume) !== 100) out.volume = Math.round(Number(p.volume)) / 100;
  if (Number(p.fadeIn) > 0) out.fadeIn = Number(p.fadeIn);
  if (Number(p.fadeOut) > 0) out.fadeOut = Number(p.fadeOut);
  if ((out.fadeIn || out.fadeOut) && p.fadeVideo) out.fadeVideo = true;
  if (p.crf !== '') out.crf = Math.round(Number(p.crf));
  return out;
}

const isAudio = (target) => AUDIO_TARGETS.some(([v]) => v === target);

export function buildConvertParams(p) {
  const base = { target: p.target, quality: p.quality, ...(p.maxHeight && !isAudio(p.target) ? { maxHeight: Number(p.maxHeight) } : {}) };
  const adv = EDITABLE.includes(p.target) ? advancedParams(p) : {};
  if (!Object.keys(adv).length) return base;
  // H.265 / AV1 with edits: an MP4 with that codec (the same file the h265 / av1 targets give)
  return p.target === 'h265' || p.target === 'av1' ? { ...base, target: 'mp4', codec: p.target, ...adv } : { ...base, ...adv };
}

// P37: our video service draws a speed or a mirror with the same picture filter chain as a size, and refuses a
// "Resolution" limit next to them ("Choose either a size or a maximum height.", services/media-processing/app/
// ffmpeg_ops.py, build_command). That refusal came only after the whole video was uploaded: the page now says it
// before, and the "Convert" button stays off until one of the two is removed. Volume, fades and CRF are not concerned.
export function editConflict(p) {
  const built = buildConvertParams(p);
  if (!built.maxHeight || !(built.flip || built.speed)) return null;
  const what = built.flip && built.speed ? 'a speed and a mirror' : built.speed ? 'a speed' : 'a mirror';
  return `A "Resolution" limit cannot be combined with ${what}. Set "Resolution" to "Keep original resolution", or set "Speed" to "Normal speed" and "Mirror" to "None".`;
}

// How a converted file's size compares with the original, said the same way on every converter (P21, 02/10).
//
// Why: the owner's iPhone showed "443% larger" (JPG -> PNG) and "100% larger" (HEIC -> JPG) in orange with no word of
// explanation, which reads as a failure. Nothing failed: PNG keeps every pixel (lossless) and HEIC compresses about
// twice as well as JPG. CloudConvert, Convertio and iLoveIMG show only the new file's size (no percentage, no colour);
// we keep the comparison, which is useful, but a larger result is never shown as an error: it is neutral, and one line
// says why it grew and what to choose instead.

const LOSSLESS = new Set(['png', 'bmp', 'tif', 'tiff', 'gif', 'ico', 'wav', 'flac', 'aif', 'aiff', 'alac', 'pcm']);
const NAMES = { jpg: 'JPG', jpeg: 'JPG', png: 'PNG', webp: 'WebP', avif: 'AVIF', heic: 'HEIC', heif: 'HEIC', gif: 'GIF', bmp: 'BMP', tif: 'TIFF', tiff: 'TIFF', ico: 'ICO', svg: 'SVG',
  mp3: 'MP3', m4a: 'M4A', aac: 'AAC', ogg: 'OGG', opus: 'Opus', wav: 'WAV', flac: 'FLAC', aif: 'AIFF', aiff: 'AIFF', wma: 'WMA',
  mp4: 'MP4', mov: 'MOV', webm: 'WebM', mkv: 'MKV', avi: 'AVI', wmv: 'WMV', '3gp': '3GP' };
// Formats that hold the same picture or sound in fewer bytes than the usual one (HEIC/AVIF/WebP vs JPG; Opus vs MP3;
// HEVC/AV1 phone videos and WebM vs H.264 MP4).
const EFFICIENT = { heic: 3, heif: 3, avif: 3, webp: 2, jpg: 1, jpeg: 1, opus: 3, ogg: 2, m4a: 2, aac: 2, mp3: 1, webm: 2, mkv: 1, mov: 1, mp4: 1 };

export function formatKey(nameOrType) {
  const s = String(nameOrType || '').toLowerCase();
  const ext = (/\.([a-z0-9]{2,5})$/.exec(s) || [])[1];
  if (ext) return ext === 'jpeg' ? 'jpg' : ext === 'tiff' ? 'tif' : ext;
  const sub = (s.split('/')[1] || '').split(/[;+]/)[0];
  return { jpeg: 'jpg', 'x-ms-bmp': 'bmp', tiff: 'tif', quicktime: 'mov', mpeg: 'mp3', 'x-wav': 'wav', wave: 'wav', 'x-m4a': 'm4a', mp4: 'mp4' }[sub] || sub;
}
const label = (k) => NAMES[k] || (k ? k.toUpperCase() : 'the original');

/** Percentage of change, rounded: > 0 smaller, < 0 larger. */
export function sizeGain(inBytes, outBytes) {
  if (!inBytes || !outBytes) return 0;
  return Math.round((1 - outBytes / inBytes) * 100);
}

/** " (31% smaller)" / " (443% larger)" / "" — for a line such as "was 2.1 MB (31% smaller)". */
export function sizeChangeText(inBytes, outBytes) {
  const g = sizeGain(inBytes, outBytes);
  return g > 0 ? ` (${g}% smaller)` : g < 0 ? ` (${Math.abs(g)}% larger)` : '';
}

/**
 * One line saying why a converted file is larger than the original, and what the visitor can do — or null when it
 * is not larger. `from` / `to`: a file name or MIME type each. `kind`: 'image' | 'audio' | 'video' (wording only).
 */
export function whyLarger({ from, to, inBytes, outBytes, kind = 'image' }) {
  if (!(outBytes > inBytes)) return null;
  const a = formatKey(from), b = formatKey(to);
  const A = label(a), B = label(b);
  const smallerChoice = kind === 'image' ? 'JPG, WebP or AVIF' : kind === 'audio' ? 'MP3, M4A or Opus' : 'MP4 with a lower quality or resolution';
  if (LOSSLESS.has(b) && !LOSSLESS.has(a)) {
    return `Normal for ${B}: it is lossless and stores every ${kind === 'image' ? 'pixel' : 'sample'} exactly, while your ${A} was compressed. Nothing was lost; for a smaller file, convert to ${smallerChoice} instead.`;
  }
  if (a && b && a !== b && (EFFICIENT[a] || 0) > (EFFICIENT[b] || 0)) {
    return `Normal: ${A} stores the same ${kind === 'image' ? 'picture' : kind} in fewer bytes than ${B}, so the ${B} copy is larger. ${B} opens everywhere; if size matters more, keep the ${A} or lower the quality.`;
  }
  if (a && a === b) {
    return `Your original was already more compressed than the setting you chose. Lower the quality, or keep your original.`;
  }
  return `The ${B} format holds this ${kind === 'image' ? 'image' : kind} less compactly than your ${A}. Lower the quality, or keep your original if you only need a smaller file.`;
}

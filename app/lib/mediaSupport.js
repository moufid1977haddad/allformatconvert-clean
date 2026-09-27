// Shared guards for the "silent lie" failure class found on real Safari
// (docs/audit/RAPPORT-safari-defauts.md): a tool announcing success while
// handing over an empty file, a file whose extension does not match its real
// content, or a format the browser never actually produced.
//
// Three rules enforced here, for every browser-side tool:
//   1. never announce success without checking the output exists and is not empty;
//   2. never name a file after what was REQUESTED -- name it after the real
//      type of the blob that was produced;
//   3. when the browser cannot produce the requested format, say so BEFORE the
//      user runs anything, not when they open the file.

export class OutputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OutputError';
  }
}

const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
  'image/tiff': 'tiff',
  'application/pdf': 'pdf',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
};

// "video/webm;codecs=vp9,opus" -> "video/webm"
export const baseMime = (mime) => String(mime || '').split(';')[0].trim().toLowerCase();

export const extFromMime = (mime, fallback = 'bin') => EXT_BY_MIME[baseMime(mime)] || fallback;

// ---------------------------------------------------------------------------
// Canvas output
// ---------------------------------------------------------------------------

// Ceiling that fails on EVERY engine (Chrome/Firefox/Safari: 32767 per side,
// 268,435,456 px area). Measured on real Safari 17.6: a 32000x24000 canvas
// (768 MP) silently yields "data:," -- and the UI announced success.
// Some engines (iOS Safari) fail well below this, which is why the encoded
// result is ALSO verified below instead of trusting this guard alone.
export const CANVAS_MAX_SIDE = 32767;
export const CANVAS_MAX_AREA = 268435456;

// Returns an error message when a canvas of this size cannot exist, else ''.
export function canvasSizeProblem(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return 'The output image would have no valid size.';
  }
  if (width > CANVAS_MAX_SIDE || height > CANVAS_MAX_SIDE || width * height > CANVAS_MAX_AREA) {
    const mp = Math.round((width * height) / 1e6);
    return `The result would be ${Math.round(width)}×${Math.round(height)} px (${mp} megapixels), larger than any browser can produce. Choose a smaller size or scale factor.`;
  }
  return '';
}

export function assertCanvasSize(width, height) {
  const problem = canvasSizeProblem(width, height);
  if (problem) throw new OutputError(problem);
}

// toDataURL that refuses to return a data URL that is empty ("data:,", what
// an oversized canvas produces) or of another type than requested (what a
// browser that cannot encode the format produces: it silently falls back to PNG).
export function checkedDataURL(canvas, type = 'image/png', quality) {
  const url = quality === undefined ? canvas.toDataURL(type) : canvas.toDataURL(type, quality);
  if (!url || url.length < 32 || !url.startsWith('data:')) {
    throw new OutputError(
      'Your browser could not produce this image — it is probably too large for this device. Try a smaller image or a smaller scale factor.'
    );
  }
  const actual = url.slice(5, url.indexOf(';'));
  if (actual !== type) {
    throw new OutputError(
      `This browser cannot encode ${type.replace('image/', '').toUpperCase()} (it produced ${actual.replace('image/', '').toUpperCase()} instead). Use a different browser, or choose another output format.`
    );
  }
  return url;
}

// Same guarantees for canvas.toBlob / OffscreenCanvas.convertToBlob. Resolves
// to the blob only when it is non-empty and of the requested type.
export async function checkedBlob(canvas, type = 'image/png', quality) {
  const blob = await new Promise((resolve) => {
    if (typeof canvas.convertToBlob === 'function') {
      canvas.convertToBlob({ type, quality }).then(resolve, () => resolve(null));
    } else {
      canvas.toBlob(resolve, type, quality);
    }
  });
  if (!blob || blob.size === 0) {
    throw new OutputError(
      'Your browser could not produce this image — it is probably too large for this device. Try a smaller image.'
    );
  }
  if (baseMime(blob.type) !== type) {
    throw new OutputError(
      `This browser cannot encode ${type.replace('image/', '').toUpperCase()} (it produced ${baseMime(blob.type).replace('image/', '').toUpperCase() || 'another format'} instead). Use a different browser, or choose another output format.`
    );
  }
  return blob;
}

// JPEG has no alpha channel: every browser encodes transparent pixels as BLACK
// (measured 2026-09-22: a transparent product PNG came out of image-converter and
// image-compressor with a black background, and the converter shows no preview).
// Paint white UNDER what is already drawn -- what image editors and the reference
// converters do -- right before encoding to JPEG. Works on OffscreenCanvas too.
export function flattenOntoWhite(ctx, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Synchronous probe: can THIS browser encode the type from a canvas? Must run
// in the browser (useEffect), never during render on the server.
const encodeProbeCache = {};
export function canEncodeImageType(type) {
  if (type === 'image/png') return true;
  if (type in encodeProbeCache) return encodeProbeCache[type];
  let ok = false;
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    ok = c.toDataURL(type).startsWith(`data:${type}`);
  } catch {
    ok = false;
  }
  encodeProbeCache[type] = ok;
  return ok;
}

// ---------------------------------------------------------------------------
// MediaRecorder / captureStream
// ---------------------------------------------------------------------------

const VIDEO_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
];

const AUDIO_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

// First recording type this browser really supports, or null. Chrome/Firefox
// pick WebM; Safari 17 picks MP4 (it cannot record WebM before Safari 18.4).
export function pickRecorderMime(kind = 'video') {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return null;
  const list = kind === 'audio' ? AUDIO_CANDIDATES : VIDEO_CANDIDATES;
  return list.find((m) => MediaRecorder.isTypeSupported(m)) || null;
}

// Capturing a <video> element as a stream: Safari has no captureStream() on
// HTMLMediaElement (Firefox historically only mozCaptureStream).
export function captureMediaElementStream(el) {
  if (typeof el.captureStream === 'function') return el.captureStream();
  if (typeof el.mozCaptureStream === 'function') return el.mozCaptureStream();
  return null;
}

export const supportsMediaElementCapture = () =>
  typeof HTMLMediaElement !== 'undefined' &&
  (typeof HTMLMediaElement.prototype.captureStream === 'function' ||
    typeof HTMLMediaElement.prototype.mozCaptureStream === 'function');

// What a tool built on "play the <video> and re-record it" needs. Returns
// { ok, mime, ext, reason }. `reason` is a message meant for the visitor,
// shown BEFORE they select a file or press anything.
export function videoReRecordSupport({ fromMediaElement = false } = {}) {
  if (typeof window === 'undefined') return { ok: true, mime: null, ext: 'webm', reason: '' };
  if (fromMediaElement && !supportsMediaElementCapture()) {
    return {
      ok: false,
      mime: null,
      ext: 'webm',
      reason:
        'This browser (Safari, including every browser on iPhone) cannot re-record a video element, so this tool cannot run here. Please open it in Chrome, Edge or Firefox on a computer.',
    };
  }
  const mime = pickRecorderMime('video');
  if (!mime) {
    return {
      ok: false,
      mime: null,
      ext: 'webm',
      reason: 'This browser cannot record video, so this tool cannot run here. Please open it in Chrome, Edge or Firefox.',
    };
  }
  return { ok: true, mime, ext: extFromMime(mime, 'webm'), reason: '' };
}

// Final blob of a recording. Named and typed after what the recorder REALLY
// produced (recorder.mimeType), never after what was asked. Throws when the
// recording is empty, so a tool can never announce success on an empty file.
export function finishRecording(chunks, recorder, fallbackMime) {
  const blob = new Blob(chunks, { type: baseMime(recorder && recorder.mimeType) || baseMime(fallbackMime) });
  if (blob.size === 0) {
    throw new OutputError('The recording came out empty, so nothing was saved. Please try again, or try a different browser.');
  }
  return { blob, ext: extFromMime(blob.type, 'webm') };
}

// ---------------------------------------------------------------------------
// File-picker `accept` lists
// ---------------------------------------------------------------------------
// Project rule: the MAXIMUM of formats, never one or two. The MIME wildcard
// alone is not enough: the picker filters by the OS's MIME registry, which
// hides common containers on some systems, and iPhone videos are .mov
// (video/quicktime) while a narrow `video/mp4` refused them outright.
// Extensions are listed explicitly next to the wildcard. A container the
// browser (or ffmpeg) cannot decode is reported by each tool with its own
// message -- refusing it at the picker just hides the problem.
export const VIDEO_ACCEPT =
  'video/*,.mp4,.m4v,.mov,.qt,.webm,.mkv,.avi,.wmv,.flv,.ogv,.3gp,.3g2,.mpg,.mpeg,.ts,.mts,.m2ts';
// Encrypted music files from streaming apps. They are not audio a converter can
// read: the sound is encrypted for the app that downloaded it (NetEase Cloud
// Music .ncm, QQ Music .qmc*/.mflac/.mgg, KuGou .kgm/.kgma/.vpr, Kuwo .kwm,
// Apple Music/iTunes protected .m4p, Audible .aa/.aax). A visitor
// sent one (tool_errors line 24, audio-converter, .ncm) and got a raw ffmpeg
// error. Reference converters refuse them too; we say why, and what to do.
const ENCRYPTED_MUSIC = {
  ncm: 'NetEase Cloud Music', qmc0: 'QQ Music', qmc2: 'QQ Music', qmc3: 'QQ Music', qmcflac: 'QQ Music', qmcogg: 'QQ Music',
  mflac: 'QQ Music', mflac0: 'QQ Music', mgg: 'QQ Music', mgg1: 'QQ Music', tkm: 'QQ Music', bkcmp3: 'QQ Music', bkcflac: 'QQ Music',
  kgm: 'KuGou', kgma: 'KuGou', vpr: 'KuGou', kwm: 'Kuwo', m4p: 'Apple Music / iTunes', aa: 'Audible', aax: 'Audible',
};
export function encryptedMusicMessage(fileName) {
  const ext = String(fileName || '').split('.').pop().toLowerCase();
  const app = ENCRYPTED_MUSIC[ext];
  if (!app) return null;
  return `This .${ext} file is an encrypted download from ${app}: its sound can only be played inside that app, so no converter can read it. Save or export the song from ${app} as MP3, FLAC or another standard format (if your subscription allows it), then open that file here.`;
}

export const AUDIO_ACCEPT =
  'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.oga,.opus,.wma,.aiff,.aif,.amr,.mka,.weba,.caf';

// ---------------------------------------------------------------------------
// Video frame / GIF output guards
// ---------------------------------------------------------------------------

// A <video> whose frames were never decoded reports 0x0. Drawing it yields a
// transparent canvas and the encoder still "succeeds" with an empty GIF.
export function assertVideoReadable(video) {
  if (!video || !video.videoWidth || !video.videoHeight) {
    throw new OutputError(
      "This video's frames could not be read (its codec is probably not supported by this browser), so nothing was converted. Try re-exporting it as standard H.264 MP4."
    );
  }
}

// `data` is RGBA from getImageData. A frame with alpha 0 everywhere was never
// painted (undecoded / not yet seeked).
export function assertFrameNotBlank(data) {
  for (let i = 3; i < data.length; i += 4 * 61) {
    if (data[i] !== 0) return;
  }
  // stride sampling can miss a sparse image; confirm with a full scan before failing
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return;
  }
  throw new OutputError(
    'A frame came out empty — the browser could not decode this part of the video, so no GIF was produced. Try another file or re-export it as H.264 MP4.'
  );
}

const onceEvent = (el, name, ms) => new Promise((resolve) => {
  const done = () => { clearTimeout(t); el.removeEventListener(name, done); resolve(); };
  const t = setTimeout(done, ms);
  el.addEventListener(name, done);
});

// True when nothing was painted: a video frame not decoded yet draws nothing
// (alpha 0 everywhere). Sampled on a 32x32 reduction.
function canvasLooksUnpainted(canvas) {
  const probe = document.createElement('canvas');
  probe.width = 32; probe.height = 32;
  const p = probe.getContext('2d', { willReadFrequently: true });
  p.drawImage(canvas, 0, 0, 32, 32);
  const d = p.getImageData(0, 0, 32, 32).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] !== 0) return false;
  return true;
}

// Draws the video's CURRENT frame on a new canvas of its own size, and only
// once that frame is really decoded. Chromium does not decode a frame of a
// video that has not been played (drawImage then paints nothing, and a JPG made
// from it came out all white -- the white we paint under a JPG -- measured
// 28/09). So: wait for 'loadeddata', and if the drawing is still empty, seek to
// the same time (which makes every browser decode that frame) and try again.
// Throws OutputError rather than ever returning an empty picture.
export async function drawDecodedVideoFrame(video) {
  if (video.readyState < 2) await onceEvent(video, 'loadeddata', 8000);
  assertVideoReadable(video);
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  for (let attempt = 0; attempt < 3; attempt++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (!canvasLooksUnpainted(canvas)) return canvas;
    const t = video.currentTime;
    const seeked = onceEvent(video, 'seeked', 5000);
    video.currentTime = attempt === 0 ? t : Math.min(t + 0.001, Math.max(0, (video.duration || t) - 0.001));
    await seeked;
    await new Promise((r) => (video.requestVideoFrameCallback ? video.requestVideoFrameCallback(() => r()) : requestAnimationFrame(() => r())));
  }
  throw new OutputError('This frame could not be read yet — play the video for a moment (or move the slider), then capture again.');
}

// GIF bytes -> Blob, refusing anything that is not a real GIF.
export function gifBlobFromBytes(bytes) {
  const head = String.fromCharCode(...bytes.slice(0, 6));
  if (!bytes || bytes.length < 20 || (head !== 'GIF89a' && head !== 'GIF87a')) {
    throw new OutputError('The GIF encoder produced no valid file, so nothing was saved. Please try again.');
  }
  return new Blob([bytes], { type: 'image/gif' });
}

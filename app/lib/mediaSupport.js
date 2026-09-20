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
export const AUDIO_ACCEPT =
  'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.oga,.opus,.wma,.aiff,.aif,.amr,.mka,.weba,.caf';

// One rule for every canvas of the site on iPhone and iPad (P31, 03/10).
//
// iOS / iPadOS Safari refuses a canvas over 16,777,216 pixels (4096 × 4096) — the context comes back null or the
// drawing is silently blank — and frees canvas memory late: several large canvases kept alive can make the next one
// fail the same way. Desktop browsers allow far more (Chrome / Firefox: 268 MP), so the cap applies on iOS only,
// iPadOS included (it says "Macintosh" with several touch points). Tools that render at a chosen scale (PDF pages,
// QR codes, barcodes, GIF frames) size their canvas with fitScale / fitSize; every temporary canvas is freed with
// freeCanvas (width = height = 0, as WebKit advises) as soon as its pixels are encoded; and a long step that might
// never finish on a device is bounded by withTimeout, which shows a clear message instead of a frozen page.

export const IOS_CANVAS_MAX_PIXELS = 16_777_216;

/** The same check on a given navigator-like object {userAgent, platform, maxTouchPoints} (pure, tested in node). */
export function appleTouchFrom(nav) {
  if (!nav) return false;
  const ua = nav.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || ((/Macintosh/.test(ua) || nav.platform === 'MacIntel') && nav.maxTouchPoints > 1);
}

export function isAppleTouchDevice() {
  if (typeof navigator === 'undefined') return false;
  return appleTouchFrom(navigator);
}

/** The largest canvas area (pixels) this device draws reliably. Tests set self.__forceSafariCanvasCap. */
export function maxCanvasPixels() {
  if (typeof self !== 'undefined' && self.__forceSafariCanvasCap === true) return IOS_CANVAS_MAX_PIXELS;
  return isAppleTouchDevice() ? IOS_CANVAS_MAX_PIXELS : 268_435_456;
}

/** The scale to draw a w × h (at scale 1) surface at: `wanted`, or less so that it fits the device (1 % margin). */
export function fitScale(w, h, wanted = 1) {
  const fit = Math.sqrt(maxCanvasPixels() / Math.max(1, w * h)) * 0.99;
  return Math.min(wanted, fit);
}

/** { width, height, reduced } of a w × h canvas made to fit the device, keeping the aspect ratio. */
export function fitSize(w, h) {
  const s = fitScale(w, h, 1);
  return s >= 1 ? { width: Math.round(w), height: Math.round(h), reduced: false } : { width: Math.max(1, Math.floor(w * s)), height: Math.max(1, Math.floor(h * s)), reduced: true };
}

/** Frees a canvas's memory now (WebKit keeps it until garbage collection otherwise). */
export function freeCanvas(c) {
  if (!c) return;
  try { c.width = 0; c.height = 0; } catch { /* detached OffscreenCanvas */ }
}

export class StepTimeout extends Error {}
/** `promise`, or a StepTimeout with `message` after `ms` (onTimeout runs right after the rejection: cancel the work there). */
export function withTimeout(promise, ms, message, onTimeout) {
  let t;
  return Promise.race([
    promise,
    // reject FIRST: a cancel (PDF.js renderTask.cancel) rejects the work's own promise at once, and the race would
    // then show "Rendering cancelled" instead of the sentence (measured 03/10, WebKit)
    new Promise((_, reject) => { t = setTimeout(() => { reject(new StepTimeout(message)); try { onTimeout && onTimeout(); } catch { /* already done */ } }, ms); }),
  ]).finally(() => clearTimeout(t));
}

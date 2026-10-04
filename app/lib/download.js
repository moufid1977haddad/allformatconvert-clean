// Saving a file made in the page, the same way on every tool and every browser.
//
// THE rule (P31, 03/10, owner's iPhone on iOS 26): the file is handed over as a Blob RETYPED application/octet-stream,
// through a link carrying the download attribute and the full name (extension included) — never by navigating to it.
// - Why octet-stream: Safari (iPhone, iPad, Mac) shows a PDF, an image or a video it knows how to display instead of
//   saving it; a type it cannot display is always saved, under the download attribute's name. Firefox renamed a
//   ".m4r" typed audio/mp4 to ".m4a" (P21) — a neutral type keeps the name we give. Chrome and Edge save either way.
// - Why never a navigation: P21 (02/10) served the file from the service worker at /zipdl/f/<id>/<name> with
//   "Content-Disposition: attachment". On the real iPhone (03/10) the PDFs still opened full screen (Markdown, Text,
//   JPG, Word to PDF), and an M4R arrived as "memo-vocal.m4r.html": when that address is fetched outside the worker,
//   the site answers its 404 page (text/html), which Safari saved under the file's name plus ".html".
// The real type is kept where it matters: "Save / Share" (Apple's share sheet needs it to offer the right apps) and
// the tools' own previews (img, video, audio), which never use this module.

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** The same bytes as `blob`, typed application/octet-stream (no copy: a Blob made from a Blob shares its data). */
export function downloadableBlob(blob) {
  if (blob && blob.type === 'application/octet-stream') return blob;
  return new Blob([blob], { type: 'application/octet-stream' });
}

// When the visitor last touched or clicked. WebKit keeps a tap's "user gesture" alive across awaits for about one
// second only; a download started later may be refused by Safari. A file finished long after the tap (a ZIP built
// from many files, an archive entry extracted on demand) is then offered by a bar with one more tap on a real link.
let lastGestureAt = -Infinity;
if (typeof window !== 'undefined') {
  for (const ev of ['pointerup', 'touchend', 'click']) { // a keyboard Enter on a link fires 'click' too
    window.addEventListener(ev, () => { lastGestureAt = performance.now(); }, { capture: true, passive: true });
  }
}
const GESTURE_WINDOW_MS = 800;

// The anchor's own click, kept before the iOS bridge (IosDownloadBridge) wraps it.
export const nativeClick = typeof HTMLAnchorElement !== 'undefined' ? HTMLAnchorElement.prototype.click : null;

/** A blob: address of `blob` retyped octet-stream, for a link with the download attribute. Revoke it when done. */
export function downloadUrl(blob) {
  return URL.createObjectURL(downloadableBlob(blob));
}

function clickLink(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  a.setAttribute('data-ocv-retyped', '');
  document.body.appendChild(a);
  nativeClick.call(a);
  a.remove();
}

function offerTap(url, name) {
  const old = document.getElementById('ocv-download-tap');
  if (old) old.remove();
  const bar = document.createElement('div');
  bar.id = 'ocv-download-tap';
  bar.setAttribute('role', 'status');
  bar.setAttribute('data-download-tap', '');
  bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483000;display:flex;gap:8px;align-items:center;background:#171717;color:#fff;border-radius:14px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.35);font:600 14px/1.3 system-ui,-apple-system,sans-serif';
  const label = document.createElement('span');
  label.style.cssText = 'flex:1;min-width:0;overflow-wrap:anywhere';
  label.textContent = `${name} is ready.`;
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.setAttribute('data-ocv-retyped', '');
  link.textContent = 'Download';
  link.setAttribute('data-download-tap-link', '');
  link.style.cssText = 'background:#15803d;color:#fff;border-radius:10px;padding:0 16px;min-height:44px;display:inline-flex;align-items:center;text-decoration:none';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Close');
  close.style.cssText = 'background:transparent;color:#fff;border:0;min-width:44px;min-height:44px;font-size:18px';
  const done = () => { bar.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); };
  link.addEventListener('click', () => setTimeout(done, 0));
  close.addEventListener('click', done);
  bar.append(label, link, close);
  document.body.appendChild(bar);
}

/** Saves `blob` under `name` (the visitor's Downloads). Resolves once the download has been handed over. */
export async function saveBlob(blob, name) {
  const url = downloadUrl(blob);
  if (isIosDevice() && performance.now() - lastGestureAt >= GESTURE_WINDOW_MS) { offerTap(url, name); return; }
  clickLink(url, name);
  // Revoked later, never right after the click: Safari may still be reading it.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// "photo.HEIC" + ("inverted", "jpg") -> "photo-inverted.jpg". Keeps the visitor's own name, as iLoveIMG does
// ("photo_inverted.jpg"): a file called "result.png" is lost among the others in Downloads.
export function derivedName(originalName, suffix, ext) {
  const base = String(originalName || 'image').replace(/\.[^./\\]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120) || 'file';
  return `${base}${suffix ? `-${suffix}` : ''}.${ext}`;
}

// Files a page of before P31 made ready in Cache Storage (iPhone / iPad): removed on the next visit.
export async function purgeLegacyStaged() {
  try { if (typeof caches !== 'undefined') await caches.delete('ocv-downloads-v1'); } catch { /* storage unavailable */ }
}

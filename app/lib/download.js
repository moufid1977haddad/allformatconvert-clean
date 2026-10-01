// Saving a file made in the page, the same way on every tool.
//
// iPhone/iPad (owner's iPhone, 30/09): Safari opens a blob: link to a PDF or a video in its viewer instead of
// saving it ("Download" showed the PDF), and saves nothing at all from a data: link (Brightness & Contrast, Image
// Blur: "View / Download", then no file). iLovePDF and Smallpdf are not affected because their file comes from a
// server response carrying "Content-Disposition: attachment", which iOS always treats as a download (the
// Downloads sheet, then Files > Downloads, under the right name). We do the same without a server: the site's
// service worker (/zipdl/sw.js, scope /zipdl/ only) is handed the Blob and answers one navigation to
// /zipdl/<id>/<name> with it, as an attachment. Everywhere else (and if the worker is unavailable: private
// browsing, blocked storage) a blob: link with the download attribute, which desktop browsers save directly.

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// Tests set window.__forceAttachmentDownload to run the iPhone path in any engine.
export function attachmentPathActive() {
  return typeof window !== 'undefined' && (isIosDevice() || window.__forceAttachmentDownload === true);
}

const SW_URL = '/zipdl/sw.js';
const SCOPE = '/zipdl/';
// Files made ready for an iPhone / iPad download (P21, 02/10). Kept in Cache Storage rather than in the worker's
// memory: iOS stops an idle service worker after a few seconds, and a file held in its memory would be lost.
const CACHE = 'ocv-downloads-v1';
const STAGED_MAX_AGE_MS = 60 * 60 * 1000;

// When the visitor last touched or clicked. WebKit keeps a tap's "user gesture" alive across awaits for about one
// second only (UserGestureToken forwarding); a navigation started later is not the visitor's, and Safari then shows a
// PDF or an image instead of saving it. Seen on the owner's iPhone (02/10): JPG to PDF with a photo opened the PDF,
// Split PDF's small parts were saved — until P21 the file was read and handed to the worker AFTER the tap.
let lastGestureAt = -Infinity;
if (typeof window !== 'undefined') {
  for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) {
    window.addEventListener(ev, () => { lastGestureAt = performance.now(); }, { capture: true, passive: true });
  }
}
const GESTURE_WINDOW_MS = 800;

let swPromise = null;
function waitActivated(sw) {
  if (!sw || sw.state === 'activated') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), 10000);
    sw.addEventListener('statechange', () => {
      if (sw.state === 'activated') { clearTimeout(t); resolve(); }
      else if (sw.state === 'redundant') { clearTimeout(t); reject(new Error('redundant')); }
    });
  });
}
// Does this worker serve staged files? (an older copy of sw.js may still be the active one on the device)
function hello(sw) {
  return new Promise((resolve) => {
    const { port1, port2 } = new MessageChannel();
    const t = setTimeout(() => resolve(false), 3000);
    port1.onmessage = ({ data }) => { clearTimeout(t); resolve(!!(data && data.type === 'hello' && data.staged)); };
    sw.postMessage({ type: 'hello' }, [port2]);
  });
}
function worker() {
  if (!swPromise) {
    swPromise = (async () => {
      if (!('serviceWorker' in navigator) || !window.isSecureContext || typeof caches === 'undefined') return null;
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: SCOPE });
      // A newer sw.js found by register() installs and takes over (skipWaiting): wait for it, not the old one.
      const next = reg.installing || reg.waiting;
      if (next) await waitActivated(next);
      let sw = reg.active;
      if (!sw) return null;
      await waitActivated(sw);
      if (!(await hello(sw))) {
        await reg.update();
        const upd = reg.installing || reg.waiting;
        if (upd) await waitActivated(upd);
        sw = reg.active;
        if (!sw || !(await hello(sw))) return null;
      }
      purgeStaged();
      return sw;
    })().catch(() => { swPromise = null; return null; });
  }
  return swPromise;
}

async function purgeStaged() {
  try {
    const c = await caches.open(CACHE);
    for (const req of await c.keys()) {
      const res = await c.match(req);
      const at = Number(res && res.headers.get('X-Staged-At'));
      if (!at || Date.now() - at > STAGED_MAX_AGE_MS) await c.delete(req);
    }
  } catch { /* storage unavailable: nothing to clean */ }
}

// Registers the worker ahead of time (page load), so the download itself needs no waiting.
export function prepareAttachmentDownloads() {
  if (attachmentPathActive()) worker();
}

export const attachmentDisposition = (name) => `attachment; filename="${String(name).replace(/[^\x20-\x7e]|["\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`;
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * iPhone / iPad: makes `blob` downloadable at a real address of the site, /zipdl/f/<id>/<name>, answered by the
 * service worker with "Content-Disposition: attachment" — what iLovePDF's and Smallpdf's links point to. A link to
 * this address saves the file the moment it is touched: nothing is read or awaited after the tap.
 * Resolves to the address, or null where the path is unavailable (not iOS, private browsing, blocked storage).
 */
export async function stageAttachment(blob, name) {
  if (!attachmentPathActive() || typeof caches === 'undefined') return null;
  const sw = await worker();
  if (!sw) return null;
  const url = `${SCOPE}f/${randomId()}/${encodeURIComponent(name)}`;
  const c = await caches.open(CACHE);
  await c.put(url, new Response(blob, { headers: {
    'Content-Type': blob.type || 'application/octet-stream',
    'Content-Length': String(blob.size),
    'Content-Disposition': attachmentDisposition(name),
    'Cache-Control': 'no-store',
    'X-Staged-At': String(Date.now()),
  } }));
  return url;
}
/** Frees a file made ready by stageAttachment (the page no longer offers it). */
export async function unstageAttachment(url) {
  if (!url || typeof caches === 'undefined') return;
  try { await (await caches.open(CACHE)).delete(url); } catch { /* already gone */ }
}

function navigateTo(url) {
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  document.body.appendChild(a);
  nativeClick.call(a);
  a.remove();
}

// A file made long after the tap (an archive entry extracted on demand, a ZIP built from many files): its download
// would no longer be the visitor's own, so a bar asks for one more tap on a real link — what Safari needs.
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
  link.href = url; // a plain link (no download attribute): a navigation always goes through the service worker
  link.textContent = 'Download';
  link.setAttribute('data-download-tap-link', '');
  link.style.cssText = 'background:#15803d;color:#fff;border-radius:10px;padding:0 16px;min-height:44px;display:inline-flex;align-items:center;text-decoration:none';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '\u2715';
  close.setAttribute('aria-label', 'Close');
  close.style.cssText = 'background:transparent;color:#fff;border:0;min-width:44px;min-height:44px;font-size:18px';
  const done = () => { bar.remove(); setTimeout(() => unstageAttachment(url), 60000); };
  link.addEventListener('click', () => setTimeout(done, 0));
  close.addEventListener('click', done);
  bar.append(label, link, close);
  document.body.appendChild(bar);
}

// The anchor's own click, kept before the iOS bridge (IosDownloadBridge) wraps it.
export const nativeClick = typeof HTMLAnchorElement !== 'undefined' ? HTMLAnchorElement.prototype.click : null;

function viaLink(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  nativeClick.call(a);
  a.remove();
  // Revoked later, never right after the click: Safari may still be reading it.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Saves `blob` under `name` (the visitor's Downloads). Resolves once the download has been handed over. */
export async function saveBlob(blob, name) {
  if (attachmentPathActive()) {
    let url = null;
    try { url = await stageAttachment(blob, name); } catch { url = null; }
    if (url) {
      if (performance.now() - lastGestureAt < GESTURE_WINDOW_MS) {
        navigateTo(url);
        setTimeout(() => unstageAttachment(url), 60000);
      } else offerTap(url, name);
      return;
    }
  }
  viaLink(blob, name);
}

// "photo.HEIC" + ("inverted", "jpg") -> "photo-inverted.jpg". Keeps the visitor's own name, as iLoveIMG does
// ("photo_inverted.jpg"): a file called "result.png" is lost among the others in Downloads.
export function derivedName(originalName, suffix, ext) {
  const base = String(originalName || 'image').replace(/\.[^./\\]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120) || 'file';
  return `${base}${suffix ? `-${suffix}` : ''}.${ext}`;
}

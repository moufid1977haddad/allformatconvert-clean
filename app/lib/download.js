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
let swPromise = null;
function worker() {
  if (!swPromise) {
    swPromise = (async () => {
      if (!('serviceWorker' in navigator) || !window.isSecureContext) return null;
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: SCOPE });
      const sw = reg.active || reg.waiting || reg.installing;
      if (!sw) return null;
      if (sw.state !== 'activated') {
        await new Promise((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('timeout')), 10000);
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') { clearTimeout(t); resolve(); }
            else if (sw.state === 'redundant') { clearTimeout(t); reject(new Error('redundant')); }
          });
        });
      }
      return reg.active || sw;
    })().catch(() => { swPromise = null; return null; });
  }
  return swPromise;
}

// Registers the worker ahead of time (page load), so the download itself needs one message and one navigation.
export function prepareAttachmentDownloads() {
  if (attachmentPathActive()) worker();
}

async function viaServiceWorker(blob, name) {
  const sw = await worker();
  if (!sw) return false;
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const { port1, port2 } = new MessageChannel();
  const ready = new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), 5000);
    port1.onmessage = ({ data }) => { if (data && data.type === 'ready') { clearTimeout(t); resolve(true); } };
  });
  sw.postMessage({ type: 'file', id, name, blob }, [port2]);
  if (!(await ready)) return false;
  // A top-level navigation, like a click on iLovePDF's download link: the attachment response starts a download
  // and the page stays where it is. Safe: the worker has confirmed it holds the file for this id.
  const a = document.createElement('a');
  a.href = `${SCOPE}${id}/${encodeURIComponent(name)}`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  nativeClick.call(a);
  a.remove();
  return true;
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
    try { if (await viaServiceWorker(blob, name)) return; } catch { /* fall back to the link */ }
  }
  viaLink(blob, name);
}

// "photo.HEIC" + ("inverted", "jpg") -> "photo-inverted.jpg". Keeps the visitor's own name, as iLoveIMG does
// ("photo_inverted.jpg"): a file called "result.png" is lost among the others in Downloads.
export function derivedName(originalName, suffix, ext) {
  const base = String(originalName || 'image').replace(/\.[^./\\]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120) || 'file';
  return `${base}${suffix ? `-${suffix}` : ''}.${ext}`;
}

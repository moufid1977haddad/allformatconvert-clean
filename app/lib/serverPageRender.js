// P32 (04/10): a PDF page drawn by our own PDF service when an iPhone or iPad cannot draw it.
//
// Real iPhone pass of 04/10 (iOS 26, Safari): PDF to JPG, "Pages to images", kit-iphone-p21/pdf-avec-images.pdf —
// after a minute, "Page 1 of 3 could not be finished on this device"; "Extract images" works on the same file. No
// simulation reproduces it (Playwright's WebKit renders the page in a fraction of a second). Whatever the cause, the
// visitor must get the pages: on iOS / iPadOS ONLY, a page that the device has not drawn within LOCAL_PAGE_LIMIT_MS
// (or whose drawing failed) is drawn by /api/pdf-render (Poppler's pdftoppm on our pdf-tools service, same density,
// same JPG quality, same pages), and the page says so before and after (the PDF is sent, then deleted). iLovePDF,
// Smallpdf and PDF24 render every page on their servers; we keep the device first and the server as the fallback.
//
// Transport: a PDF up to DIRECT_MAX_BYTES is posted with each page request (a phone PDF is usually far smaller); a
// larger one is uploaded ONCE to the media service (chunked, like the Office tools) and each page request names it;
// close() deletes it.
import { isAppleTouchDevice } from './canvasLimit';
import { stageForRoute, mediaServiceConfigured } from './mediaJob';

// multipart overhead stays far below 64 KiB; the route refuses a body over 4 MiB (Vercel's ceiling is ~4.5 MB)
export const DIRECT_MAX_BYTES = 4 * 1024 * 1024 - 64 * 1024;
export const STAGED_MAX_BYTES = 44 * 1024 * 1024; // = MAX_PDFTOOLS_STAGED_BYTES
const MIB = 1024 * 1024;

/** True on iPhone / iPad (iPadOS included). Tests force it with window.__forceServerPageRender = true. */
export function serverRenderAvailable() {
  if (typeof window !== 'undefined' && window.__forceServerPageRender === true) return true;
  return isAppleTouchDevice();
}

/** How long the device gets to draw one page before our service draws it (tests shorten it). */
export const LOCAL_PAGE_LIMIT_MS = () => (typeof window !== 'undefined' && window.__localPageLimitMs) || 20000;
export const LOCAL_PAGE_LIMIT_LABEL = '20 seconds';

export class ServerRenderError extends Error {}

export class ServerPageRenderer {
  constructor(file, { onStage = () => {} } = {}) {
    this.file = file;
    this.onStage = onStage;
    this.staged = null; // {jid, ticket, cleanup}
  }

  async #stage(signal) {
    if (this.staged) return this.staged;
    if (this.file.size > STAGED_MAX_BYTES || !mediaServiceConfigured()) {
      const max = mediaServiceConfigured() ? STAGED_MAX_BYTES : DIRECT_MAX_BYTES;
      throw new ServerRenderError(`This PDF is ${(this.file.size / MIB).toFixed(1)} MB; our PDF service takes files up to ${Math.floor(max / MIB)} MB.`);
    }
    this.staged = await stageForRoute({ file: this.file, purpose: 'pdf-render', onStage: this.onStage, signal });
    return this.staged;
  }

  /**
   * @param {{page: number, dpi: number, format: 'jpg'|'png'|'tiff', quality?: number, maxPixels?: number, signal?: AbortSignal}} o
   * @returns {Promise<{blob: Blob, dpi: number, reduced: string|null, pages: number}>}
   */
  async render({ page, dpi, format, quality = 92, maxPixels, signal }) {
    let res;
    try {
      if (this.file.size <= DIRECT_MAX_BYTES) {
        const form = new FormData();
        form.append('file', this.file, 'document.pdf');
        form.append('page', String(page));
        form.append('dpi', String(Math.round(dpi)));
        form.append('format', format);
        form.append('quality', String(quality));
        if (maxPixels) form.append('maxPixels', String(Math.floor(maxPixels)));
        res = await fetch('/api/pdf-render', { method: 'POST', body: form, signal });
      } else {
        const s = await this.#stage(signal);
        res = await fetch('/api/pdf-render', {
          method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jid: s.jid, ticket: s.ticket, filename: 'document.pdf', page, dpi: Math.round(dpi), format, quality, ...(maxPixels ? { maxPixels: Math.floor(maxPixels) } : {}) }),
        });
      }
    } catch (e) {
      if (e instanceof ServerRenderError) throw e;
      if (e && e.name === 'AbortError') throw new ServerRenderError('Cancelled.');
      throw new ServerRenderError((e && e.message) || 'Could not reach our PDF service. Check your connection and try again.');
    }
    if (!res.ok) {
      let msg = 'Our PDF service could not draw this page.';
      try { msg = (await res.json()).error || msg; } catch { /* not JSON */ }
      throw new ServerRenderError(msg);
    }
    const blob = await res.blob();
    if (!blob.size) throw new ServerRenderError('Our PDF service returned an empty image.');
    return { blob, dpi: Number(res.headers.get('X-Render-Dpi')) || dpi, reduced: res.headers.get('X-Render-Reduced'), pages: Number(res.headers.get('X-Render-Pages')) || 0 };
  }

  close() {
    if (this.staged) { try { this.staged.cleanup(); } catch { /* best effort; the service's TTL removes it */ } }
    this.staged = null;
  }
}

/** "1", "1 and 2", "1, 2 and 5" */
export function listPages(nums) {
  if (nums.length < 2) return String(nums[0] ?? '');
  return `${nums.slice(0, -1).join(', ')} and ${nums[nums.length - 1]}`;
}

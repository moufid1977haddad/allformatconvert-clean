// P33 (05/10): a PDF page recognized by our own OCR service when an iPhone or iPad cannot recognize it.
//
// Real iPhone pass of 04/10 (iOS 26, Safari): PDF OCR, kit-iphone-p21/pdf-avec-images.pdf, English — the page stayed
// on "Page 1 of 3, Recognizing text… 0 %". Playwright's WebKit recognizes the same three pages in about 4 s, so the
// cause is not reproduced. Whatever it is, the visitor must get the text: on iOS / iPadOS ONLY, a page whose
// recognition fails or makes no progress for LOCAL_OCR_LIMIT_MS is recognized by /api/pdf-ocr (Tesseract on our
// pdf-tools service, same languages, same page), and the page says so before and after (the PDF is sent, then
// deleted). Same transport as the page drawings of P32 (app/lib/serverPageRender.js): the PDF is posted with each page
// up to DIRECT_MAX_BYTES, or uploaded once to the media service above it; close() deletes it.
import { stageForRoute, mediaServiceConfigured } from './mediaJob';
import { DIRECT_MAX_BYTES, STAGED_MAX_BYTES, ServerRenderError } from './serverPageRender';

const MIB = 1024 * 1024;

/** How long recognition may go without any progress on the device before our service takes over (tests shorten it). */
export const LOCAL_OCR_LIMIT_MS = () => (typeof window !== 'undefined' && window.__localOcrLimitMs) || 20000;
export const LOCAL_OCR_LIMIT_LABEL = '20 seconds';

const fromBase64 = (b64) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export class ServerPageOcr {
  constructor(file, { onStage = () => {} } = {}) {
    this.file = file;
    this.onStage = onStage;
    this.staged = null; // {jid, ticket, cleanup}
  }

  async #stage(signal) {
    if (this.staged) return this.staged;
    if (this.file.size > STAGED_MAX_BYTES || !mediaServiceConfigured()) {
      const max = mediaServiceConfigured() ? STAGED_MAX_BYTES : DIRECT_MAX_BYTES;
      throw new ServerRenderError(`This PDF is ${(this.file.size / MIB).toFixed(1)} MB; our OCR service takes files up to ${Math.floor(max / MIB)} MB.`);
    }
    this.staged = await stageForRoute({ file: this.file, purpose: 'pdf-ocr', onStage: this.onStage, signal });
    return this.staged;
  }

  /**
   * @param {{page: number, lang: string, dpi?: number, signal?: AbortSignal}} o  lang: "eng" or "eng+fra" (at most 3)
   * @returns {Promise<{text: string, layer: Uint8Array, dpi: number|null, reduced: boolean}>}
   */
  async recognize({ page, lang, dpi = 300, signal }) {
    let res;
    try {
      if (this.file.size <= DIRECT_MAX_BYTES) {
        const form = new FormData();
        form.append('file', this.file, 'document.pdf');
        form.append('page', String(page));
        form.append('lang', lang);
        form.append('dpi', String(dpi));
        res = await fetch('/api/pdf-ocr', { method: 'POST', body: form, signal });
      } else {
        const s = await this.#stage(signal);
        res = await fetch('/api/pdf-ocr', {
          method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jid: s.jid, ticket: s.ticket, filename: 'document.pdf', page, lang, dpi }),
        });
      }
    } catch (e) {
      if (e instanceof ServerRenderError) throw e;
      if (e && e.name === 'AbortError') throw new ServerRenderError('Cancelled.');
      throw new ServerRenderError((e && e.message) || 'Could not reach our OCR service. Check your connection and try again.');
    }
    let body = null;
    try { body = await res.json(); } catch { /* not JSON */ }
    if (!res.ok || !body || body.ok !== true) throw new ServerRenderError((body && body.error) || 'Our OCR service could not recognize this page.');
    return { text: body.text, layer: fromBase64(body.pdf), dpi: body.dpi, reduced: body.reduced === true };
  }

  close() {
    if (this.staged) { try { this.staged.cleanup(); } catch { /* best effort; the service's TTL removes it */ } }
    this.staged = null;
  }
}

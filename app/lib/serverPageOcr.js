// P33 (05/10): a PDF page recognized by our own OCR service when an iPhone or iPad cannot recognize it.
//
// Real iPhone pass of 04/10 (iOS 26, Safari): PDF OCR, kit-iphone-p21/pdf-avec-images.pdf, English — the page stayed
// on "Page 1 of 3, Recognizing text… 0 %". Playwright's WebKit recognizes the same three pages in about 4 s, so the
// cause is not reproduced. Whatever it is, the visitor must get the text: on iOS / iPadOS ONLY, the pages are
// recognized by /api/pdf-ocr (Tesseract on our pdf-tools service, same languages, same page), and the page says so
// before and after (the PDF is sent, then deleted). P33 first tried the device and waited 20 s without progress; a
// second real iPhone pass (06/10) showed the device never finishes, so since P37 the pages go to the service from the
// start on iPhone / iPad (app/lib/ocrFirstStep.js). Same transport as the page drawings of P32
// (app/lib/serverPageRender.js): the PDF is posted with each page up to DIRECT_MAX_BYTES, or uploaded once to the
// media service above it; close() deletes it.
import { stageForRoute, mediaServiceConfigured } from './mediaJob';
import { DIRECT_MAX_BYTES, STAGED_MAX_BYTES, ServerRenderError } from './serverPageRender';

const MIB = 1024 * 1024;

const fromBase64 = (b64) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

// P35: the answer of a page that waited in our service's line — JSON lines {queued, position} / {started}, then the
// result (the last line). Returns the result, or null when the stream ends without one.
async function readLine(stream, onLine, onStarted) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buf += decoder.decode(value, { stream: !done });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0 || (done && buf.trim())) {
      const line = (nl >= 0 ? buf.slice(0, nl) : buf).trim();
      buf = nl >= 0 ? buf.slice(nl + 1) : '';
      if (!line) continue;
      let msg = null;
      try { msg = JSON.parse(line); } catch { return null; }
      if (msg.queued === true) { if (msg.position > 0) onLine(msg.position); }
      else if (msg.started === true) onStarted();
      else { reader.cancel().catch(() => {}); return msg; }
    }
    if (done) return null;
  }
}

export class ServerPageOcr {
  constructor(file, { onStage = () => {} } = {}) {
    this.file = file;
    this.onStage = onStage;
    this.staged = null; // {jid, ticket, cleanup}
  }

  /** P37: the reason our service cannot take this PDF (its size), or null — checked before anything is sent. */
  tooLarge() {
    if (this.file.size <= DIRECT_MAX_BYTES) return null;
    if (this.file.size > STAGED_MAX_BYTES || !mediaServiceConfigured()) {
      const max = mediaServiceConfigured() ? STAGED_MAX_BYTES : DIRECT_MAX_BYTES;
      return `This PDF is ${(this.file.size / MIB).toFixed(1)} MB; our OCR service takes files up to ${Math.floor(max / MIB)} MB.`;
    }
    return null;
  }

  async #stage(signal) {
    if (this.staged) return this.staged;
    const refused = this.tooLarge();
    if (refused) throw new ServerRenderError(refused);
    this.staged = await stageForRoute({ file: this.file, purpose: 'pdf-ocr', onStage: this.onStage, signal });
    return this.staged;
  }

  /**
   * @param {{page: number, lang: string, dpi?: number, signal?: AbortSignal, onLine?: (position: number) => void,
   *          onStarted?: () => void}} o  lang: "eng" or "eng+fra" (at most 3). P35: when our service is busy, the page
   *          waits in its line: onLine(n) is called with its place (1 = next) each time it changes, onStarted() when
   *          its recognition starts.
   * @returns {Promise<{text: string, layer: Uint8Array, dpi: number|null, reduced: boolean}>}
   */
  async recognize({ page, lang, dpi = 300, signal, onLine = () => {}, onStarted = () => {} }) {
    let res;
    // P35: we ask for the line (JSON lines: places, then the result) rather than a "busy" refusal
    const accept = { Accept: 'application/x-ndjson, application/json' };
    let body = null;
    try {
      if (this.file.size <= DIRECT_MAX_BYTES) {
        const form = new FormData();
        form.append('file', this.file, 'document.pdf');
        form.append('page', String(page));
        form.append('lang', lang);
        form.append('dpi', String(dpi));
        res = await fetch('/api/pdf-ocr', { method: 'POST', body: form, signal, headers: accept });
      } else {
        const s = await this.#stage(signal);
        res = await fetch('/api/pdf-ocr', {
          method: 'POST', signal, headers: { 'Content-Type': 'application/json', ...accept },
          body: JSON.stringify({ jid: s.jid, ticket: s.ticket, filename: 'document.pdf', page, lang, dpi }),
        });
      }
      if ((res.headers.get('content-type') || '').startsWith('application/x-ndjson') && res.body) body = await readLine(res.body, onLine, onStarted);
      else { try { body = await res.json(); } catch { /* not JSON */ } }
    } catch (e) {
      if (e instanceof ServerRenderError) throw e;
      if (e && e.name === 'AbortError') throw new ServerRenderError('Canceled.');
      throw new ServerRenderError((e && e.message) || 'Could not reach our OCR service. Check your connection and try again.');
    }
    if (!res.ok || !body || body.ok !== true) throw new ServerRenderError((body && body.error) || 'Our OCR service could not recognize this page.');
    return { text: body.text, layer: fromBase64(body.pdf), dpi: body.dpi, reduced: body.reduced === true };
  }

  close() {
    if (this.staged) { try { this.staged.cleanup(); } catch { /* best effort; the service's TTL removes it */ } }
    this.staged = null;
  }
}

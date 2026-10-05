// P33 (05/10) — /api/pdf-ocr: one PDF page recognized by our pdf-tools service (Tesseract), for an iPhone or iPad whose
// browser could not recognize it (PDF OCR stayed on "Page 1 of 3, Recognizing text… 0 %" on the owner's iPhone,
// 04/10). The page calls it ONLY after its own recognition failed or made no progress for 20 s on iOS/iPadOS, and
// says so to the visitor (app/lib/serverPageOcr.js).
//
// Same limits as /api/pdf-render (P32, lib/pdfRender.js), whose transport it shares:
// - size: the direct body up to MAX_DIRECT_BYTES (4 MB); above, the staged path (chunked upload to the media service,
//   ticket purpose 'pdf-ocr', rate-limited per visitor by /api/media/ticket), up to MAX_STAGED_BYTES (44 MB);
// - pages: one page per request, at most OCR_MAX_PIXELS on the service, the page count checked by the service;
// - languages: 1 to 3 codes of the site's list (app/lib/ocrLanguages.js), checked here AND against the models really
//   installed on the service;
// - rate per visitor: PDF_OCR_PAGES_PER_HOUR / _PER_DAY, one count per page, plus PDF_OCR_GLOBAL_PER_HOUR for all
//   visitors together, reserved in one atomic call (lib/quota/pdfOcrRateLimit.js, hashed IP);
// - another site's page cannot spend a visitor's allowance (Sec-Fetch-Site: cross-site refused).
// - P35 (owner's decision D1): 2 recognitions at a time on the service, 1 per visitor, the others wait in line and the
//   page is told its place (JSON lines, when it asks with Accept: application/x-ndjson).
// Nothing is kept: the service works in a per-request temp dir; the staged file is deleted by the page when it is done
// (media service TTL otherwise). No silent fallback: a missing configuration answers 500 with a sentence.
//
// The handler takes its collaborators as arguments (rate limit, fetch, staged ticket check, error reporting) so that
// scripts/p33/pdf-ocr-route.test.mjs runs it against the real local service with an in-memory rate limit, never
// against Supabase.
const { LANGUAGE_CODES } = require('./ocrLanguageCodes');

const MAX_DIRECT_BYTES = 4 * 1024 * 1024; // = MAX_PLATFORM_UPLOAD_BYTES (lib/quota/limits.js)
const MAX_STAGED_BYTES = 44 * 1024 * 1024; // = MAX_PDFTOOLS_STAGED_BYTES
const SERVICE_TIMEOUT_MS = 55_000; // the service gives up at 50 s (OCR_TIMEOUT_MS)
// P35: a page in the service's line may wait up to 200 s (OCR_QUEUE_MAX_WAIT_MS) before its 50 s of recognition;
// the route's maxDuration is 300 s (app/api/pdf-ocr/route.ts)
const LINE_TIMEOUT_MS = 285_000;
const MAX_LANGS = 3;

/**
 * P35 (D1, review 06/10): the visitor's key for the service's "one OCR at a time per visitor" — an HMAC (keyed with the
 * site's service key, which only Vercel and the service hold) of the IPv4 address, or of the /64 prefix of an IPv6
 * address (one connection usually owns a whole /64: per address, one visitor could take every slot). Not reversible to
 * the IP by the service's logs; never the IP itself. null when there is no usable IP (local runs): no per-visitor slot.
 */
function ocrClientKey(ip, secret) {
  if (!ip || !secret) return null;
  let id = ip;
  if (ip.includes(':')) {
    // expand "::" then keep the first four groups
    const [head, tail = ''] = ip.split('::');
    const h = head ? head.split(':') : [];
    const t = tail ? tail.split(':') : [];
    const groups = ip.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h;
    id = `v6:${groups.slice(0, 4).map((g) => parseInt(g || '0', 16).toString(16)).join(':')}::/64`;
  }
  return require('node:crypto').createHmac('sha256', secret).update(`pdf-ocr-slot:${id}`).digest('hex');
}

const json = (body, status, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

/** The OCR fields, validated here as on the service (defence in depth: nothing unchecked is forwarded). */
function ocrFields(src) {
  const int = (v) => (typeof v === 'number' ? v : /^\d{1,9}$/.test(String(v ?? '')) ? Number(v) : NaN);
  const page = int(src.page);
  const dpi = src.dpi === undefined || src.dpi === null || src.dpi === '' ? 300 : int(src.dpi);
  const codes = String(src.lang || '').split('+');
  if (!Number.isInteger(page) || page < 1 || page > 100000) return { ok: false, error: 'Invalid page number.' };
  if (!Number.isInteger(dpi) || dpi < 72 || dpi > 400) return { ok: false, error: 'The resolution must be between 72 and 400 dpi.' };
  if (!src.lang || codes.length > MAX_LANGS || new Set(codes).size !== codes.length || !codes.every((c) => LANGUAGE_CODES.has(c))) return { ok: false, error: `Choose one to ${MAX_LANGS} languages from the list.` };
  return { ok: true, fields: { page: String(page), dpi: String(dpi), lang: codes.join('+') } };
}

/**
 * @param {Request} req
 * @param {{ env: object, rateLimit: (req: Request) => Promise<{allowed: boolean, layer?: string, retryAfterSeconds?: number}>,
 *           openStaged: (body: object) => object, clientKey?: (req: Request) => string|null, fetchImpl?: typeof fetch,
 *           reportFailure?: (detail: string) => Promise<void> }} deps
 * @returns {Promise<Response>}
 */
async function handlePdfOcr(req, deps) {
  const { env, rateLimit, openStaged, clientKey = () => null, fetchImpl = fetch, reportFailure = async () => {} } = deps;
  const serviceUrl = env.PDFTOOLS_SERVICE_URL;
  const apiKey = env.PDFTOOLS_API_KEY;
  if (!serviceUrl || !apiKey) {
    console.error('[pdf-ocr] not configured, missing:', [!serviceUrl && 'PDFTOOLS_SERVICE_URL', !apiKey && 'PDFTOOLS_API_KEY'].filter(Boolean).join(', '));
    return json({ ok: false, error: 'Our OCR service is not configured.' }, 500);
  }
  if ((req.headers.get('sec-fetch-site') || '').toLowerCase() === 'cross-site') return json({ ok: false, error: 'Requests from other sites are not accepted.' }, 403);
  const base = serviceUrl.replace(/\/+$/, '');
  const staged = (req.headers.get('content-type') || '').toLowerCase().startsWith('application/json');

  // read and check the request BEFORE counting it: a malformed request costs the visitor nothing
  let target, init;
  if (staged) {
    let body;
    try { body = await req.json(); } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }
    const f = ocrFields(body || {});
    if (!f.ok) return json({ ok: false, error: f.error }, 400);
    const h = openStaged(body);
    if (!h.ok) return json({ ok: false, error: h.error }, h.status);
    if (h.maxBytes && h.maxBytes > MAX_STAGED_BYTES) return json({ ok: false, error: `Files up to ${MAX_STAGED_BYTES / 1048576} MB are accepted.` }, 413);
    target = `${base}/v1/ocr-page-staged`;
    init = { method: 'POST', headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ jid: h.jid, ticket: h.serverTicket, ...f.fields }) };
  } else {
    let form;
    try { form = await req.formData(); } catch { return json({ ok: false, error: 'Invalid multipart/form-data request.' }, 400); }
    const file = form.get('file');
    if (!file || typeof file === 'string') return json({ ok: false, error: 'No file provided.' }, 400);
    if (file.size === 0) return json({ ok: false, error: 'The uploaded file is empty.' }, 400);
    if (file.size > MAX_DIRECT_BYTES) return json({ ok: false, error: 'This file must be sent through the large-file upload.' }, 413);
    const f = ocrFields(Object.fromEntries(['page', 'dpi', 'lang'].map((k) => [k, form.get(k)])));
    if (!f.ok) return json({ ok: false, error: f.error }, 400);
    const out = new FormData();
    for (const [k, v] of Object.entries(f.fields)) out.append(k, v);
    out.append('file', file, 'input.pdf'); // the visitor's file name is not sent on
    target = `${base}/v1/ocr-page`;
    init = { method: 'POST', headers: { 'X-API-Key': apiKey }, body: out };
  }

  let rl;
  try {
    rl = await rateLimit(req);
  } catch (e) {
    console.error('[pdf-ocr] rate-limit backend failed:', e && e.message);
    return json({ ok: false, error: 'Our OCR service is temporarily unavailable. Please try again shortly.' }, 503);
  }
  if (!rl.allowed) {
    const msg = rl.layer === 'day'
      ? 'Daily limit of pages recognized by our OCR service reached for your connection. Please try again tomorrow, or use a computer for this PDF.'
      : rl.layer === 'global'
        ? 'Our OCR service is recognizing too many pages right now. Please try again later, or use a computer for this PDF.'
        : 'Too many pages recognized by our OCR service from your connection this hour. Please try again later, or use a computer for this PDF.';
    return json({ ok: false, error: msg }, 429, { 'Retry-After': String(rl.retryAfterSeconds || 3600) });
  }

  // P35 (D1): the service runs 2 recognitions at a time, one per visitor (its key: the hash of the visitor's IP — the
  // IP itself never leaves Vercel), and puts the others in line. A page that asks for the line (Accept:
  // application/x-ndjson, app/lib/serverPageOcr.js) gets its place as it changes, then the result, as JSON lines.
  const wantsLine = (req.headers.get('accept') || '').toLowerCase().includes('application/x-ndjson');
  const key = clientKey(req);
  init.headers = { ...init.headers, ...(wantsLine ? { 'X-OCR-Stream': '1' } : {}), ...(/^[0-9a-f]{64}$/.test(key || '') ? { 'X-Client-Key': key } : {}) };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), wantsLine ? LINE_TIMEOUT_MS : SERVICE_TIMEOUT_MS);
  // the visitor leaving takes the request out of the service's line
  if (req.signal) req.signal.addEventListener('abort', () => controller.abort(), { once: true });
  let res;
  try {
    res = await fetchImpl(target, { ...init, signal: controller.signal });
  } catch (e) {
    clearTimeout(timer);
    if (e && e.name === 'AbortError') return json({ ok: false, error: 'Our OCR service took too long to recognize this page.' }, 504);
    console.error('[pdf-ocr] service unreachable:', e && e.message);
    await reportFailure(`unreachable: ${(e && e.message) || 'unknown error'}`);
    return json({ ok: false, error: 'Could not reach our OCR service. Check your connection and try again.' }, 502);
  }

  // the service's last word -> what goes back to the page (only the expected fields), the failures reported
  async function verdict(status, body) {
    if (status !== 200 || !body || body.ok !== true) {
      if (status === 401 || status === 403) {
        await reportFailure(`service_refused_${status}`);
        return { status: 500, body: { ok: false, error: 'Our OCR service is temporarily unavailable. Please try again later, or use a computer for this PDF.' } };
      }
      // P35: 429 with reason "visitor_line_full" = this visitor already has pages waiting in the service's line; before
      // P35 the service never answered 429 to the site, so any other 429 is still a refusal of our key
      if (status === 429 && !(body && body.reason === 'visitor_line_full')) {
        await reportFailure('service_refused_429');
        return { status: 500, body: { ok: false, error: 'Our OCR service is temporarily unavailable. Please try again later, or use a computer for this PDF.' } };
      }
      if (status === 404) await reportFailure('service_has_no_ocr_endpoint');
      else if (status >= 500 && status !== 503 && status !== 504) await reportFailure(`service_error_${status}`);
      return { status: status === 404 ? 502 : status === 200 ? 502 : status, body: { ok: false, error: (body && typeof body.error === 'string' && body.error) || 'Our OCR service could not recognize this page.' } };
    }
    if (typeof body.text !== 'string' || typeof body.pdf !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.pdf)) {
      await reportFailure('unexpected_answer');
      return { status: 502, body: { ok: false, error: 'Our OCR service returned an unexpected answer.' } };
    }
    return { status: 200, body: { ok: true, text: body.text, pdf: body.pdf, dpi: Number(body.dpi) || null, reduced: body.reduced === true, pages: Number(body.pages) || null } };
  }

  if (!(res.headers.get('content-type') || '').toLowerCase().startsWith('application/x-ndjson') || !res.body) {
    // the page started at once (or an error before the line): one JSON answer, as in P33
    let body = null;
    try { body = await res.json(); } catch { /* not JSON */ } finally { clearTimeout(timer); }
    const v = await verdict(res.status, body);
    return json(v.body, v.status);
  }

  // the page waited in line: places, then the result, passed on line by line
  const encoder = new TextEncoder();
  const out = new ReadableStream({
    async start(ctrl) {
      const send = (obj) => { try { ctrl.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`)); } catch { /* the page went away */ } };
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let done = false;
      try {
        while (!done) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buf += decoder.decode(chunk.value, { stream: true });
          if (buf.length > 6_000_000) throw new Error('answer too large');
          let nl;
          while (!done && (nl = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            let msg = null;
            try { msg = JSON.parse(line); } catch { /* handled below */ }
            if (msg && msg.queued === true) {
              const n = Number(msg.position);
              send({ queued: true, position: Number.isInteger(n) && n >= 0 && n <= 1000 ? n : 0 });
            } else if (msg && msg.started === true) {
              send({ started: true });
            } else {
              const v = await verdict(msg && msg.ok === true ? 200 : Number(msg && msg.status) || 502, msg);
              send(v.status === 200 ? v.body : { ...v.body, status: v.status });
              done = true;
            }
          }
        }
        if (!done) {
          await reportFailure('stream_ended_without_result');
          send({ ok: false, status: 502, error: 'Our OCR service stopped answering. Please try again.' });
        }
      } catch (e) {
        if (controller.signal.aborted) send({ ok: false, status: 504, error: 'Our OCR service took too long to recognize this page.' });
        else {
          console.error('[pdf-ocr] line stream failed:', e && e.message);
          send({ ok: false, status: 502, error: 'Our OCR service stopped answering. Please try again.' });
        }
      } finally {
        clearTimeout(timer);
        reader.cancel().catch(() => { /* already closed or aborted */ });
        try { ctrl.close(); } catch { /* the page went away */ }
      }
    },
    cancel() { controller.abort(); clearTimeout(timer); },
  });
  return new Response(out, { status: 200, headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
}

module.exports = { ocrClientKey, handlePdfOcr, ocrFields, MAX_DIRECT_BYTES, MAX_STAGED_BYTES };

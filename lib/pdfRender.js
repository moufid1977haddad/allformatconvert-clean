// P32 (04/10) — /api/pdf-render: one PDF page drawn by our pdf-tools service (Poppler's pdftoppm), for an iPhone or
// iPad whose browser could not draw it (PDF to JPG / PDF to Image / PDF Redact; pdf.js stayed on "Page 1 of 3" for a
// minute on the owner's iPhone). The page calls it ONLY after its own rendering failed or timed out on iOS/iPadOS,
// and says so to the visitor (app/lib/serverPageRender.js).
//
// Same limits as the other pdf-tools routes (PDF Repair, PDF to PDF/A, PDF Compress):
// - size: the direct body up to MAX_PLATFORM_UPLOAD_BYTES; above, the staged path (chunked upload to the media
//   service, whose ticket is already rate-limited per visitor by /api/media/ticket), up to MAX_PDFTOOLS_STAGED_BYTES;
// - pages: one page per request, at most MAX_RENDER_PIXELS on the service, the page count checked by the service;
// - rate per visitor: PDF_RENDER_PAGES_PER_HOUR / _PER_DAY, one count per page, hour and day reserved together
//   (lib/quota/hourDayRateLimit.js, hashed IP).
// Nothing is kept: the service renders in a per-request temp dir; the staged file is deleted by the page when it is
// done (media service TTL otherwise). No silent fallback: a missing configuration answers 500 with a sentence.
//
// The handler takes its collaborators as arguments (rate limit, fetch, staged ticket check, error reporting) so that
// scripts/p32/pdf-render-route.test.mjs runs it against the real local service with an in-memory rate limit, never
// against Supabase.

const MAX_DIRECT_BYTES = 4 * 1024 * 1024; // = MAX_PLATFORM_UPLOAD_BYTES (lib/quota/limits.js)
const MAX_STAGED_BYTES = 44 * 1024 * 1024; // = MAX_PDFTOOLS_STAGED_BYTES
const SERVICE_TIMEOUT_MS = 55_000; // the service gives up at 50 s (RENDER_TIMEOUT_MS)
const FORMATS = ['jpg', 'png', 'tiff'];

const json = (body, status, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });

/** The render fields, validated here as on the service (defence in depth: nothing unchecked is forwarded). */
function renderFields(src) {
  const int = (v) => (typeof v === 'number' ? v : /^\d{1,9}$/.test(String(v ?? '')) ? Number(v) : NaN);
  const page = int(src.page), dpi = int(src.dpi);
  const quality = src.quality === undefined || src.quality === null || src.quality === '' ? 92 : int(src.quality);
  const maxPixels = src.maxPixels === undefined || src.maxPixels === null || src.maxPixels === '' ? null : int(src.maxPixels);
  const format = String(src.format || '');
  if (!Number.isInteger(page) || page < 1 || page > 100000) return { ok: false, error: 'Invalid page number.' };
  if (!Number.isInteger(dpi) || dpi < 36 || dpi > 600) return { ok: false, error: 'The resolution must be between 36 and 600 dpi.' };
  if (!FORMATS.includes(format)) return { ok: false, error: 'Unknown image format.' };
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) return { ok: false, error: 'Invalid quality.' };
  if (maxPixels !== null && (!Number.isInteger(maxPixels) || maxPixels < 100000)) return { ok: false, error: 'Invalid size limit.' };
  const f = { page: String(page), dpi: String(dpi), format, quality: String(quality) };
  if (maxPixels !== null) f.maxPixels = String(maxPixels);
  return { ok: true, fields: f };
}

/**
 * @param {Request} req
 * @param {{ env: object, rateLimit: (req: Request) => Promise<{allowed: boolean, layer?: string, retryAfterSeconds?: number}>,
 *           openStaged: (body: object) => object, fetchImpl?: typeof fetch, reportFailure?: (detail: string) => Promise<void> }} deps
 * @returns {Promise<Response>}
 */
async function handlePdfRender(req, deps) {
  const { env, rateLimit, openStaged, fetchImpl = fetch, reportFailure = async () => {} } = deps;
  const serviceUrl = env.PDFTOOLS_SERVICE_URL;
  const apiKey = env.PDFTOOLS_API_KEY;
  if (!serviceUrl || !apiKey) {
    console.error('[pdf-render] not configured, missing:', [!serviceUrl && 'PDFTOOLS_SERVICE_URL', !apiKey && 'PDFTOOLS_API_KEY'].filter(Boolean).join(', '));
    return json({ ok: false, error: 'Our PDF service is not configured.' }, 500);
  }
  const base = serviceUrl.replace(/\/+$/, '');
  const staged = (req.headers.get('content-type') || '').toLowerCase().startsWith('application/json');

  // read and check the request BEFORE counting it: a malformed request costs the visitor nothing
  let target, init;
  if (staged) {
    let body;
    try { body = await req.json(); } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }
    const f = renderFields(body || {});
    if (!f.ok) return json({ ok: false, error: f.error }, 400);
    const h = openStaged(body);
    if (!h.ok) return json({ ok: false, error: h.error }, h.status);
    if (h.maxBytes && h.maxBytes > MAX_STAGED_BYTES) {
      // the page asks for its ticket with the pdf-render purpose; a ticket for a larger document is not accepted here
      return json({ ok: false, error: `Files up to ${MAX_STAGED_BYTES / 1048576} MB are accepted.` }, 413);
    }
    target = `${base}/v1/render-page-staged`;
    init = { method: 'POST', headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ jid: h.jid, ticket: h.serverTicket, ...f.fields }) };
  } else {
    let form;
    try { form = await req.formData(); } catch { return json({ ok: false, error: 'Invalid multipart/form-data request.' }, 400); }
    const file = form.get('file');
    if (!file || typeof file === 'string') return json({ ok: false, error: 'No file provided.' }, 400);
    if (file.size === 0) return json({ ok: false, error: 'The uploaded file is empty.' }, 400);
    if (file.size > MAX_DIRECT_BYTES) return json({ ok: false, error: 'This file must be sent through the large-file upload.' }, 413);
    const f = renderFields(Object.fromEntries(['page', 'dpi', 'format', 'quality', 'maxPixels'].map((k) => [k, form.get(k)])));
    if (!f.ok) return json({ ok: false, error: f.error }, 400);
    const out = new FormData();
    for (const [k, v] of Object.entries(f.fields)) out.append(k, v);
    out.append('file', file, 'input.pdf'); // the visitor's file name is not sent on
    target = `${base}/v1/render-page`;
    init = { method: 'POST', headers: { 'X-API-Key': apiKey }, body: out };
  }

  let rl;
  try {
    rl = await rateLimit(req);
  } catch (e) {
    console.error('[pdf-render] rate-limit backend failed:', e && e.message);
    return json({ ok: false, error: 'Our PDF service is temporarily unavailable. Please try again shortly.' }, 503);
  }
  if (!rl.allowed) {
    const msg = rl.layer === 'day'
      ? 'Daily limit of pages drawn by our PDF service reached for your connection. Please try again tomorrow, or use a computer for this PDF.'
      : 'Too many pages drawn by our PDF service from your connection this hour. Please try again later, or use a computer for this PDF.';
    return json({ ok: false, error: msg }, 429, { 'Retry-After': String(rl.retryAfterSeconds || 3600) });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);
  let res;
  try {
    res = await fetchImpl(target, { ...init, signal: controller.signal });
  } catch (e) {
    if (e && e.name === 'AbortError') return json({ ok: false, error: 'Our PDF service took too long to draw this page. Try a lower resolution.' }, 504);
    console.error('[pdf-render] service unreachable:', e && e.message);
    await reportFailure(`unreachable: ${(e && e.message) || 'unknown error'}`);
    return json({ ok: false, error: 'Could not reach our PDF service. Check your connection and try again.' }, 502);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let err = null;
    try { err = (await res.json()).error; } catch { /* not JSON */ }
    if (res.status >= 500 && res.status !== 503 && res.status !== 504) await reportFailure(`service_error_${res.status}`);
    return json({ ok: false, error: err || 'Our PDF service could not draw this page.' }, res.status);
  }
  const type = res.headers.get('content-type') || '';
  if (!/^image\/(jpeg|png|tiff)$/.test(type)) {
    await reportFailure(`unexpected_type_${type.slice(0, 40)}`);
    return json({ ok: false, error: 'Our PDF service returned an unexpected answer.' }, 502);
  }
  const bytes = await res.arrayBuffer();
  if (!bytes.byteLength) return json({ ok: false, error: 'Our PDF service returned an empty image.' }, 502);
  const headers = { 'Content-Type': type, 'Cache-Control': 'no-store' };
  for (const h of ['X-Render-Dpi', 'X-Render-Pages', 'X-Render-Reduced']) { const v = res.headers.get(h); if (v) headers[h] = v; }
  return new Response(bytes, { status: 200, headers });
}

module.exports = { handlePdfRender, renderFields, MAX_DIRECT_BYTES, MAX_STAGED_BYTES };

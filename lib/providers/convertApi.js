// lib/providers/convertApi.js
//
// The ONLY module in this codebase that knows ConvertAPI's base URL, its
// endpoint naming, its auth header, its StoreFile parameter, or the shape
// of its JSON response. Callers pass a Buffer in and get a Buffer (or a
// typed ConvertApiError) back -- they never see a ConvertAPI URL, header,
// or response shape. See
// docs/specs/2026-09-03-convertapi-word-to-pdf-integration.md §2.
//
// The route handler's job is to translate `.code` into one of the
// plain-language messages in the spec's §4 table -- that mapping
// deliberately does NOT live here, so this module stays ignorant of
// user-facing copy the same way it's ignorant of quota/guard concerns.

const { CONVERTAPI_COST_MICROS } = require('../quota/config');

const CONVERTAPI_URL = 'https://v2.convertapi.com/convert/docx/to/pdf';
// Not specified by the spec -- added defensively so a hung upstream
// request can't outlive the route's own execution budget (mirrors the
// existing GOTENBERG_TIMEOUT_MS pattern in convert-to-pdf/route.ts).
const CONVERTAPI_TIMEOUT_MS = 30_000;

// Static, pre-written per code -- NEVER a template that could interpolate
// a header, a raw upstream body, or any other request/response detail.
// This is the internal Error#message (server-side logging use only); the
// user-facing text is a separate mapping the route handler owns, per §4.
const INTERNAL_MESSAGES = {
  quota_exceeded: 'ConvertAPI account credits exhausted.',
  rate_limited: 'ConvertAPI rate limit hit.',
  invalid_token: 'ConvertAPI rejected the configured token, or no token is configured.',
  unsupported_format: 'ConvertAPI reported an unsupported file format.',
  timeout: 'ConvertAPI conversion timed out.',
  corrupted_file: 'ConvertAPI reported the file as corrupted or unparseable.',
  upstream_error: 'ConvertAPI returned an unexpected error.',
};

class ConvertApiError extends Error {
  /**
   * Codes map directly to ConvertAPI's own documented responses (§4).
   * "upstream_error" is the only unmapped catch-all.
   * @param {"quota_exceeded"|"rate_limited"|"invalid_token"|"unsupported_format"|"timeout"|"corrupted_file"|"upstream_error"} code
   * @param {string} message
   * @param {{ httpStatus?: number, upstreamBody?: string, billed?: boolean }} [details]
   */
  constructor(code, message, { httpStatus, upstreamBody, billed = false } = {}) {
    super(message);
    this.name = 'ConvertApiError';
    this.code = code;
    // Server-side diagnostic fields only. The route handler must never put
    // these in a response body or a client-visible header, and even in a
    // server log must never combine them with the Authorization header.
    this.httpStatus = httpStatus;
    this.upstreamBody = upstreamBody;
    // true only when this module already saw ConvertAPI's own 2xx response
    // -- i.e. the conversion was already billed -- before something else
    // (an unreadable/malformed body) went wrong. The route handler uses
    // this to decide guard.commit(null) vs guard.release(): a rejected
    // (non-2xx) request was never billed, but a 2xx response means
    // ConvertAPI already charged for it regardless of what happens next.
    this.billed = billed;
  }
}

function fail(code, details) {
  throw new ConvertApiError(code, INTERNAL_MESSAGES[code], details);
}

// Maps ConvertAPI's own documented HTTP status + response `Code` field to
// one of our typed error codes (convertapi.com/docs/response-codes, not
// inferred). Anything not explicitly matched is the "upstream_error"
// catch-all.
function classifyFailure(httpStatus, bodyCode) {
  if (httpStatus === 403) return 'quota_exceeded';
  if (httpStatus === 503) return 'rate_limited';
  if (httpStatus === 401 || bodyCode === 4013) return 'invalid_token';
  if (httpStatus === 415) return 'unsupported_format';
  if (httpStatus === 500 && bodyCode === 5000) return 'timeout';
  if (httpStatus === 500 && bodyCode === 5002) return 'corrupted_file';
  return 'upstream_error';
}

/**
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @returns {Promise<{ pdfBuffer: Buffer, costMicros: number }>}
 * @throws {ConvertApiError}
 */
async function convertDocxToPdf(fileBuffer, fileName) {
  const token = process.env.CONVERTAPI_TOKEN;
  if (!token) {
    // Missing configuration is the same operator-facing failure shape as
    // an invalid/expired token -- mapped to the same code rather than
    // inventing a new one the route's §4 table wouldn't know how to show.
    fail('invalid_token');
  }

  const form = new FormData();
  // Multipart field name "File" (capitalized) -- ConvertAPI's own naming.
  form.append('File', new Blob([fileBuffer]), fileName);
  // StoreFile=false on every request, always, no exceptions -- keeps the
  // conversion in-memory with nothing written to ConvertAPI's disk.
  form.append('StoreFile', 'false');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONVERTAPI_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(CONVERTAPI_URL, {
      method: 'POST',
      // Auth via the Authorization header ONLY -- never a Secret or Auth
      // URL query parameter, both of which would leak the token into
      // server access logs.
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err && err.name === 'AbortError') {
      fail('timeout');
    }
    fail('upstream_error');
    return; // unreachable -- fail() always throws; keeps control flow explicit for lint/type tools.
  }
  clearTimeout(timeoutId);

  const bodyText = await response.text().catch(() => '');
  let parsed = null;
  try {
    parsed = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const bodyCode = parsed && typeof parsed.Code === 'number' ? parsed.Code : undefined;
    const code = classifyFailure(response.status, bodyCode);
    fail(code, { httpStatus: response.status, upstreamBody: bodyText.slice(0, 500) });
    return; // unreachable
  }

  const fileEntry = parsed && Array.isArray(parsed.Files) ? parsed.Files[0] : null;
  if (!fileEntry || typeof fileEntry.FileData !== 'string') {
    // response.ok was already confirmed true above -- ConvertAPI already
    // billed for this conversion, so this failure must be marked billed:
    // true, not treated as "nothing was charged."
    fail('upstream_error', { httpStatus: response.status, upstreamBody: bodyText.slice(0, 500), billed: true });
    return; // unreachable
  }

  const pdfBuffer = Buffer.from(fileEntry.FileData, 'base64');
  // Defensive default of 1 (the documented, empirically-confirmed typical
  // value) if the field is ever missing or malformed -- matches the
  // worst-case reservation already made, so this can never under-charge
  // relative to what was reserved.
  const conversionCost =
    typeof parsed.ConversionCost === 'number' && parsed.ConversionCost > 0 ? parsed.ConversionCost : 1;
  const costMicros = conversionCost * CONVERTAPI_COST_MICROS;

  return { pdfBuffer, costMicros };
}

module.exports = { convertDocxToPdf, ConvertApiError };

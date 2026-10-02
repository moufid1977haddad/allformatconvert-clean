// P25 (03/10, E3): whole-PDF translation with the layout kept — Google Cloud Translation, Advanced (v3),
// translateDocument (online / synchronous). Chosen on 03/10 against the other means competitors use:
//   - DeepL API: every PDF is billed at least 50,000 characters (≈ 1.25 $ a document at Pro rates, even one page);
//   - Azure Translator: 15 $ / million characters, but its PDF translation is batch-only (Azure Blob storage, SAS
//     tokens, polling) — the synchronous call does not take PDF;
//   - rewriting the text into the PDF ourselves: cheap (OpenAI), but fonts for 100+ scripts and line refitting are a
//     project of their own, and the result would be below the three services above;
//   - Google: 0.08 $ a page, one synchronous call, native PDFs up to 300 pages / 20 MB, scanned ones up to 20 pages,
//     130+ languages (iLovePDF: 50+), layout kept by Google.
// The only module that knows Google's endpoint, its OAuth exchange and its response shape. Credentials: one
// server-only variable, GOOGLE_TRANSLATE_SERVICE_ACCOUNT, the service account's JSON key (created by the owner, see
// the plan, E3). Without it the feature is OFF and the page does not offer it.
const crypto = require('node:crypto');

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/cloud-translation';

class GoogleTranslateError extends Error {
  /** @param {string} code @param {{ httpStatus?: number, billed?: boolean }} [info] */
  constructor(code, info = {}) {
    super(code);
    this.name = 'GoogleTranslateError';
    this.code = code;
    this.httpStatus = info.httpStatus;
    // true once Google answered 2xx: the pages are billed whatever happens next
    this.billed = info.billed === true;
    // true when no answer came back (timeout, network): Google may have billed
    this.maybeBilled = false;
  }
}

/** The service account, or null when the feature is not configured. Never logs the key. */
function serviceAccount(env = process.env) {
  const raw = env.GOOGLE_TRANSLATE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw);
    if (sa && typeof sa.client_email === 'string' && typeof sa.private_key === 'string' && typeof sa.project_id === 'string') return sa;
  } catch { /* fall through */ }
  return null;
}

const configured = (env = process.env) => serviceAccount(env) !== null;

let cached = null; // { token, exp, email }
const b64url = (b) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

async function accessToken(sa, fetchImpl = fetch, now = () => Date.now()) {
  if (cached && cached.email === sa.client_email && cached.exp - 120_000 > now()) return cached.token;
  const iat = Math.floor(now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }));
  const signature = b64url(crypto.createSign('RSA-SHA256').update(`${head}.${claims}`).sign(sa.private_key));
  let res;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15_000); // a hanging token request must not hold the function (review 03/10)
  try {
    res = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claims}.${signature}` }).toString(),
      signal: ctl.signal,
    });
  } catch { throw new GoogleTranslateError('auth_unreachable'); } finally { clearTimeout(timer); }
  const j = await res.json().catch(() => null);
  if (!res.ok || !j || typeof j.access_token !== 'string') throw new GoogleTranslateError('auth_failed', { httpStatus: res.status });
  cached = { token: j.access_token, exp: now() + (Number(j.expires_in) || 3600) * 1000, email: sa.client_email };
  return cached.token;
}

/**
 * Translates a whole PDF. Source language detected by Google unless given.
 * @param {Buffer} pdf
 * @param {{ target: string, source?: string, timeoutMs?: number }} opts
 * @param {{ fetchImpl?: typeof fetch, env?: Record<string, string|undefined> }} [deps]
 * @returns {Promise<{ pdf: Buffer, detectedLanguage: string | null }>}
 * @throws {GoogleTranslateError}
 */
async function translatePdf(pdf, { target, source, timeoutMs = 240_000 }, deps = {}) {
  const fetchImpl = deps.fetchImpl || fetch;
  const sa = serviceAccount(deps.env || process.env);
  if (!sa) throw new GoogleTranslateError('not_configured');
  const token = await accessToken(sa, fetchImpl);
  const url = `https://translation.googleapis.com/v3/projects/${encodeURIComponent(sa.project_id)}/locations/global:translateDocument`;
  const body = {
    targetLanguageCode: target,
    ...(source ? { sourceLanguageCode: source } : {}),
    documentInputConfig: { mimeType: 'application/pdf', content: pdf.toString('base64') },
  };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let res;
  try {
    res = await fetchImpl(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
  } catch (e) {
    // No answer: Google may have started and may bill the translation anyway (independent review 03/10): the caller
    // keeps the money reserved (`maybeBilled`), only a clear refusal from Google gives it back.
    const err = new GoogleTranslateError(e && e.name === 'AbortError' ? 'timeout' : 'unreachable');
    err.maybeBilled = true;
    throw err;
  } finally { clearTimeout(timer); }
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    let status = '';
    try { status = JSON.parse(text)?.error?.status || ''; } catch { /* not JSON */ }
    const code = res.status === 429 || status === 'RESOURCE_EXHAUSTED' ? 'rate_limited'
      : res.status === 401 || res.status === 403 ? 'auth_failed'
      : res.status === 400 && /page|size|limit|exceed/i.test(text) ? 'too_large'
      : res.status === 400 ? 'unsupported' : 'upstream_error';
    throw new GoogleTranslateError(code, { httpStatus: res.status });
  }
  let j = null;
  try { j = JSON.parse(text); } catch { /* below */ }
  const out = j?.documentTranslation?.byteStreamOutputs?.[0];
  if (typeof out !== 'string') throw new GoogleTranslateError('bad_response', { httpStatus: res.status, billed: true });
  const buf = Buffer.from(out, 'base64');
  if (buf.subarray(0, 5).toString('latin1') !== '%PDF-') throw new GoogleTranslateError('bad_response', { httpStatus: res.status, billed: true });
  const lang = j?.documentTranslation?.detectedLanguageCode;
  return { pdf: buf, detectedLanguage: typeof lang === 'string' ? lang : null };
}

function resetTokenCacheForTests() { cached = null; }

module.exports = { translatePdf, configured, GoogleTranslateError, resetTokenCacheForTests };

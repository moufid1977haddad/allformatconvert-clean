import { NextResponse } from 'next/server';
import { checkToolErrorRateLimit } from '@/lib/quota/toolErrorRateLimit';
import { insertToolError } from '@/lib/reportError';

// sendBeacon's own payload ceiling is ~64KB; our real payloads are under
// 500 bytes. 4KB is generous headroom while still rejecting anything that
// looks like an attempt to smuggle a large body through this endpoint.
const MAX_BODY_BYTES = 4096;
const ALLOWED_KEYS = new Set(['tool', 'source', 'ext', 'sizeBucket', 'errorType', 'errorMessage', 'browser']);
const TOOL_RE = /^[a-z0-9-]{1,60}$/;
const EXT_RE = /^[a-z0-9]{1,10}$/;
const SIZE_BUCKET_RE = /^(0-1MB|1-10MB|10-50MB|50-200MB|200MB\+)$/;
const ERROR_TYPE_RE = /^[A-Za-z0-9_]{1,60}$/;
const BROWSER_RE = /^[A-Za-z0-9 .+]{1,40}$/;

export async function POST(request) {
  // incrementCounter (lib/quota/counters.js) throws on any Supabase/RPC
  // failure -- a transient DB hiccup must fail this request closed (503),
  // not crash the route handler as an uncaught exception.
  let rateCheck;
  try {
    rateCheck = await checkToolErrorRateLimit(request);
  } catch (err) {
    console.error('report-error rate-limit check failed:', err.message);
    return new NextResponse(null, { status: 503 });
  }
  if (!rateCheck.allowed) {
    // No response body needed -- the client never reads this response
    // (sendBeacon has no return channel, and the fetch fallback discards
    // it) -- but a real status code still matters for server logs/metrics.
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } });
  }

  const rawBody = await request.text();
  // Byte length, not UTF-16 code-unit .length -- a message dense in
  // multi-byte UTF-8 characters could otherwise slip past this check well
  // over the intended wire-size cap.
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return new NextResponse(null, { status: 400 });
  }

  // Strict allowlist: reject any request carrying a field we didn't ask
  // for, rather than silently ignoring it -- this is a public endpoint and
  // "silently ignore extra fields" is exactly the kind of leniency that
  // turns into an abuse vector later.
  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) {
      return new NextResponse(null, { status: 400 });
    }
  }

  const { tool, source, ext, sizeBucket, errorType, errorMessage, browser } = body;

  if (typeof tool !== 'string' || !TOOL_RE.test(tool)) return new NextResponse(null, { status: 400 });
  if (source !== 'browser') return new NextResponse(null, { status: 400 }); // this route only ever receives browser reports; 'server' rows are inserted directly, never via HTTP
  if (ext !== null && ext !== undefined && (typeof ext !== 'string' || !EXT_RE.test(ext))) return new NextResponse(null, { status: 400 });
  if (sizeBucket !== null && sizeBucket !== undefined && (typeof sizeBucket !== 'string' || !SIZE_BUCKET_RE.test(sizeBucket))) return new NextResponse(null, { status: 400 });
  if (errorType !== undefined && (typeof errorType !== 'string' || !ERROR_TYPE_RE.test(errorType))) return new NextResponse(null, { status: 400 });
  if (typeof errorMessage !== 'string' || errorMessage.length > 300) return new NextResponse(null, { status: 400 });
  if (browser !== undefined && (typeof browser !== 'string' || !BROWSER_RE.test(browser))) return new NextResponse(null, { status: 400 });

  await insertToolError({
    tool,
    source: 'browser',
    ext: ext || null,
    sizeBucket: sizeBucket || null,
    errorType: errorType || 'Error',
    errorMessage,
    browser: browser || 'unknown',
  });

  return new NextResponse(null, { status: 204 });
}

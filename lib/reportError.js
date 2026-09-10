const { supabaseAdmin } = require('./quota/supabaseAdmin');
const { extOf, sizeBucket, sanitizeErrorMessage, parseBrowserLabel } = require('../app/lib/reportError.js');

const ALLOWED_SOURCES = new Set(['browser', 'server']);
const TOOL_RE = /^[a-z0-9-]{1,60}$/;
const EXT_RE = /^[a-z0-9]{1,10}$/;
const SIZE_BUCKET_RE = /^(0-1MB|1-10MB|10-50MB|50-200MB|200MB\+)$/;

// Server-side clamp, independent of and not trusting the client's own
// sanitizeErrorMessage() call -- a malicious or buggy client payload gets
// re-clamped here regardless of what it claims.
function clamp(str, max) {
  return typeof str === 'string' ? str.slice(0, max) : null;
}

// Used both by the API route (after validating a browser-submitted
// payload) and directly by server routes -- single insert path so the two
// never drift on shape or on failure handling.
async function insertToolError({ tool, source, ext, detectedExt = null, sizeBucket: bucket, errorType, errorMessage, browser }) {
  if (!TOOL_RE.test(tool || '')) return;
  if (!ALLOWED_SOURCES.has(source)) return;

  // errorMessage is re-run through the real sanitizer here, not just
  // length-clamped: the API route only validates that a browser-submitted
  // message is a string under 300 chars, it never re-sanitizes its
  // *content* -- without this, anyone can POST arbitrary unredacted text
  // straight into tool_errors.error_message on this public endpoint, and
  // any future caller of insertToolError() that forgets to sanitize first
  // would have no server-side safety net. Passing null as the filename
  // here is correct: this function never has the visitor's real filename
  // in scope (buildServerToolError already sanitized with it before this
  // point) -- the generic path/filename sweep still applies regardless.
  const sanitizedMessage = sanitizeErrorMessage(errorMessage, null);

  const row = {
    tool,
    source,
    ext: ext && EXT_RE.test(ext) ? ext : null,
    // Only ever set by a caller when a real-format sniff differed from the
    // declared extension above -- see app/lib/detectFileFormat.js and
    // docs/audit/RAPPORT-tiff-paint.md.
    detected_ext: detectedExt && EXT_RE.test(detectedExt) ? detectedExt : null,
    size_bucket: bucket && SIZE_BUCKET_RE.test(bucket) ? bucket : null,
    error_type: clamp(errorType, 60) || 'Error',
    error_message: sanitizedMessage || '',
    browser: clamp(browser, 40) || 'unknown',
  };

  try {
    const { error } = await supabaseAdmin.from('tool_errors').insert(row);
    if (error) console.error('tool_errors insert failed (non-fatal):', error.message);
  } catch (err) {
    console.error('tool_errors insert threw (non-fatal):', err.message);
  }
}

// Convenience for server routes: mirrors app/lib/reportError.js's
// reportToolError() payload-building but server-side, from a File object,
// a caught error, and the request's own User-Agent header (never the
// visitor's IP -- that's handled separately by rate limiting, not stored
// on this row at all).
function buildServerToolError({ tool, file, error, userAgent }) {
  const message = (error && typeof error.message === 'string') ? error.message
    : (typeof error === 'string' ? error : '');
  return {
    tool,
    source: 'server',
    ext: file && file.name ? extOf(file.name) : null,
    sizeBucket: file && typeof file.size === 'number' ? sizeBucket(file.size) : null,
    errorType: (error && typeof error.name === 'string' && error.name) || 'Error',
    errorMessage: sanitizeErrorMessage(message, file && file.name),
    browser: userAgent ? parseBrowserLabel(userAgent) : 'unknown',
  };
}

module.exports = { insertToolError, buildServerToolError };

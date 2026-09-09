// Shared by every browser-side tool AND (for the pure helpers only --
// extOf, sizeBucket, sanitizeErrorMessage, parseBrowserLabel) by the
// server-side routes in lib/reportError.js. Nothing in this file reads
// process.env or does file I/O, so it's safe in both a 'use client' page
// and a Next.js server route.
//
// Hard privacy contract (see docs/audit/RAPPORT-remontee-erreurs.md): the
// payload built here NEVER contains the file itself, its content, its real
// name, or the raw error object -- only a bucketed size, a lowercased
// extension, a sanitized+truncated message, an error type, and a coarse
// browser label. reportToolError() must never throw and must never block
// or slow down the caller.

const REPORT_ENDPOINT = '/api/report-error';
const MAX_MESSAGE_LENGTH = 300;

export function extOf(fileName) {
  if (!fileName || typeof fileName !== 'string') return null;
  const raw = (fileName.split('.').pop() || '').toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(raw) ? raw : 'unknown';
}

export function sizeBucket(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) return null;
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return '0-1MB';
  if (mb < 10) return '1-10MB';
  if (mb < 50) return '10-50MB';
  if (mb < 200) return '50-200MB';
  return '200MB+';
}

// Deliberately narrow: name + major version only, never the full raw
// User-Agent string (which can carry OS/device detail closer to a device
// fingerprint than "navigateur et version" calls for).
export function parseBrowserLabel(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return 'unknown';
  const ua = userAgent;
  let m;
  if ((m = /Edg\/(\d+)/.exec(ua))) return `Edge ${m[1]}`;
  if ((m = /OPR\/(\d+)/.exec(ua))) return `Opera ${m[1]}`;
  if ((m = /Firefox\/(\d+)/.exec(ua))) return `Firefox ${m[1]}`;
  if (/CriOS\/(\d+)/.test(ua)) return `Chrome iOS ${/CriOS\/(\d+)/.exec(ua)[1]}`;
  if ((m = /Chrome\/(\d+)/.exec(ua)) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) return `Chrome ${m[1]}`;
  if ((m = /Version\/(\d+).*Safari/.exec(ua))) return `Safari ${m[1]}`;
  return 'unknown';
}

// Strips anything that could be a filename or filesystem path out of a
// library's raw error message before it's ever sent anywhere. Two layers:
// (1) if we know the visitor's real filename, remove every occurrence of
// it (and its extension-stripped stem) by exact match first -- the
// strongest guarantee for the one string we know for certain must never
// leak; (2) a generic sweep for path-shaped and filename-shaped substrings,
// as defense in depth against library-internal temp paths or anything the
// exact-match pass missed.
export function sanitizeErrorMessage(message, fileName) {
  if (typeof message !== 'string' || !message) return '';
  let out = message.slice(0, 2000); // cheap upfront cap before any regex work

  if (fileName && typeof fileName === 'string') {
    const stem = fileName.replace(/\.[^./\\]+$/, '');
    for (const needle of [fileName, stem]) {
      if (needle && needle.length >= 2) {
        out = out.split(needle).join('[file]');
      }
    }
  }

  out = out
    .replace(/[A-Za-z]:\\[^\s"'<>]+/g, '[path]') // Windows paths
    .replace(/(?:\.{1,2}\/|\/)[^\s"'<>]*\/[^\s"'<>]*/g, '[path]') // unix-ish paths
    .replace(/\b[^\s"'()<>]{1,80}\.[A-Za-z0-9]{2,5}\b/g, (match) =>
      /^(e\.g|i\.e|etc)\.[a-z]{1,3}$/i.test(match) ? match : '[file]'
    )
    .replace(/\s+/g, ' ')
    .trim();

  return out.slice(0, MAX_MESSAGE_LENGTH);
}

// Fire-and-forget: builds the sanitized payload and sends it via
// navigator.sendBeacon (survives page unload, doesn't block) or, if
// unavailable, fetch(..., {keepalive:true}). Every failure mode --
// sendBeacon missing, fetch throwing, JSON.stringify throwing on a weird
// error object -- is swallowed. Never call this with `await` expecting it
// to matter; it deliberately returns undefined, not a promise.
export function reportToolError({ tool, source = 'browser', file, error }) {
  try {
    const message = (error && typeof error.message === 'string') ? error.message
      : (typeof error === 'string' ? error : '');
    const payload = {
      tool: typeof tool === 'string' ? tool.slice(0, 60) : 'unknown',
      source,
      ext: file ? extOf(file.name) : null,
      sizeBucket: file && typeof file.size === 'number' ? sizeBucket(file.size) : null,
      errorType: (error && typeof error.name === 'string' && error.name) || 'Error',
      errorMessage: sanitizeErrorMessage(message, file && file.name),
      browser: typeof navigator !== 'undefined' ? parseBrowserLabel(navigator.userAgent) : 'unknown',
    };
    const body = JSON.stringify(payload);

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(REPORT_ENDPOINT, blob);
      if (sent) return;
    }
    if (typeof fetch === 'function') {
      fetch(REPORT_ENDPOINT, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true })
        .catch(() => {});
    }
  } catch {
    // Reporting a failure must never itself become a failure the visitor sees.
  }
}

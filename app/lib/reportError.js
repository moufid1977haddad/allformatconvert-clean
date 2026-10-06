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

import { isChunkLoadError, announceNewVersion } from './chunkError';

const REPORT_ENDPOINT = '/api/report-error';
const MAX_MESSAGE_LENGTH = 300;
// P25 (03/10): every tool reports now, so a page that loops on an error must not flood tool_errors. In one tab, the
// same (tool, type, message) is sent once and a tool sends at most MAX_REPORTS_PER_TOOL reports; the server adds its
// own per-visitor and global daily caps (lib/quota/toolErrorRateLimit.js).
const MAX_REPORTS_PER_TOOL = 5;
const sentKeys = new Set();
const sentPerTool = new Map();
// When a tool reported a thrown failure itself, the message it shows for that same failure (useToolError) is not
// sent again: one failure, one row.
const lastFailureAt = new Map();
export function failureReportedRecently(tool, ms) {
  const t = lastFailureAt.get(tool);
  return typeof t === 'number' && Date.now() - t < ms;
}

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
// P37 (06/10): secrets and typed patterns. P36 found that a pasted header ("Authorization: Bearer sk_live_…"), quoted
// by V8's JSON error, and a regular expression typed in Regex Tester went out in clear or cut in two (the path sweep
// redacted "/secret/path/" and sent the rest). These run first, so each secret goes whole, with its key kept for
// debugging ("password=[secret]"). Over-redacting stays the safe direction.
const SECRET = '[secret]';
// A run of letters, digits and base64/URL-safe signs that is a key, a hash or an encoded blob, not a word or an error
// code (ERR_INSUFFICIENT_RESOURCES and AudioWorkletProcessor have no digit and stay).
function looksLikeToken(t) {
  const core = t.replace(/=+$/, '');
  const digit = /\d/.test(core), lower = /[a-z]/.test(core), upper = /[A-Z]/.test(core), letter = lower || upper;
  if (core.includes('/')) return core.length >= 24 && digit && lower && upper; // otherwise a path, swept below
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(core)) return true; // UUID
  if (/^[0-9a-fA-F]+$/.test(core)) return core.length >= 16 && digit && letter; // hash, hex id
  if (core.length < t.length && core.length >= 16) return true; // base64 padding
  return (core.length >= 24 && digit && letter) || (core.length >= 32 && lower && upper);
}
const credential = (v) => v.length >= 8 && (/\d/.test(v) || /=$/.test(v) || v.length >= 20);
function scrubSecrets(text) {
  let out = text;
  // V8 quotes the start of the text JSON.parse refused, cut anywhere ('Unexpected token 'B', ..."ization": Bearer
  // sk_"... is not valid JSON'): the whole excerpt goes. Not "undefined" or "[object Object]": a bug, not your text.
  if (out.includes(' is not valid JSON')) {
    out = out.replace(/(^|[\s,:])((?:\.\.\.)?)"([^\r\n]*?)"((?:\.\.\.)?)(?= is not valid JSON)/g, (m, pre, a, inner, b) =>
      (!a && !b && /^(undefined|null|NaN|\[object Object\])$/.test(inner) ? m : `${pre}"[text]"`));
  }
  return out
    // V8's RegExp error repeats the pattern ("Invalid regular expression: /a"b(/g: Unterminated group"); the pattern
    // may hold slashes, quotes or brackets, so everything up to the last "/flags: " is the pattern.
    .replace(/(Invalid regular expression: )\/[^\r\n]*\/([dgimsuvy]*): /gi, '$1/[pattern]/$2: ')
    // key = value, key: value, "key": "value" (headers, query strings, JSON); the key is kept for debugging
    .replace(/(\b(?:proxy-authorization|authorization|x-api-key|api[ _-]?key|apikey|access[ _-]?token|refresh[ _-]?token|id[_-]token|auth[_-]?token|client[_-]?secret|secret|password|passwd|pwd|passphrase|private[_-]?key|session[_-]?id|set-cookie|cookie)["']?\s*[:=]\s*["']?)(?:(?:bearer|basic|token|digest)\s+)?[^\s"'&,;)}\]]+/gi, `$1${SECRET}`)
    // words that are also plain English ("the access token expired") only with "=" or as a quoted JSON key
    .replace(/(\b(?:token|key|sig|signature|auth|sid|session|code_verifier)(?:=|["']\s*:\s*["']?))[^\s"'&,;)}\]]+/gi, `$1${SECRET}`)
    .replace(/\b(Bearer|Basic)\s+([A-Za-z0-9._~+/=-]+)/gi, (m, k, v) => (credential(v) ? `${k} ${SECRET}` : m))
    .replace(/\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}(?:\.[A-Za-z0-9_-]*)?/g, SECRET) // JWT
    // keys with a published prefix: OpenAI/Stripe sk-/sk_, pk_, rk_, GitHub, GitLab, Slack, AWS, Google, Hugging Face
    .replace(/\b(?:sk|pk|rk)[-_][A-Za-z0-9_-]{6,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bglpat-[A-Za-z0-9_-]{20,}|\bxox[abposr]-[A-Za-z0-9-]{10,}|\b(?:AKIA|ASIA)[0-9A-Z]{16}\b|\bAIza[0-9A-Za-z_-]{30,}|\bhf_[A-Za-z0-9]{20,}/g, SECRET);
}

export function sanitizeErrorMessage(message, fileName) {
  if (typeof message !== 'string' || !message) return '';
  let out = message.slice(0, 2000); // cheap upfront cap before any regex work
  out = scrubSecrets(out);
  // P25: URLs and e-mail addresses first, before the path sweep below turns "https://host/a/b" into "https:[path]".
  out = out
    .replace(/\b[a-z][a-z0-9+.-]{1,20}:\/\/[^\s"'<>]+/gi, '[url]')
    // P37: an address without its scheme (www.example.com/api?access_token=…), whole
    .replace(/(^|[\s"'(<=:,])(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d{2,5})?\/[^\s"'<>]*/gi, '$1[url]')
    .replace(/[^\s"'<>()@]{1,64}(?:@|%40)[^\s"'<>()@%]{1,255}\.[a-z]{2,}/gi, '[email]');

  if (fileName && typeof fileName === 'string') {
    const stem = fileName.replace(/\.[^./\\]+$/, '');
    for (const needle of [fileName, stem]) {
      if (needle && needle.length >= 2) {
        out = out.split(needle).join('[file]');
      }
    }
  }

  out = out
    // P37: keys, hashes and encoded blobs with no recognizable prefix (not one that starts a path: swept below)
    .replace(/(?<![\w/\\.+=%-])[A-Za-z0-9+/_=-]{16,}/g, (t) => (looksLikeToken(t) ? SECRET : t))
    // Windows/unix-ish paths: deliberately do NOT stop at a plain space --
    // real paths routinely contain them ("C:\Users\John Doe\...",
    // "/Users/John Doe/..."), and a naive \s-excluding class only redacts
    // up to the first space, leaking every real name/folder after it. Only
    // stop at a quote/bracket/newline (a real delimiter) or end of string;
    // over-redacting the rest of the message is the safe direction here.
    .replace(/[A-Za-z]:\\[^\r\n"'<>]+/g, '[path]') // Windows paths
    .replace(/(?:\.{1,2}\/|\/)(?!\[pattern\]\/)[^\r\n"'<>]*\/[^\r\n"'<>]*/g, '[path]') // unix-ish paths, not "/[pattern]/g"
    // Filename-shaped tokens: bounded by whitespace/quotes/brackets/string
    // edges rather than \b, which is defined via ASCII \w and silently
    // fails to bound a filename that starts with a non-Latin character
    // (e.g. "文档.pdf", "отчёт.xlsx") with nothing but a space before it.
    // {1,200}, not {1,80}: a regex engine can only match {1,80} starting up
    // to 80 chars before the extension's dot, so anything longer than the
    // cap leaves its prefix unmatched and leaking -- 200 covers every real
    // filename (filesystems cap components at 255 chars/bytes) while still
    // bounded by MAX_MESSAGE_LENGTH below.
    .replace(/(^|[\s"'()<>])([^\s"'()<>]{1,200}\.[A-Za-z0-9]{2,5})(?=[\s"'()<>]|$)/g, (m, pre, token) =>
      pre + (/^(e\.g|i\.e|etc)\.[a-z]{1,3}$/i.test(token) ? token : '[file]')
    )
    // P25 (03/10): every tool now reports the messages it shows, and some carry what the visitor typed or pasted
    // (V8's JSON error quotes the text: `Unexpected token 'h', "hello" is not valid JSON`; a currency code, a regex,
    // a URL to convert). Quoted spans, URLs, e-mail addresses and long digit runs are replaced as well -- over-redacting
    // a diagnostic message is the safe direction. A quote opens only after a separator and closes before one, so a
    // contraction ("isn't", "it's") is not mistaken for a quote. Placeholders already written are kept.
    .replace(/(^|[\s(\[:,=])(["'`‘“«])([^\r\n]{0,200}?)(["'`’”»])(?=$|[\s).,:;\]!?])/g,
      (m, pre, open, inner, close) => (/^(\[(file|path|url|email|text|number|secret|pattern)\]|undefined|null|NaN|\[object Object\])$/.test(inner) ? m : `${pre}${open}[text]${close}`))
    .replace(/(?<!0[xX][\da-fA-F]*)\d[\d\s.-]{5,}\d/g, (m) => (m.replace(/\D/g, '').length >= 7 ? '[number]' : m))
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
/**
 * @param {{ tool: string, source?: 'browser'|'server', file?: {name?: string, size?: number} | null, error?: Error | string | null | undefined, detectedExt?: string | null, errorType?: string }} args
 */
export function reportToolError({ tool, source = 'browser', file = null, error, detectedExt = null, errorType = null }) {
  try {
    // A code file of an older version of the site could not be loaded: the page is out of date, not the
    // tool broken -- offer a reload (NewVersionBanner) instead of filling tool_errors.
    if (isChunkLoadError(error)) { announceNewVersion(); return; }
    // A browser driven by a test robot never reports: our own tests must not fill tool_errors.
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    const message = (error && typeof error.message === 'string') ? error.message
      : (typeof error === 'string' ? error : '');
    const payload = {
      tool: typeof tool === 'string' ? tool.slice(0, 60) : 'unknown',
      source,
      ext: file ? extOf(file.name) : null,
      // Only set when a real-format sniff was run AND it differed from the
      // declared extension above -- lets tool_errors distinguish a
      // mislabeled upload from a genuine decode bug. See
      // docs/audit/RAPPORT-tiff-paint.md.
      detectedExt: typeof detectedExt === 'string' ? detectedExt.slice(0, 10) : null,
      sizeBucket: file && typeof file.size === 'number' ? sizeBucket(file.size) : null,
      errorType: (typeof errorType === 'string' && /^[A-Za-z0-9_]{1,60}$/.test(errorType) && errorType) || (error && typeof error.name === 'string' && /^[A-Za-z0-9_]{1,60}$/.test(error.name) && error.name) || 'Error',
      errorMessage: sanitizeErrorMessage(message, file && file.name),
      browser: typeof navigator !== 'undefined' ? parseBrowserLabel(navigator.userAgent) : 'unknown',
    };
    if (payload.errorType !== 'ToolMessage') lastFailureAt.set(payload.tool, Date.now());
    const key = `${payload.tool}|${payload.errorType}|${payload.errorMessage}`;
    if (sentKeys.has(key) || (sentPerTool.get(payload.tool) || 0) >= MAX_REPORTS_PER_TOOL) return;
    sentKeys.add(key);
    sentPerTool.set(payload.tool, (sentPerTool.get(payload.tool) || 0) + 1);
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

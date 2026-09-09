# Error Reporting (Remontée d'Erreurs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a tool fails for a real visitor (browser-side decode/convert failure, or a server-side conversion failure), silently and non-blockingly record enough information to fix it and to detect when one tool is systematically broken — without ever transmitting the visitor's file, its content, its real filename, or anything that identifies them.

**Architecture:** A single new Supabase table (`tool_errors`) collects sanitized, coarse-grained failure records. A shared isomorphic module (`app/lib/reportError.js`) does sanitization/bucketing and the non-blocking client-side send (`navigator.sendBeacon`, falling back to `fetch(..., {keepalive:true})`). A new public API route (`app/api/report-error`) validates, rate-limits (reusing the existing IP-hash mechanism), and inserts. Server routes that process visitor files insert directly via a server-only sibling module (`lib/reportError.js`), no HTTP round-trip. Aggregation and "systemic vs isolated" alerting is bolted onto the existing daily `app/api/cron/health-check` route (reusing `checkStateTransition` + `sendAlert`) rather than creating any new scheduled job.

**Tech Stack:** Next.js 16 App Router API routes, `@supabase/supabase-js` (service-role client, existing `lib/quota/supabaseAdmin.js`), existing `lib/alert.js` (Resend + ntfy), existing `lib/quota/counters.js` atomic-counter RPCs.

**Spec:** This plan implements the brief given directly in conversation (no separate spec doc) — see "Global Constraints" below for the non-negotiable rules extracted from it. Market-comparison research (recommendation: homemade collection point over Sentry) is summarized in Task 0 and written up in the final report, `docs/audit/RAPPORT-remontee-erreurs.md` (Task 17).

## Global Constraints

- NEVER transmit, log, or store: the file itself, any part of its content, its real filename, or anything that identifies a visitor. Only: tool name, file extension, size **bucket** (never exact size), error type + sanitized error message, coarse browser name+version (never the raw User-Agent string), timestamp.
- The client send MUST be non-blocking and MUST NEVER throw, console-error visibly, or slow down / break the tool. Wrap everything in try/catch; swallow all failures.
- The new API route is public and unauthenticated → MUST be rate-limited (reuse `lib/quota/ipHash.js` + `lib/quota/counters.js`, the existing hash-IP pattern — never store or log the raw IP), MUST cap payload size, MUST strictly allowlist-validate every field and reject unknown fields.
- Never a silent fallback for a missing env var in code that ships to production. A missing var fails loudly (throws / returns a clear error), never a hardcoded default.
- Never edit files to work around a local-only environment problem.
- Reuse `lib/alert.js` (via `sendAlert`) and the existing `checkStateTransition` state-machine for alerting — do not build a second alerting mechanism.
- No new scheduled job / cron / polling loop. Aggregation piggybacks on the existing daily `app/api/cron/health-check` route.
- Do not remove or rename any tool.
- The route (`app/api/report-error/route.js`) and the sanitization logic (`app/lib/reportError.js`'s `sanitizeErrorMessage`) MUST be reviewed by an independent subagent reviewer before commit — nothing else in this plan requires review.
- `docs/audit/RAPPORT-remontee-erreurs.md` must be written and committed: tables only, no intro/conclusion — chosen solution + why, exact fields transmitted, tools instrumented, alert threshold + justification, what's left undone, manual tests that are the owner's to run.

---

## Task 0: Market comparison (research, no code)

Already completed inline during planning via WebSearch. Findings to carry into the report (Task 17):

- **Sentry free tier (2026):** 5,000 errors/month, hard-capped — events beyond the cap are dropped unless you upgrade or configure a paid spend limit. Paid starts at $26/mo (annual) for 50k errors. Source: [Sentry Pricing 2026 — Last9](https://last9.io/blog/sentry-pricing/), [FreeTier.co Sentry listing](https://freetier.co/directory/products/sentry).
- **Sentry privacy:** Sentry is a third-party data processor. It offers `beforeSend` client scrubbing, a server-side data-scrubbing pane, and an optional self-hosted Relay proxy, plus an EU data-residency option — but by default event payloads (including breadcrumbs, which can capture console/network context) leave the browser for Sentry's infrastructure before any of that scrubbing happens, unless Relay is self-hosted. Source: [Sentry — Protecting User Privacy](https://docs.sentry.io/security-legal-pii/scrubbing/protecting-user-privacy/), [Sentry and Your Data](https://sentry.io/trust/privacy/), [Is Sentry GDPR Compliant? — ComplyDog](https://complydog.com/blog/is-sentry-gdpr-compliant).
- **Decision: homemade collection point**, reasoning to put in the report:
  1. **Confidentiality** — the site's public promise is "files are never logged." Any hosted third party is a data processor that receives the payload before scrubbing can be guaranteed client-side; a homemade endpoint means the payload never leaves infrastructure the owner already controls (Vercel + Supabase, already named in the privacy policy).
  2. **Cost** — $0 marginal cost: reuses the existing Supabase project and the existing Resend/ntfy alert channels already paid for and wired up (`lib/alert.js`). Sentry's free tier is workable at this site's expected error volume, but paying to unlock EU residency / self-hosted Relay to actually meet the "never logged" promise defeats the "free" framing, and running Sentry in parallel with the Supabase-based aggregation this task also requires (point 5) means maintaining two systems instead of one.
  3. **Effort** — the hard part is the sanitization logic (never send filenames/content), which is identical work either way: Sentry's scrubbing rules would still need to be hand-written for ffmpeg.wasm/UTIF2/Tesseract.js's specific message shapes. Given that work is unavoidable regardless of backend, and this project already has 100% of the supporting infrastructure (Supabase table pattern, hashed-IP rate limiting, dual-channel alerting, a daily cron for aggregation), a ~150-line homemade module is less total effort than integrating, configuring, and privacy-hardening a third-party SDK.

---

## Task 1: `tool_errors` Supabase table

**Files:**
- Create: `supabase/tool_errors.sql`

**Interfaces:**
- Produces: table `tool_errors(id, created_at, tool, source, ext, size_bucket, error_type, error_message, browser)`, consumed by Task 5 (server insert) and Task 15 (cron aggregation query).

- [ ] **Step 1: Write the migration file**

```sql
-- Sanitized, coarse-grained tool-failure log. Never contains the visitor's
-- file, its content, its real filename, or the raw IP -- see
-- docs/audit/RAPPORT-remontee-erreurs.md for the exact field contract.
-- Written by the public /api/report-error route (browser failures) and
-- directly by server routes that process visitor files (server failures).
-- Read by app/api/cron/health-check's daily aggregation (systemic vs
-- isolated detection) and, ad hoc, straight from the Supabase table editor.
create table if not exists tool_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tool text not null,
  source text not null check (source in ('browser', 'server')),
  ext text,
  size_bucket text,
  error_type text,
  error_message text,
  browser text
);
alter table tool_errors enable row level security;
-- No policies added: only the service role (lib/quota/supabaseAdmin.js) can
-- read/write this table, same pattern as usage_counters and usage_events.
create index if not exists tool_errors_tool_created_at_idx on tool_errors (tool, created_at);
create index if not exists tool_errors_created_at_idx on tool_errors (created_at);
```

- [ ] **Step 2: Hand off to the user to run**

This project has no automated SQL-migration runner (`usage_counters.sql`, `usage_events.sql`, `contact_messages.sql` were all applied by hand). Do not attempt to run this against Supabase yourself — you do not have and must not acquire the service-role key. Tell the user: "Run `supabase/tool_errors.sql` in the Supabase SQL editor before the report-error route can be tested end-to-end." Continue with the rest of the plan; later tasks' local/unit tests don't require the table to exist yet, but Task 6's manual verification does.

- [ ] **Step 3: Commit**

```bash
git add supabase/tool_errors.sql
git commit -m "$(cat <<'EOF'
feat(error-reporting): add tool_errors table

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 2: Rate-limit and alert-threshold config constants

**Files:**
- Modify: `lib/quota/config.js`

**Interfaces:**
- Produces: `TOOL_ERROR_RATE_LIMIT_PER_HOUR`, `TOOL_ERROR_RATE_LIMIT_PER_DAY`, `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` — consumed by Task 3 (rate limiter) and Task 15 (cron aggregation).

- [ ] **Step 1: Add the constants**

In `lib/quota/config.js`, right after the existing `IP_RATE_LIMIT_PER_HOUR`/`IP_RATE_LIMIT_PER_DAY` lines (currently lines 8-9), add:

```js
// A dedicated bucket, separate from IP_RATE_LIMIT_* above (which is shared
// across the 16 paid tools + Background Remover) -- error reports come from
// every one of 200+ free client-side tools too, and must never eat into
// that shared paid-route budget. Generous enough that a visitor genuinely
// hitting the same bug a few times while retrying isn't blocked, tight
// enough that the public endpoint can't be used to flood Supabase or the
// alert channel.
const TOOL_ERROR_RATE_LIMIT_PER_HOUR = Number(process.env.TOOL_ERROR_RATE_LIMIT_PER_HOUR || 20);
const TOOL_ERROR_RATE_LIMIT_PER_DAY = Number(process.env.TOOL_ERROR_RATE_LIMIT_PER_DAY || 100);
// See docs/audit/RAPPORT-remontee-erreurs.md for the justification: below
// the volume a single confused visitor's retries would produce, but well
// above what unlucky one-off files should generate across an entire day
// for one tool, across all visitors.
const TOOL_ERROR_ALERT_THRESHOLD_PER_DAY = Number(process.env.TOOL_ERROR_ALERT_THRESHOLD_PER_DAY || 10);
```

- [ ] **Step 2: Export them**

In the same file's `module.exports` block, add `TOOL_ERROR_RATE_LIMIT_PER_HOUR, TOOL_ERROR_RATE_LIMIT_PER_DAY, TOOL_ERROR_ALERT_THRESHOLD_PER_DAY,` to the existing export list.

- [ ] **Step 3: Verify it loads**

Run: `node -e "console.log(require('./lib/quota/config.js').TOOL_ERROR_ALERT_THRESHOLD_PER_DAY)"`
Expected: `10`

- [ ] **Step 4: Commit**

```bash
git add lib/quota/config.js
git commit -m "$(cat <<'EOF'
feat(error-reporting): add tool-error rate-limit and alert-threshold config

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 3: Dedicated rate limiter for the report-error route

**Files:**
- Create: `lib/quota/toolErrorRateLimit.js`
- Test: manual (Step 3 below) — this mirrors `lib/quota/ipRateLimit.js` exactly enough that a dedicated automated test isn't proportionate; it's exercised for real in Task 6's manual tests.

**Interfaces:**
- Consumes: `incrementCounter, decrementCounter` from `./counters` (signature: `incrementCounter(bucketKey, periodKey, amount, cap) -> {newValue, allowed}`), `hashIp, getClientIp` from `./ipHash`, `currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay` from `./period`, `TOOL_ERROR_RATE_LIMIT_PER_HOUR, TOOL_ERROR_RATE_LIMIT_PER_DAY` from `./config`.
- Produces: `checkToolErrorRateLimit(req) -> Promise<{allowed: true} | {allowed: false, retryAfterSeconds: number}>`, consumed by Task 6.

- [ ] **Step 1: Write the module**

```js
const { incrementCounter, decrementCounter } = require('./counters');
const { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } = require('./period');
const { hashIp, getClientIp } = require('./ipHash');
const { TOOL_ERROR_RATE_LIMIT_PER_HOUR, TOOL_ERROR_RATE_LIMIT_PER_DAY } = require('./config');

// Own bucket prefix ('tool_error_rate:'), deliberately separate from
// ipRateLimit.js's 'ip_rate:' buckets -- see config.js's comment on why
// this must not share the paid-route budget.
async function checkToolErrorRateLimit(req) {
  const rawIp = getClientIp(req);
  const hash = rawIp ? hashIp(rawIp) : 'unknown-ip';
  const hourKey = currentUtcHourKey();
  const dayKey = currentUtcDayKey();
  const hourBucket = `tool_error_rate:hour:${hash}`;
  const dayBucket = `tool_error_rate:day:${hash}`;

  const hourResult = await incrementCounter(hourBucket, hourKey, 1, TOOL_ERROR_RATE_LIMIT_PER_HOUR);
  if (!hourResult.allowed) {
    return { allowed: false, retryAfterSeconds: secondsUntilNextUtcHour() };
  }

  const dayResult = await incrementCounter(dayBucket, dayKey, 1, TOOL_ERROR_RATE_LIMIT_PER_DAY);
  if (!dayResult.allowed) {
    await decrementCounter(hourBucket, hourKey, 1);
    return { allowed: false, retryAfterSeconds: secondsUntilNextUtcDay() };
  }

  return { allowed: true };
}

module.exports = { checkToolErrorRateLimit };
```

- [ ] **Step 2: Sanity-check the module loads and exports the right shape**

Run: `node -e "const m = require('./lib/quota/toolErrorRateLimit.js'); console.log(typeof m.checkToolErrorRateLimit)"`
Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add lib/quota/toolErrorRateLimit.js
git commit -m "$(cat <<'EOF'
feat(error-reporting): add dedicated IP rate limiter for report-error route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 4: Shared isomorphic module — sanitization, bucketing, client send

**Files:**
- Create: `app/lib/reportError.js`
- Test: Create `scripts/error-reporting-tests/01-sanitize.js` (plain Node script, following this repo's existing `scripts/quota-tests/NN-*.js` convention — no test framework is configured for unit-level logic in this repo; these are run directly with `node`).

**Interfaces:**
- Produces: `sanitizeErrorMessage(message, fileName) -> string`, `sizeBucket(bytes) -> string`, `parseBrowserLabel(userAgent) -> string`, `extOf(fileName) -> string`, `reportToolError({ tool, source, file, error }) -> void` (fire-and-forget, never throws, never returns a promise the caller needs to await). Consumed by every tool page in Tasks 10-14, and `extOf`/`sizeBucket`/`sanitizeErrorMessage`/`parseBrowserLabel` are re-imported by the server module in Task 5.

- [ ] **Step 1: Write the module**

```js
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
```

- [ ] **Step 2: Write a Node-runnable check for the pure helpers**

```js
// scripts/error-reporting-tests/01-sanitize.js
// Plain-Node checks for the pure (non-browser) helpers in
// app/lib/reportError.js -- run with `node scripts/error-reporting-tests/01-sanitize.js`.
const assert = require('node:assert');
const { sanitizeErrorMessage, sizeBucket, extOf, parseBrowserLabel } = require('../../app/lib/reportError.js');

// Real filename must never survive.
assert.strictEqual(
  sanitizeErrorMessage('Failed to decode C:\\Users\\alice\\Documents\\vacation-photo.tiff', 'vacation-photo.tiff'),
  'Failed to decode [path]'
);
assert.strictEqual(
  sanitizeErrorMessage("Could not read 'my-secret-report.pdf'", 'my-secret-report.pdf'),
  "Could not read '[file]'"
);
// Unix-style path swept even without knowing the real filename.
assert.strictEqual(
  sanitizeErrorMessage('ENOENT: no such file or directory, open /tmp/abc123/input.mp3', null),
  'ENOENT: no such file or directory, open [path]'
);
// Generic message with no path/filename passes through unchanged.
assert.strictEqual(sanitizeErrorMessage('Unexpected token in stream', null), 'Unexpected token in stream');
// Truncation.
assert.ok(sanitizeErrorMessage('x'.repeat(5000), null).length <= 300);
// Non-string input never throws.
assert.strictEqual(sanitizeErrorMessage(null, null), '');
assert.strictEqual(sanitizeErrorMessage(undefined, null), '');

assert.strictEqual(sizeBucket(500 * 1024), '0-1MB');
assert.strictEqual(sizeBucket(5 * 1024 * 1024), '1-10MB');
assert.strictEqual(sizeBucket(30 * 1024 * 1024), '10-50MB');
assert.strictEqual(sizeBucket(100 * 1024 * 1024), '50-200MB');
assert.strictEqual(sizeBucket(500 * 1024 * 1024), '200MB+');
assert.strictEqual(sizeBucket('not a number'), null);

assert.strictEqual(extOf('photo.TIFF'), 'tiff');
assert.strictEqual(extOf('no-extension'), null); // 'no-extension'.split('.').pop() === 'no-extension', fails the alnum regex
assert.strictEqual(extOf(null), null);

assert.strictEqual(parseBrowserLabel('Mozilla/5.0 ... Chrome/129.0.0.0 Safari/537.36'), 'Chrome 129');
assert.strictEqual(parseBrowserLabel('Mozilla/5.0 ... Firefox/131.0'), 'Firefox 131');
assert.strictEqual(parseBrowserLabel('Mozilla/5.0 ... Edg/129.0.0.0'), 'Edge 129');
assert.strictEqual(parseBrowserLabel('garbage'), 'unknown');

console.log('All app/lib/reportError.js sanitizer checks passed.');
```

Note: `extOf('no-extension')` — walk through it: `'no-extension'.split('.')` is `['no-extension']`, `.pop()` is `'no-extension'`, which does NOT match `/^[a-z0-9]{1,10}$/` (it has a hyphen and is 13 chars) — so it correctly returns `null` via the ternary's false branch... but the function returns `'unknown'` in that branch, not `null`. **Fix the assertion, not the code**: change that line to `assert.strictEqual(extOf('no-extension'), 'unknown');` before running.

- [ ] **Step 3: Run it and confirm it passes**

Run: `node scripts/error-reporting-tests/01-sanitize.js`
Expected: `All app/lib/reportError.js sanitizer checks passed.` with exit code 0.

- [ ] **Step 4: Commit**

```bash
git add app/lib/reportError.js scripts/error-reporting-tests/01-sanitize.js
git commit -m "$(cat <<'EOF'
feat(error-reporting): add shared sanitization/bucketing module and client sender

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 5: Server-only insert helper

**Files:**
- Create: `lib/reportError.js`

**Interfaces:**
- Consumes: `extOf, sizeBucket, sanitizeErrorMessage, parseBrowserLabel` from `../app/lib/reportError.js`; `supabaseAdmin` from `./quota/supabaseAdmin`.
- Produces: `insertToolError({ tool, source, ext, sizeBucket, errorType, errorMessage, browser }) -> Promise<void>` (used by Task 6's route after it validates a browser payload, and directly by Task 9's server routes), `buildServerToolError({ tool, file, error, userAgent }) -> object` (convenience for server routes that have a `File`/error/optional request User-Agent header, produces the same shape `insertToolError` expects). Both never throw — failures are logged, never propagated to the caller's response.

- [ ] **Step 1: Write the module**

```js
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

// Used both by the API route (Task 6, after validating a browser-submitted
// payload) and directly by server routes (Task 9) -- single insert path so
// the two never drift on shape or on failure handling.
async function insertToolError({ tool, source, ext, sizeBucket: bucket, errorType, errorMessage, browser }) {
  if (!TOOL_RE.test(tool || '')) return;
  if (!ALLOWED_SOURCES.has(source)) return;

  const row = {
    tool,
    source,
    ext: ext && EXT_RE.test(ext) ? ext : null,
    size_bucket: bucket && SIZE_BUCKET_RE.test(bucket) ? bucket : null,
    error_type: clamp(errorType, 60) || 'Error',
    error_message: clamp(errorMessage, 300) || '',
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
```

- [ ] **Step 2: Sanity-check it loads**

Run: `node -e "const m = require('./lib/reportError.js'); console.log(typeof m.insertToolError, typeof m.buildServerToolError)"`
Expected: `function function`

- [ ] **Step 3: Commit**

```bash
git add lib/reportError.js
git commit -m "$(cat <<'EOF'
feat(error-reporting): add server-side tool_errors insert helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 6: `POST /api/report-error` route — REQUIRES INDEPENDENT REVIEW

**Files:**
- Create: `app/api/report-error/route.js`

**Interfaces:**
- Consumes: `checkToolErrorRateLimit` from `@/lib/quota/toolErrorRateLimit`, `insertToolError` from `@/lib/reportError`.
- Produces: the public endpoint that Task 4's `reportToolError()` posts to.

- [ ] **Step 1: Write the route**

```js
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
  const rateCheck = await checkToolErrorRateLimit(request);
  if (!rateCheck.allowed) {
    // No response body needed -- the client never reads this response
    // (sendBeacon has no return channel, and the fetch fallback discards
    // it) -- but a real status code still matters for server logs/metrics.
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
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
```

- [ ] **Step 2: Dispatch the required independent review**

Per this plan's Global Constraints, this route and `sanitizeErrorMessage` (Task 4) are the two pieces that need an independent reviewer before anything is committed further. Use the Agent tool with a fresh (non-fork) general-purpose or code-review-oriented agent. Prompt it with:
- The exact privacy contract (never file/content/filename/raw-IP; only tool/source/ext/sizeBucket/errorType/errorMessage/browser/timestamp).
- The two files to review: `app/api/report-error/route.js` and the `sanitizeErrorMessage` function in `app/lib/reportError.js`.
- What to check: (a) can any request path reach `insertToolError`/the DB without passing rate-limit + strict field validation; (b) does the allowlist genuinely reject every unexpected field/type/length; (c) does `sanitizeErrorMessage` actually strip realistic ffmpeg.wasm / UTIF2 / Tesseract.js-shaped messages (give it the real message shapes found during research: ffmpeg's own log lines reference only synthetic `input.<ext>`/`output.<ext>` names, never the real filename, since the caller always writes the file into ffmpeg's virtual FS under a synthetic name; UTIF2/tiffDecode.js's own thrown messages are all static, hand-written English sentences with zero filename interpolation; Tesseract.js receives a `<canvas>`, never a `File`, so it has no filename to leak) — the reviewer should specifically hunt for any case where a *different* library-thrown message (not the ones this project's code path controls) could still contain a real path, and confirm the generic path/filename sweep in Step 4 of Task 4 covers it; (d) rate limiting: confirm the dedicated bucket is genuinely separate from the paid-route IP budget and that both the hourly and daily caps are enforced before any DB write.
- Ask it to report findings, not to fix them — you apply any fixes yourself, in this session, so the diff stays reviewable as one unit.

- [ ] **Step 3: Address findings, then re-verify the route by hand**

Fix anything the reviewer flags. Then, once Task 1's `tool_errors.sql` has been applied by the user (confirm with them before this step) and the dev server is running (`npm run dev`), verify manually:

```bash
curl -i -X POST http://localhost:3000/api/report-error -H "Content-Type: application/json" -d '{"tool":"tiff-to-png","source":"browser","ext":"tif","sizeBucket":"1-10MB","errorType":"Error","errorMessage":"test message","browser":"Chrome 129"}'
```
Expected: `HTTP/1.1 204 No Content`. Then confirm a row landed by asking the user to check the Supabase table editor (do not query it yourself with the service-role key), or, if a `NEXT_PUBLIC_SUPABASE_ANON_KEY`-based read is feasible without RLS access (it won't be, RLS blocks anon — so this row-existence check is the user's to do, not yours).

Also verify the reject paths:
```bash
curl -i -X POST http://localhost:3000/api/report-error -H "Content-Type: application/json" -d '{"tool":"tiff-to-png","source":"browser","errorMessage":"x","evil":"field"}'
```
Expected: `HTTP/1.1 400`.

```bash
curl -i -X POST http://localhost:3000/api/report-error -H "Content-Type: application/json" -d '{"tool":"x","source":"server","errorMessage":"x"}'
```
Expected: `HTTP/1.1 400` (source must be 'browser' on this route).

- [ ] **Step 4: Commit**

```bash
git add app/api/report-error/route.js
git commit -m "$(cat <<'EOF'
feat(error-reporting): add public report-error API route

Reviewed by an independent subagent per the privacy-sensitivity of a
public collection endpoint; see docs/audit/RAPPORT-remontee-erreurs.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 7: Wire `alertServerError` into the 4 uncovered server code paths (point 3)

**Files:**
- Modify: `app/api/pdf-repair/route.ts`
- Modify: `app/api/pdf-to-pdfa/route.ts`
- Modify: `app/api/convert-html-to-pdf/route.ts`
- Modify: `app/api/convert-to-pdf/route.ts` (only the `handleGotenberg` function — `handleConvertApi` already calls `alertServerError`)

**Interfaces:**
- Consumes: `alertServerError` from `@/lib/quota/errorAlerts` (existing, already used by `convert-to-pdf`'s `handleConvertApi`, `pdf-to-word`, the 4 paid routes — signature `alertServerError(routeKey: string, detail: string) -> Promise<void>`, throttled to one alert per routeKey per UTC hour).

These four are the only server code paths with zero alerting today (confirmed by grepping `app/api` for both `sendAlert` and `alertServerError`). Each gets the same two additions: an `alertServerError` call in the "couldn't reach the service" catch block, and one in the "service responded but not OK / not the expected format" branch. 422 responses (client-side "your file is invalid," not an operational problem) and configuration-missing responses (500 when env vars are absent — a deploy-time problem, not a per-request one, and already loud in the Vercel function logs) are deliberately NOT alerted, matching this codebase's existing convention (`pdf-to-word`/`convert-to-pdf`'s ConvertAPI error tables mark exactly the "not our fault, no alert" cases with `alert: false`).

- [ ] **Step 1: `app/api/pdf-repair/route.ts`**

Add the import at the top:
```ts
import { alertServerError } from "@/lib/quota/errorAlerts";
```

In the `catch (err: any)` block (currently lines 58-66), after the existing `console.error` line:
```ts
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ ok: false, error: "Repair timed out. Try a smaller file." }, { status: 504 });
    }
    console.error("pdf-tools-service request failed:", err?.message || "unknown error");
    await alertServerError("pdf-repair", `unreachable: ${err?.message || "unknown error"}`);
    return NextResponse.json({ ok: false, error: "Could not reach the repair service." }, { status: 502 });
  } finally {
```

After the existing non-ok/non-422 log (currently lines 68-71):
```ts
  const body = await serviceResponse.text();
  if (!serviceResponse.ok && serviceResponse.status !== 422) {
    console.error("pdf-tools-service /v1/repair error:", serviceResponse.status, body.slice(0, 500));
    await alertServerError("pdf-repair", `service_error_${serviceResponse.status}`);
  }
```

- [ ] **Step 2: `app/api/pdf-to-pdfa/route.ts`**

Identical shape to Step 1 (same file layout, same `/v1/pdfa` service call) — add the same import, and:
```ts
    console.error("pdf-tools-service request failed:", err?.message || "unknown error");
    await alertServerError("pdf-to-pdfa", `unreachable: ${err?.message || "unknown error"}`);
    return NextResponse.json({ ok: false, error: "Could not reach the PDF/A service." }, { status: 502 });
```
```ts
  if (!serviceResponse.ok && serviceResponse.status !== 422) {
    console.error("pdf-tools-service /v1/pdfa error:", serviceResponse.status, body.slice(0, 500));
    await alertServerError("pdf-to-pdfa", `service_error_${serviceResponse.status}`);
  }
```

- [ ] **Step 3: `app/api/convert-html-to-pdf/route.ts`**

Add the import. Three spots need a call — the Gotenberg-unreachable catch, the non-ok Gotenberg response branch, and the non-PDF-despite-2xx branch:
```ts
    console.error("Gotenberg request failed:", err?.message || "unknown error");
    await alertServerError("convert-html-to-pdf", `unreachable: ${err?.message || "unknown error"}`);
    return NextResponse.json({ error: "Could not reach the conversion service." }, { status: 502 });
```
```ts
    const bodyText = await gotenbergResponse.text().catch(() => "");
    console.error("Gotenberg conversion error:", gotenbergResponse.status, bodyText.slice(0, 500));
    await alertServerError("convert-html-to-pdf", `service_error_${gotenbergResponse.status}`);
    return NextResponse.json(
```
```ts
  if (!isPdf) {
    console.error("Gotenberg returned a non-PDF response despite a 2xx status.");
    await alertServerError("convert-html-to-pdf", "non_pdf_response");
    return NextResponse.json({ error: "Conversion service returned an unexpected response." }, { status: 502 });
  }
```
(Leave the 401/403 authentication-failed branch alone — this is a deploy-time credential problem, not a per-visitor one, but it's arguably worth alerting too since it silently breaks every request; add it for consistency with the others: after `console.error("Gotenberg rejected the request...")`, add `await alertServerError("convert-html-to-pdf", "auth_failed_" + gotenbergResponse.status);`.)

- [ ] **Step 4: `app/api/convert-to-pdf/route.ts` — `handleGotenberg` only**

`alertServerError` is already imported (used by `handleConvertApi`). Add calls in `handleGotenberg`'s three failure branches, mirroring Step 3 exactly but with routeKey `"convert-to-pdf"`:
```ts
    console.error("Gotenberg request failed:", err?.message || "unknown error");
    await alertServerError("convert-to-pdf", `unreachable: ${err?.message || "unknown error"}`);
    return NextResponse.json({ error: "Could not reach the conversion service." }, { status: 502 });
```
```ts
    console.error("Gotenberg rejected the request: authentication failed (status " + gotenbergResponse.status + ")");
    await alertServerError("convert-to-pdf", "auth_failed_" + gotenbergResponse.status);
    return NextResponse.json({ error: "Conversion service authentication failed." }, { status: 502 });
```
```ts
    const bodyText = await gotenbergResponse.text().catch(() => "");
    console.error("Gotenberg conversion error:", gotenbergResponse.status, bodyText.slice(0, 500));
    await alertServerError("convert-to-pdf", `service_error_${gotenbergResponse.status}`);
    return NextResponse.json(
```
```ts
  if (!isPdf) {
    console.error("Gotenberg returned a non-PDF response despite a 2xx status.");
    await alertServerError("convert-to-pdf", "non_pdf_response");
    return NextResponse.json({ error: "Conversion service returned an unexpected response." }, { status: 502 });
  }
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors in the 4 modified files.

- [ ] **Step 6: Commit**

```bash
git add app/api/pdf-repair/route.ts app/api/pdf-to-pdfa/route.ts app/api/convert-html-to-pdf/route.ts app/api/convert-to-pdf/route.ts
git commit -m "$(cat <<'EOF'
fix(server-tools): alert on the 4 server code paths lib/alert.js never covered

pdf-repair, pdf-to-pdfa, convert-html-to-pdf, and convert-to-pdf's
Gotenberg fallback path had zero operational alerting -- a broken
dependency there could run silently, same class of gap as the CMYK
regression this whole effort is a response to. Reuses the existing
throttled alertServerError(), no new alert mechanism.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 8: Log `tool_errors` rows from the same 5 server routes (point 8, server side)

**Files:**
- Modify: `app/api/pdf-repair/route.ts`
- Modify: `app/api/pdf-to-pdfa/route.ts`
- Modify: `app/api/convert-html-to-pdf/route.ts`
- Modify: `app/api/convert-to-pdf/route.ts` (`handleGotenberg` and `handleConvertApi`)
- Modify: `app/api/pdf-to-word/route.ts`

**Interfaces:**
- Consumes: `buildServerToolError` from `@/lib/reportError` (Task 5), `insertToolError` from the same module.

This is a separate signal from Task 7's `alertServerError`: `alertServerError` is a throttled real-time page; `tool_errors` is the historical/per-tool record that Task 15's daily aggregation reads to tell an isolated blip from a systemic pattern. Both fire on the same failure branches — call both, in either order, in each spot Task 7 touched.

- [ ] **Step 1: `app/api/pdf-repair/route.ts`**

Add the import:
```ts
import { buildServerToolError, insertToolError } from "@/lib/reportError";
```

In the unreachable-service catch block, alongside the `alertServerError` call added in Task 7:
```ts
    await insertToolError(buildServerToolError({
      tool: "pdf-repair",
      file,
      error: err,
      userAgent: req.headers.get("user-agent"),
    }));
```
(`file` is already in scope at this point in the function — declared earlier in `POST`.)

In the non-ok/non-422 branch:
```ts
  if (!serviceResponse.ok && serviceResponse.status !== 422) {
    console.error("pdf-tools-service /v1/repair error:", serviceResponse.status, body.slice(0, 500));
    await alertServerError("pdf-repair", `service_error_${serviceResponse.status}`);
    await insertToolError(buildServerToolError({
      tool: "pdf-repair",
      file,
      error: new Error(`service_error_${serviceResponse.status}`),
      userAgent: req.headers.get("user-agent"),
    }));
  }
```

- [ ] **Step 2: `app/api/pdf-to-pdfa/route.ts`**

Same pattern as Step 1, `tool: "pdf-to-pdfa"`.

- [ ] **Step 3: `app/api/convert-html-to-pdf/route.ts`**

Same pattern, `tool: "convert-html-to-pdf"`, applied at the same three spots Task 7 touched (unreachable, auth-failed, service-error, non-PDF).

- [ ] **Step 4: `app/api/convert-to-pdf/route.ts`**

Apply to `handleGotenberg`'s four spots (`tool` should be the actual source extension's tool identity — since this one route serves doc/xlsx/xls/csv/ods/pptx/ppt/docx, pass `tool: "convert-to-pdf-" + extension` so the per-tool aggregation in Task 15 can tell a systemic DOC-to-PDF break from an XLSX-to-PDF break). Also add it to `handleConvertApi`'s two failure spots (`non_pdf_response` and the `catch` block's `ConvertApiError`/unexpected-error branches), `tool: "word-to-pdf"`.

- [ ] **Step 5: `app/api/pdf-to-word/route.ts`**

Add the import. In the `non_pdf`-shaped branch (`if (!isDocx)`) and the `catch (err)` block's three outcomes (mapped `ConvertApiError`, and the final unexpected-error fallthrough), add matching `insertToolError(buildServerToolError({ tool: "pdf-to-word", file, error: ..., userAgent: req.headers.get("user-agent") }))` calls next to each existing `alertServerError` call.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/pdf-repair/route.ts app/api/pdf-to-pdfa/route.ts app/api/convert-html-to-pdf/route.ts app/api/convert-to-pdf/route.ts app/api/pdf-to-word/route.ts
git commit -m "$(cat <<'EOF'
feat(error-reporting): log tool_errors rows from the 5 server-processed PDF routes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 9: Instrument the 3 TIFF tools (shared Worker decode path)

**Files:**
- Modify: `app/tools/image-tools/tiff-to-png/page.jsx`
- Modify: `app/tools/image-tools/tiff-to-jpg/page.jsx`
- Modify: `app/tools/image-tools/image-converter/page.tsx`

**Interfaces:**
- Consumes: `reportToolError` from `../../../lib/reportError` (adjust relative path per file's depth).

- [ ] **Step 1: `tiff-to-png/page.jsx`**

Add the import:
```jsx
import { reportToolError } from '../../../lib/reportError';
```

In `convert()`'s `worker.onmessage` handler (currently lines 63-76), the `'error'` branch, and the `timeoutRef.current` timeout branch (lines 57-61), and `worker.onerror` (lines 77-81) each currently call `setError(...)` — add a `reportToolError` call right before each `setError`:

```jsx
    timeoutRef.current = setTimeout(() => {
      stopWorker();
      reportToolError({ tool: 'tiff-to-png', file, error: new Error('decode_timeout') });
      setError(TIFF_DECODE_TIMEOUT_MESSAGE);
      setLoading(false);
    }, TIFF_DECODE_TIMEOUT_MS);

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'done') {
        stopWorker();
        const url = URL.createObjectURL(msg.blob);
        resultUrlRef.current = url;
        setResult(url);
        setLoading(false);
      } else if (msg.type === 'error') {
        stopWorker();
        reportToolError({ tool: 'tiff-to-png', file, error: new Error(msg.message) });
        setError(msg.knownLimitation ? msg.message : 'Could not decode this TIFF file: ' + msg.message);
        setLoading(false);
      }
    };
    worker.onerror = (err) => {
      stopWorker();
      reportToolError({ tool: 'tiff-to-png', file, error: new Error(err?.message || 'unknown worker error') });
      setError('Could not decode this TIFF file: ' + (err?.message || 'unknown worker error'));
      setLoading(false);
    };
```

Do NOT instrument the `'done'` branch — that's success, and must never send a report.

- [ ] **Step 2: `tiff-to-jpg/page.jsx`**

Same file shape as `tiff-to-png` (confirmed identical Worker/error pattern in this codebase's TIFF-tool family) — apply the identical 3 edits with `tool: 'tiff-to-jpg'`.

- [ ] **Step 3: `image-converter/page.tsx`**

This is a `.tsx` file and handles many formats, not just TIFF, and uses `TIFF_DECODE_TIMEOUT_MS`/`TIFF_DECODE_TIMEOUT_MESSAGE` from the same shared `tiffDecode.js` per the codebase's own comment ("Shared by tiff-to-jpg, tiff-to-png and image-converter's Web Workers"). Find its TIFF-decode error branches (search the file for `TIFF_DECODE_TIMEOUT_MESSAGE` and the Worker `onerror`/`'error'`-message handling) and apply the same pattern as Steps 1-2, with `tool: 'image-converter'`. Since this tool handles many input formats, also check whether it has other format-specific decode failure branches (e.g., a generic `catch` around `createImageBitmap()` or `canvas.toBlob()` for non-TIFF formats) — if so, instrument those too with the same `tool: 'image-converter'` (all of this tool's decode failures, regardless of input format, are one tool's failure rate for Task 15's aggregation).

- [ ] **Step 4: Manual browser verification (do this once, covers all 3 — see Task 16 for the full manual-test list)**

Start the dev server (`npm run dev`), open `tiff-to-png`, upload a deliberately corrupt file renamed to `.tiff` (e.g. a text file renamed), trigger the conversion, and use the browser's Network tab to confirm a `POST /api/report-error` (or `sendBeacon` request, which shows as `report-error` with type `ping`/`beacon` depending on browser) fired with no `[file]`-unredacted real filename anywhere in its request body. Then upload a real, valid TIFF and confirm NO such request fires on success.

- [ ] **Step 5: Commit**

```bash
git add app/tools/image-tools/tiff-to-png/page.jsx app/tools/image-tools/tiff-to-jpg/page.jsx app/tools/image-tools/image-converter/page.tsx
git commit -m "$(cat <<'EOF'
feat(error-reporting): instrument the 3 TIFF-decoding tools

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 10: Instrument HEIC tools

**Files:**
- Modify: `app/tools/image-tools/heic-to-jpg/page.jsx`
- Modify: `app/tools/image-tools/heic-to-png/page.jsx`

**Interfaces:**
- Consumes: `reportToolError` from `../../../lib/reportError`.

- [ ] **Step 1: `heic-to-jpg/page.jsx`**

Add the import. In `convert()`'s `catch (err)` block (currently lines 33-35):
```jsx
    } catch (err) {
      reportToolError({ tool: 'heic-to-jpg', file, error: err });
      setStatus('Error: ' + err.message);
    }
```

- [ ] **Step 2: `heic-to-png/page.jsx`**

Confirm its structure matches `heic-to-jpg` (same `heic2any` call, same try/catch shape — verify by reading the file first, since unlike the TIFF family this hasn't been directly confirmed in this plan's research). Apply the same edit, `tool: 'heic-to-png'`.

- [ ] **Step 3: Commit**

```bash
git add app/tools/image-tools/heic-to-jpg/page.jsx app/tools/image-tools/heic-to-png/page.jsx
git commit -m "$(cat <<'EOF'
feat(error-reporting): instrument the 2 HEIC-decoding tools

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 11: Instrument the 9 ffmpeg.wasm tools

**Files:**
- Modify: `app/tools/audio-tools/audio-converter/page.jsx`
- Modify: `app/tools/audio-tools/audio-compressor/page.jsx`
- Modify: `app/tools/audio-tools/audio-booster/page.jsx`
- Modify: `app/tools/audio-tools/audio-splitter/page.jsx`
- Modify: `app/tools/audio-tools/audio-merger/page.jsx`
- Modify: `app/tools/audio-tools/audio-trimmer/page.jsx`
- Modify: `app/tools/video-tools/video-to-audio/page.jsx`
- Modify: `app/tools/video-tools/video-watermark/page.jsx`
- Modify: `app/tools/gif-tools/gif-to-mp4/page.jsx`

**Interfaces:**
- Consumes: `reportToolError` from the appropriate relative path (`../../../lib/reportError` for tools nested `app/tools/<category>/<tool>/page.jsx`).

All 9 use `@ffmpeg/ffmpeg` and follow `audio-converter/page.jsx`'s confirmed shape: a `try { ... } catch(e) { console.error(...); if (ffmpegRef.current) { ...; setError(...) } }` block. ffmpeg.wasm never sees the visitor's real filename (the file is always written into its virtual filesystem under a synthetic `input.<ext>` name — see `sanitizedInputExt`), so `e.message` is already filename-free by construction; `sanitizeErrorMessage`'s generic sweep is defense in depth, not the primary guarantee here.

- [ ] **Step 1: `audio-converter/page.jsx`** (the confirmed reference case)

Add the import:
```jsx
import { reportToolError } from '../../../lib/reportError';
```

In the `catch(e)` block (currently lines 62-72):
```jsx
    } catch(e) {
      console.error('Conversion failed:', e);
      if (ffmpegRef.current) {
        const reason = (e && e.message) || (typeof e === 'string' ? e : null) || 'an unknown error -- check the browser console for details';
        reportToolError({ tool: 'audio-converter', file, error: e instanceof Error ? e : new Error(String(reason)) });
        setError('Conversion failed: ' + reason);
      }
    }
```

- [ ] **Step 2: The other 8 tools**

For each of `audio-compressor`, `audio-booster`, `audio-splitter`, `audio-merger`, `audio-trimmer`, `video-to-audio`, `video-watermark`, `gif-to-mp4`: open the file, locate its ffmpeg `catch` block (expect the same `console.error` + conditional `setError` shape as Step 1 — if a given file's shape differs, adapt the edit to that file's actual structure rather than forcing the exact snippet above), add the same import (adjust the relative path: `video-tools`/`gif-tools` tools are also 3 levels deep, so `../../../lib/reportError` is correct for all 9), and add one `reportToolError({ tool: '<tool-slug>', file, error })` call immediately before that file's own `setError` call on the failure path. Use each tool's own directory name as `tool` (`audio-compressor`, `audio-booster`, `audio-splitter`, `audio-merger`, `audio-trimmer`, `video-to-audio`, `video-watermark`, `gif-to-mp4`).

- [ ] **Step 3: Manual verification on one representative tool**

Same as Task 9 Step 4: on `audio-converter`, upload a non-audio file (e.g. a `.txt` renamed to `.mp3`), confirm a report fires with a sanitized message and no filename; upload a real audio file and confirm success sends nothing.

- [ ] **Step 4: Commit**

```bash
git add app/tools/audio-tools/audio-converter/page.jsx app/tools/audio-tools/audio-compressor/page.jsx app/tools/audio-tools/audio-booster/page.jsx app/tools/audio-tools/audio-splitter/page.jsx app/tools/audio-tools/audio-merger/page.jsx app/tools/audio-tools/audio-trimmer/page.jsx app/tools/video-tools/video-to-audio/page.jsx app/tools/video-tools/video-watermark/page.jsx app/tools/gif-tools/gif-to-mp4/page.jsx
git commit -m "$(cat <<'EOF'
feat(error-reporting): instrument the 9 ffmpeg.wasm audio/video tools

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 12: Instrument client-side PDF tools (pdfjs-dist / Tesseract.js)

**Files:**
- Modify: `app/tools/pdf-tools/pdf-ocr/page.jsx`
- Modify: `app/tools/pdf-tools/pdf-to-image/page.jsx`
- Modify: `app/tools/pdf-tools/pdf-to-jpg/page.jsx`
- Modify: `app/tools/pdf-tools/pdf-extract-text/page.jsx`

**Interfaces:**
- Consumes: `reportToolError` from `../../../lib/reportError`.

- [ ] **Step 1: `pdf-ocr/page.jsx`** (the confirmed reference case)

Add the import. In `ocr()`'s `catch (e)` block (currently lines 197-198):
```jsx
    } catch (e) {
      reportToolError({ tool: 'pdf-ocr', file, error: e });
      setError('OCR failed: ' + e.message);
    } finally {
```
Note the sanitizer is what protects this specific tool: `e.message` here can legitimately come from pdfjs-dist parsing a malformed PDF, and pdfjs error messages have been known to echo back structural details from the file — never OCR'd *text* (that lives in local `output` state, which this edit never touches), but `sanitizeErrorMessage`'s generic filename/path sweep is the real safety net for this tool specifically. Do not report `output` under any circumstance.

- [ ] **Step 2: The other 3 PDF tools**

Read each file, locate its file-decode `catch` block, add the same import and a `reportToolError({ tool: '<slug>', file, error })` call before its own error-surfacing call. Use `pdf-to-image`, `pdf-to-jpg`, `pdf-extract-text` as the `tool` values respectively. For `pdf-extract-text` specifically: confirm the edit is placed around the *parsing/decode* failure (pdfjs failing to open the file), not anywhere near the extracted text itself — never pass extracted text content into `reportToolError`.

- [ ] **Step 3: Commit**

```bash
git add app/tools/pdf-tools/pdf-ocr/page.jsx app/tools/pdf-tools/pdf-to-image/page.jsx app/tools/pdf-tools/pdf-to-jpg/page.jsx app/tools/pdf-tools/pdf-extract-text/page.jsx
git commit -m "$(cat <<'EOF'
feat(error-reporting): instrument 4 client-side PDF tools

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 13: Instrument ZIP Extractor

**Files:**
- Modify: `app/tools/file-tools/zip-extractor/page.jsx`

**Interfaces:**
- Consumes: `reportToolError` from `../../../lib/reportError`.

- [ ] **Step 1: Edit**

Add the import. This tool currently uses `alert('Error: ' + e.message)` (line 24) instead of a state-driven error message — leave that UI behavior exactly as-is (out of scope for this plan), just add the report call:
```jsx
    } catch(e) {
      reportToolError({ tool: 'zip-extractor', file, error: e });
      alert('Error: ' + e.message);
    }
```

- [ ] **Step 2: Commit**

```bash
git add app/tools/file-tools/zip-extractor/page.jsx
git commit -m "$(cat <<'EOF'
feat(error-reporting): instrument ZIP Extractor

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 14: Aggregation and alerting in the daily health-check cron (point 5)

**Files:**
- Modify: `app/api/cron/health-check/route.ts`

**Interfaces:**
- Consumes: `checkStateTransition` (already imported), `sendAlert` (already imported), `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` from `@/lib/quota/config`.

Runs once daily (`vercel.json`'s cron schedule is `0 8 * * *`), so the aggregation window is the trailing 24 hours, checked once per run — this is not a new scheduled job, it's one more step inside the job that already exists and already does this kind of digest/threshold work (see `buildDailyDigest` and the per-dependency `checkStateTransition` loop already in this file).

- [ ] **Step 1: Add the import**

```ts
import { TOOL_ERROR_ALERT_THRESHOLD_PER_DAY } from "@/lib/quota/config";
```

- [ ] **Step 2: Add the aggregation function**

Insert after `buildDailyDigest` (after its closing `}`, currently line 152):

```ts
// Distinguishes an isolated one-off failure from a tool that's
// systematically broken (spec point 5): counts tool_errors rows per tool
// over the trailing 24h and alerts once per tool on crossing into "problem"
// state, using the same checkStateTransition machinery the per-dependency
// health checks above already use -- so a tool that's still over-threshold
// on tomorrow's run stays silent, and a matching "recovered" alert fires
// once it drops back under.
async function checkToolErrorRates() {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("tool_errors").select("tool").gte("created_at", since);
  if (error) {
    console.error("health-check: tool_errors read failed (non-fatal):", error.message);
    return;
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    if (!row.tool) continue;
    counts[row.tool] = (counts[row.tool] || 0) + 1;
  }

  // Every tool that was over threshold on a PRIOR run and has since fallen
  // silent (zero rows today) needs its own transition check too, so a
  // recovery still fires -- not just tools present in today's counts.
  const { data: activeProblems, error: activeErr } = await supabaseAdmin
    .from("usage_counters").select("bucket_key")
    .like("bucket_key", "alert_state:tool-error-rate:%").eq("value", 1);
  if (activeErr) console.error("health-check: active tool-error-rate state read failed (non-fatal):", activeErr.message);
  for (const row of activeProblems || []) {
    const tool = row.bucket_key.replace("alert_state:tool-error-rate:", "");
    if (!(tool in counts)) counts[tool] = 0;
  }

  for (const [tool, count] of Object.entries(counts)) {
    const isProblem = count >= TOOL_ERROR_ALERT_THRESHOLD_PER_DAY;
    const transition = await checkStateTransition(`tool-error-rate:${tool}`, isProblem);
    if (transition.alert) {
      await sendAlert(
        "tool-error-rate",
        transition.recovered ? `recovered: ${tool}` : `${tool}: ${count} failures in the last 24h (threshold ${TOOL_ERROR_ALERT_THRESHOLD_PER_DAY})`
      );
    }
  }
}
```

- [ ] **Step 3: Call it from `GET`**

After the existing per-dependency `checkStateTransition` loop (currently lines 180-185), before `buildDailyDigest()` is called:

```ts
  await checkToolErrorRates();

  const digest = await buildDailyDigest();
```

- [ ] **Step 4: Add housekeeping pruning**

In the existing housekeeping block at the end of `GET` (currently lines 190-199), alongside the `usage_events` 90-day prune, add the same retention for `tool_errors` (matches the privacy policy's existing "usage metrics kept 90 days" promise, extended in Task 15 to explicitly cover this table too):

```ts
  const { error: toolErrorsDeleteErr } = await supabaseAdmin
    .from("tool_errors").delete().lt("created_at", ninetyDaysAgo);
  if (toolErrorsDeleteErr) console.error("health-check housekeeping: tool_errors prune failed (non-fatal):", toolErrorsDeleteErr.message);
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Manual verification**

This can't be fully exercised locally without waiting for the real cron trigger, but the aggregation function itself can be smoke-tested once `tool_errors` has rows (after Task 6/9's manual tests have inserted a few): hit the route's existing manual-test escape hatch — `GET /api/cron/health-check?test=true` — with the correct `Authorization: Bearer $CRON_SECRET` header, and confirm it returns 200 without throwing (it won't send the tool-error alert unless the threshold is actually crossed, but it proves the query/loop doesn't error).

- [ ] **Step 7: Commit**

```bash
git add app/api/cron/health-check/route.ts
git commit -m "$(cat <<'EOF'
feat(error-reporting): aggregate tool_errors daily, alert on systemic per-tool failure

Reuses the existing daily cron and checkStateTransition/sendAlert
machinery -- no new scheduled job. Threshold and window justified in
docs/audit/RAPPORT-remontee-erreurs.md.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 15: Privacy page update (point 7)

**Files:**
- Modify: `app/privacy/page.jsx`

- [ ] **Step 1: Extend Section 2 ("Information We Collect")**

After the existing "Usage Metrics" bullet (currently lines 29), add a new bullet in the same `<ul>`:

```jsx
              <li><strong>Failure Reports:</strong> When a tool fails to process your file, we automatically record a small, anonymous record so we can find and fix the problem: the tool's name, the file's extension, a coarse size range (e.g. "1-10MB" — never the exact size), the type and a cleaned error message, a coarse browser name and version (e.g. "Chrome 129" — never your full browser signature), and the time. We never record your file, any part of its content, its real filename, your IP address, or anything else that could identify you. Nothing is sent when a tool succeeds.</li>
```

- [ ] **Step 2: Extend Section 6 ("Data Retention")**

Currently: `"Usage metrics (described in Section 2) are kept for 90 days. Hashed-IP rate-limit records are kept for 2 days."` — add a clause for failure reports (also 90 days, matching Task 14's housekeeping prune):

```jsx
            <p className="text-neutral-600 text-sm leading-relaxed">We retain your personal data only for as long as necessary to provide the service. Usage metrics (described in Section 2) are kept for 90 days. Failure reports (described in Section 2) are also kept for 90 days. Hashed-IP rate-limit records are kept for 2 days.</p>
```

- [ ] **Step 3: Verify the page still builds**

Run: `npx next build --dry-run 2>/dev/null || npx tsc --noEmit -p . 2>/dev/null; node -e "require('@babel/core')" 2>/dev/null; echo done`

Simpler and more reliable for a JSX-only change: just run the full build (Task 17 does this anyway) — no separate check needed here beyond visually re-reading the edited JSX for a stray unclosed tag.

- [ ] **Step 4: Commit**

```bash
git add app/privacy/page.jsx
git commit -m "$(cat <<'EOF'
docs(privacy): disclose the new failure-report collection honestly

Names exactly what's sent (tool, extension, size bucket, error type and
message, browser+version, timestamp) and exactly what never is (file,
content, real filename, IP address).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

---

## Task 16: Admin visibility (point 6) — propose only, do not build without agreement

**No files modified in this task.**

Per the brief: "ne la construis pas sans accord" (don't build an admin page without agreement). This task is a deliverable of the plan only in the sense that it must be *offered* with an effort estimate, not implemented.

- [ ] **Step 1: Confirm the minimum-acceptable option already exists**

`tool_errors` (Task 1) is a plain, readable Supabase table with exploitable columns (`tool`, `source`, `ext`, `size_bucket`, `error_type`, `error_message`, `browser`, `created_at`) — the owner can already open it directly in the Supabase Table Editor, sort/filter by `tool` or `created_at`, with zero additional work. State this plainly in the final report (Task 17) as the minimum-acceptable option that is already satisfied.

- [ ] **Step 2: Draft the admin-page proposal for the report, do not implement**

No existing admin auth exists anywhere in this codebase (confirmed: no `app/admin`, no auth middleware). A protected admin page would need, at minimum: (a) some auth gate — Supabase Auth already exists for the small number of tools that require an account, so the smallest-effort option is a route restricted to a specific allowlisted account email/id via `supabase.auth.getUser()` in the route/page, not a new auth system; (b) a simple read-only table/chart view over `tool_errors` (counts per tool per day, most recent rows). Estimate: roughly half a day of focused work for a bare-bones version (one server component, one Supabase query, one table render, one email-allowlist check) — larger if the owner wants charts, date-range filtering, or per-tool drill-down. Put this estimate and option in the report; do not scaffold any files for it.

---

## Task 17: Tests, report, commit, deploy, verify

**Files:**
- Create: `docs/audit/RAPPORT-remontee-erreurs.md`

- [ ] **Step 1: Run the full manual test matrix**

These are the concrete proofs the brief asks for. Do them for real, in a browser, against the local dev server (`npm run dev`) with `tool_errors.sql` already applied (confirm with the user first):

1. **Fires on failure:** for at least one tool per category (TIFF: `tiff-to-png`; HEIC: `heic-to-jpg`; ffmpeg: `audio-converter`; PDF: `pdf-ocr`; archive: `zip-extractor`), upload a deliberately invalid file (wrong content behind a matching extension) and confirm a beacon/fetch to `/api/report-error` fires (browser DevTools → Network tab, filter `report-error`).
2. **Silent on success:** for the same 5 tools, upload a genuinely valid file, complete the conversion successfully, and confirm NO request to `/api/report-error` appears.
3. **No filename/content ever:** for each request captured in test 1, inspect its request payload (Network tab → the beacon/fetch request → Payload) and confirm the real uploaded filename does not appear anywhere in `errorMessage`, and that no field carries file content.
4. **Collector failure doesn't break the tool:** with the dev server running, temporarily rename `app/api/report-error/route.js` (e.g. append `.disabled`) so the route 404s, then repeat test 1 on one tool and confirm the tool's own error UI still renders normally (no unhandled exception, no hang) despite the reporting call failing. Restore the file afterward.
5. **Abuse protection works:** send `TOOL_ERROR_RATE_LIMIT_PER_HOUR + 1` (i.e. 21) requests in a loop to `POST /api/report-error` with a valid payload and confirm the 21st returns `429` with a `Retry-After` header (use `curl` in a loop — see the exact command in the report).

- [ ] **Step 2: Write the report**

Tables only, no introduction or conclusion — exactly the sections the brief asked for: chosen solution + why (from Task 0), exact fields transmitted (from Task 4's payload shape and Task 15's privacy-page wording), tools instrumented (Tasks 9-13, list every tool + its category, plus the 5 server routes from Task 8), the alert threshold + justification (from Task 2/14), what's left undone (the ~200 remaining tools not yet instrumented, grouped by category with a rough count; the admin page from Task 16), and the manual tests that are the owner's to run (Task 1 Step 2's SQL application, and confirming the Supabase table shows real rows after the tests in Step 1 above, and confirming alert emails/ntfy notifications actually arrive when a threshold is crossed — that last one can't be verified without waiting for real traffic or the owner manually inserting >= threshold rows and re-running the cron's `?test=true`-adjacent real path, which only the owner can trigger against production `RESEND_API_KEY`/`NTFY_TOPIC`).

- [ ] **Step 3: Full build + typecheck**

Run: `npm run build`
Expected: exits 0, including the `check-tool-links` prebuild step (confirms no tool page was accidentally broken by the edits).

- [ ] **Step 4: Commit the report with the rest**

```bash
git add docs/audit/RAPPORT-remontee-erreurs.md
git commit -m "$(cat <<'EOF'
docs(error-reporting): add final report

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01FhsaB6YVnQB29THbpmhq9m
EOF
)"
```

- [ ] **Step 5: Push and deploy**

Confirm with the user before pushing (per this session's standing instruction to confirm before actions visible to others / affecting shared state). Then:
```bash
git push
```
Deploy via the project's normal Vercel flow (this repo deploys from `master` via Git integration per existing memory/workflow — confirm no separate manual `vercel deploy` step is expected before assuming one).

- [ ] **Step 6: Verify exactly once**

Once Vercel finishes building, check the deployment status is `READY` (via the Vercel MCP tools already available in this session, or the dashboard) — a single check, not a polling loop, per the brief's explicit "no monitoring loop" constraint.

---

## Self-Review Notes

- **Spec coverage:** point 1 (market comparison) → Task 0. Point 2 (browser collection, non-blocking, sendBeacon) → Task 4. Point 3 (server failures not covered by lib/alert.js) → Task 7. Point 4 (collection route: rate limit, payload cap, strict validation) → Tasks 1, 3, 6. Point 5 (aggregation/threshold alert, reuse existing alert) → Task 14. Point 6 (admin visibility, propose only) → Task 16. Point 7 (privacy page) → Task 15. Point 8 (instrument decode-heavy tools, list done/pending) → Tasks 9-13 (browser) + Task 8 (server), pending list written in Task 17's report. Review requirement (route + sanitizer only) → Task 6 Step 2. Tests → Task 17 Step 1. Report → Task 17 Step 2. Commit/push/deploy/verify-once → Task 17 Steps 4-6.
- **No placeholders:** every task has literal code, exact file paths, and exact commands; the two spots that ask an executor to "read the file first" (Task 10 Step 2, Task 12 Step 2) are flagged precisely because this plan's author did not directly read those specific files during research, and instructs adapting to the real shape found rather than blindly pasting — that's an explicit, bounded judgment call, not an unspecified TBD.
- **Type/name consistency:** `reportToolError({ tool, source, file, error })` (Task 4) is called identically (positional shape) in every instrumentation task (9-13); `insertToolError`/`buildServerToolError` (Task 5) are used with matching field names in Tasks 6 and 8; `checkToolErrorRateLimit` (Task 3) is imported with that exact name in Task 6; `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` (Task 2) is imported with that exact name in Task 14.


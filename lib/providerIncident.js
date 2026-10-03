// P30 (04/10): outages of the paid providers (ConvertAPI, OpenAI, Pangram) reach the owner's phone (ntfy) and inbox
// (Resend) within minutes, ONCE per incident and per provider, then once when the provider works again.
//
// - An outage is opened at once on a refusal that will not go away by itself: no credit / quota (HTTP 402, 403,
//   ConvertAPI `quota_exceeded`, OpenAI `insufficient_quota`) or a rejected key (401).
// - Transient failures (5xx, 429 rate limit, timeout, network) open it only when they repeat: REPEAT_THRESHOLD of them
//   for the same provider inside one REPEAT_WINDOW_MINUTES bucket, across all visitors and instances.
// - A failure caused by the visitor's file (corrupted, unsupported) is never an outage.
// - The first success after an open incident closes it ("recovered").
// State lives in usage_counters through the existing alert_state helper (one row per provider, no schema change), the
// same mechanism the daily health check already uses. Content of the alerts: provider, code, HTTP status — never a
// file name, a body or a secret.
const PROVIDER_NAMES = { convertapi: 'ConvertAPI', openai: 'OpenAI', pangram: 'Pangram' };

// What a visitor gets while the provider is down, so the alert says what to expect without opening the site.
const PROVIDER_IMPACT = {
  convertapi: 'Word to PDF (.docx) falls back to our LibreOffice server and says so; PDF to Word, Excel and PowerPoint ask visitors to try again later.',
  openai: 'AI tools answer "temporarily unavailable".',
  pangram: 'AI Detector answers "temporarily unavailable".',
};

const REPEAT_THRESHOLD = 3;
const REPEAT_WINDOW_MINUTES = 10;
// A success re-reads the incident state at most this often per instance (one Supabase read), so a busy tool does not
// add a database read to every conversion. The recovery alert can therefore lag the first success by up to this.
const SUCCESS_RECHECK_MS = 60_000;

const OUTAGE_CODES = new Set(['quota_exceeded', 'invalid_token', 'insufficient_quota', 'billing_hard_limit_reached', 'account_deactivated']);
const TRANSIENT_CODES = new Set(['rate_limited', 'rate_limit_exceeded', 'timeout', 'upstream_error', 'unreachable', 'server_error']);
// The visitor's own file or request, or a refusal we made ourselves (P30: no real ConvertAPI call outside production).
const NEVER_CODES = new Set(['corrupted_file', 'unsupported_format', 'not_production', 'moderation_blocked']);

/** @returns {'outage'|'transient'|null} */
function classifyProviderFailure({ httpStatus, code } = {}) {
  if (code && NEVER_CODES.has(code)) return null;
  if (code && OUTAGE_CODES.has(code)) return 'outage';
  if (httpStatus === 401 || httpStatus === 402 || httpStatus === 403) return 'outage';
  if (code && TRANSIENT_CODES.has(code)) return 'transient';
  if (typeof httpStatus === 'number' && (httpStatus >= 500 || httpStatus === 429)) return 'transient';
  if (httpStatus === undefined || httpStatus === null) return code ? null : 'transient'; // no answer at all: network
  return null;
}

function windowKey(now) {
  const d = new Date(now);
  const m = Math.floor(d.getUTCMinutes() / REPEAT_WINDOW_MINUTES) * REPEAT_WINDOW_MINUTES;
  return `${d.toISOString().slice(0, 13)}:${String(m).padStart(2, '0')}`;
}

function defaultDeps() {
  // Loaded lazily: the Supabase client refuses to be created without its environment (unit tests inject their own).
  const { incrementCounter } = require('./quota/counters');
  const { checkStateTransition } = require('./quota/alertState');
  const { sendAlert } = require('./alert');
  // Only production reports: previews and local servers share the same Supabase, and their (expected) refusals must
  // neither open nor close the production incident.
  return { incrementCounter, checkStateTransition, sendAlert, now: () => Date.now(), enabled: process.env.VERCEL_ENV === 'production' };
}

function describe(provider, { httpStatus, code }) {
  const what = [code, httpStatus ? `HTTP ${httpStatus}` : null].filter(Boolean).join(', ') || 'no answer';
  return `down (${what}). ${PROVIDER_IMPACT[provider] || ''}`.trim();
}

const lastFineCheck = new Map(); // provider -> time of the last "no open incident" read, this instance only

/**
 * Called by a route after a provider failure. Never throws: alerting must not change the visitor's answer.
 * @returns {Promise<'opened'|'counted'|'ignored'|'already-open'>}
 */
async function reportProviderFailure(provider, failure = {}, deps = defaultDeps()) {
  try {
    if (deps.enabled === false) return 'ignored';
    const kind = classifyProviderFailure(failure);
    if (!kind) return 'ignored';
    if (kind === 'transient') {
      let count = REPEAT_THRESHOLD; // a counter failure must not hide a real outage: treated as repeated
      try {
        const { newValue } = await deps.incrementCounter(`provider_fail:${provider}`, windowKey(deps.now()), 1, 1_000_000);
        count = newValue;
      } catch (err) {
        console.error(`provider failure counter failed for "${provider}" (counting it as repeated):`, err.message);
      }
      if (count < REPEAT_THRESHOLD) return 'counted';
    }
    lastFineCheck.delete(provider);
    const transition = await deps.checkStateTransition(`provider:${provider}`, true);
    if (!transition.alert) return 'already-open';
    await deps.sendAlert(provider, describe(provider, failure));
    return 'opened';
  } catch (err) {
    console.error(`provider incident report failed for "${provider}" (non-fatal):`, err?.message || err);
    return 'ignored';
  }
}

/**
 * Called by a route after a provider success. Closes an open incident (one "recovered" alert). Never throws.
 * A database error here is NOT treated as a transition (unlike failures): a false "back to normal" is worse than a
 * recovery alert that arrives on the next success.
 * @returns {Promise<'recovered'|'fine'|'skipped'>}
 */
async function reportProviderSuccess(provider, deps = defaultDeps()) {
  try {
    if (deps.enabled === false) return 'skipped';
    const t = deps.now();
    if (t - (lastFineCheck.get(provider) || -Infinity) < SUCCESS_RECHECK_MS) return 'skipped';
    const transition = await deps.checkStateTransition(`provider:${provider}`, false, { failOpen: false });
    lastFineCheck.set(provider, t);
    if (!transition.alert) return 'fine';
    await deps.sendAlert(provider, 'recovered');
    return 'recovered';
  } catch (err) {
    console.error(`provider recovery check failed for "${provider}" (non-fatal):`, err?.message || err);
    return 'skipped';
  }
}

function _resetForTests() { lastFineCheck.clear(); }

module.exports = {
  classifyProviderFailure, reportProviderFailure, reportProviderSuccess, windowKey,
  PROVIDER_NAMES, REPEAT_THRESHOLD, REPEAT_WINDOW_MINUTES, SUCCESS_RECHECK_MS, _resetForTests,
};

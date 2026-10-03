// P30 (04/10): outages of the paid providers (ConvertAPI, OpenAI, Pangram) reach the owner's phone (ntfy) and inbox
// (Resend) within minutes, ONCE per incident and per provider, then once when the provider works again.
//
// - An outage is opened at once on a refusal that will not go away by itself: no credit / quota (HTTP 402, 403,
//   ConvertAPI `quota_exceeded`, OpenAI `insufficient_quota`) or a rejected key (401).
// - Transient failures (5xx, 429 rate limit, our own timeout, network) open it only when they repeat: REPEAT_THRESHOLD
//   of them for the same provider within the current and the previous REPEAT_WINDOW_MINUTES bucket (a sliding window
//   of 10 to 20 minutes), across all visitors and instances.
// - A failure caused by the visitor's file or request (corrupted, unsupported, any other 4xx) is never an outage: the
//   route keeps its hourly per-route alert for it, as before P30.
// - A success closes an open incident ("recovered") only once no failure of that provider has been counted in the
//   current and previous buckets: a partial outage (one endpoint failing, another working) does not flap between
//   "down" and "recovered".
// Opening and closing are atomic (a capped increment, a conditional update), so concurrent instances send one alert.
// State lives in usage_counters (rows `alert_state:provider:<name>` and `provider_fail:<name>`, no schema change).
// Content of the alerts: provider, code, HTTP status -- never a file name, a body or a secret.
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
const RATE_CODES = new Set(['rate_limited', 'rate_limit_exceeded']);
// The visitor's own file or request, or a refusal we made ourselves (P30: no real ConvertAPI call outside production).
const NEVER_CODES = new Set(['corrupted_file', 'unsupported_format', 'not_production', 'moderation_blocked']);

/** @returns {'outage'|'transient'|null} */
function classifyProviderFailure({ httpStatus, code } = {}) {
  if (code && NEVER_CODES.has(code)) return null;
  if (code && OUTAGE_CODES.has(code)) return 'outage';
  if (httpStatus === 401 || httpStatus === 402 || httpStatus === 403) return 'outage';
  if (code && RATE_CODES.has(code)) return 'transient';
  const noAnswer = httpStatus === undefined || httpStatus === null;
  // ConvertAPI's own "conversion timed out" (HTTP 500, code 5000) is about one big file; OUR timeout (no answer) is not.
  if (code === 'timeout') return noAnswer ? 'transient' : null;
  if (noAnswer) return 'transient'; // network failure, nothing came back
  if (httpStatus >= 500 || httpStatus === 429) return 'transient';
  return null; // any other 4xx: the request or the file
}

function windowKey(now) {
  const d = new Date(now);
  const m = Math.floor(d.getUTCMinutes() / REPEAT_WINDOW_MINUTES) * REPEAT_WINDOW_MINUTES;
  return `${d.toISOString().slice(0, 13)}:${String(m).padStart(2, '0')}`;
}
const WINDOW_MS = REPEAT_WINDOW_MINUTES * 60_000;

/** Vercel production, at run time (VERCEL_ENV alone could come from a pulled .env file on a local server). */
function isVercelProduction() {
  return process.env.VERCEL_ENV === 'production' && !!(process.env.VERCEL_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function defaultDeps() {
  // Loaded lazily: the Supabase client refuses to be created without its environment (unit tests inject their own).
  const { incrementCounter } = require('./quota/counters');
  const { supabaseAdmin } = require('./quota/supabaseAdmin');
  const { sendAlert } = require('./alert');
  const STATE = (p) => `alert_state:provider:${p}`;
  return {
    incrementCounter,
    async readCounter(bucketKey, periodKey) {
      const { data, error } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', bucketKey).eq('period_key', periodKey).maybeSingle();
      if (error) throw new Error(error.message);
      return Number(data?.value || 0);
    },
    // 0 -> 1 exactly once, whatever the number of concurrent callers (capped increment).
    async openIncident(provider) {
      return (await incrementCounter(STATE(provider), 'current', 1, 1)).allowed;
    },
    // 1 -> 0 exactly once (conditional update).
    async closeIncident(provider) {
      const { data, error } = await supabaseAdmin.from('usage_counters').update({ value: 0, updated_at: new Date().toISOString() })
        .eq('bucket_key', STATE(provider)).eq('period_key', 'current').eq('value', 1).select('bucket_key');
      if (error) throw new Error(error.message);
      return Array.isArray(data) && data.length === 1;
    },
    async incidentOpen(provider) {
      const { data, error } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', STATE(provider)).eq('period_key', 'current').maybeSingle();
      if (error) throw new Error(error.message);
      return Number(data?.value || 0) === 1;
    },
    sendAlert,
    now: () => Date.now(),
    // Only Vercel production reports: previews and local servers share the same Supabase, and their (expected)
    // refusals must neither open nor close the production incident.
    enabled: isVercelProduction(),
  };
}

function describe(provider, { httpStatus, code }) {
  const what = [code, httpStatus ? `HTTP ${httpStatus}` : null].filter(Boolean).join(', ') || 'no answer';
  return `down (${what}). ${PROVIDER_IMPACT[provider] || ''}`.trim();
}

const lastFineCheck = new Map(); // provider -> time of the last "no open incident" read, this instance only
const lastBlindAlert = new Map(); // provider -> last alert sent while the state store was unreachable, this instance
const BLIND_ALERT_EVERY_MS = 30 * 60_000;

async function failuresInWindow(provider, deps, { add }) {
  const t = deps.now();
  const prev = await deps.readCounter(`provider_fail:${provider}`, windowKey(t - WINDOW_MS));
  const cur = add
    ? (await deps.incrementCounter(`provider_fail:${provider}`, windowKey(t), 1, 1_000_000)).newValue
    : await deps.readCounter(`provider_fail:${provider}`, windowKey(t));
  return prev + cur;
}

/**
 * Called by a route after a provider failure. Never throws: alerting must not change the visitor's answer.
 * @returns {Promise<'opened'|'counted'|'ignored'|'already-open'>}
 */
async function reportProviderFailure(provider, failure = {}, deps) {
  try {
    deps = deps || defaultDeps();
    if (deps.enabled === false) return 'ignored';
    const kind = classifyProviderFailure(failure);
    if (!kind) return 'ignored';
    lastFineCheck.delete(provider);
    let count = REPEAT_THRESHOLD; // a counter failure must not hide a real outage: treated as repeated
    try {
      count = await failuresInWindow(provider, deps, { add: true });
    } catch (err) {
      console.error(`provider failure counter failed for "${provider}" (counting it as repeated):`, err.message);
    }
    if (kind === 'transient' && count < REPEAT_THRESHOLD) return 'counted';
    let opened;
    try {
      opened = await deps.openIncident(provider);
    } catch (err) {
      // State store unreachable: alert anyway (a missed outage is worse), at most once per half hour per instance.
      console.error(`provider incident state failed for "${provider}" (alerting anyway):`, err.message);
      const t = deps.now();
      opened = t - (lastBlindAlert.get(provider) ?? -Infinity) >= BLIND_ALERT_EVERY_MS;
      if (opened) lastBlindAlert.set(provider, t);
    }
    if (!opened) return 'already-open';
    await deps.sendAlert(provider, describe(provider, failure));
    return 'opened';
  } catch (err) {
    console.error(`provider incident report failed for "${provider}" (non-fatal):`, err?.message || err);
    return 'ignored';
  }
}

/**
 * Called by a route after a provider success. Closes an open incident (one "recovered" alert) once the provider has
 * been quiet for the sliding window. Never throws; a database error means "no alert this time" (a false "back to
 * normal" is worse than a later one).
 * @returns {Promise<'recovered'|'fine'|'holding'|'skipped'>}
 */
async function reportProviderSuccess(provider, deps) {
  try {
    deps = deps || defaultDeps();
    if (deps.enabled === false) return 'skipped';
    const t = deps.now();
    if (t - (lastFineCheck.get(provider) ?? -Infinity) < SUCCESS_RECHECK_MS) return 'skipped';
    if (!(await deps.incidentOpen(provider))) {
      lastFineCheck.set(provider, t);
      return 'fine';
    }
    if ((await failuresInWindow(provider, deps, { add: false })) > 0) return 'holding';
    const closed = await deps.closeIncident(provider);
    lastFineCheck.set(provider, t);
    if (!closed) return 'fine'; // another instance closed it
    await deps.sendAlert(provider, 'recovered');
    return 'recovered';
  } catch (err) {
    console.error(`provider recovery check failed for "${provider}" (non-fatal):`, err?.message || err);
    return 'skipped';
  }
}

function _resetForTests() { lastFineCheck.clear(); lastBlindAlert.clear(); }

module.exports = {
  classifyProviderFailure, reportProviderFailure, reportProviderSuccess, windowKey, isVercelProduction,
  PROVIDER_NAMES, REPEAT_THRESHOLD, REPEAT_WINDOW_MINUTES, SUCCESS_RECHECK_MS, _resetForTests,
};

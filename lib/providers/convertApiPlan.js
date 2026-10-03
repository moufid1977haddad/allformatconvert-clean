// P30 (04/10): warning BEFORE the ConvertAPI plan runs out.
//
// ConvertAPI reports the remaining conversions only to a "master token" (GET /user, docs read 04/10); the site holds an
// ordinary API token (CONVERTAPI_TOKEN), and no new variable may be added. So the site counts what it consumes itself:
// every billed conversion (2xx, `ConversionCost` credits) adds to a counter per plan period, and the owner is alerted
// at 50, 80 and 100 % of the plan (lib/quota/alerts.js, once per threshold and period). Exact for the site's own use,
// which since P30 is the only use: real calls are refused outside Vercel production (lib/providers/convertApi.js).
//
// The plan: the owner took ConvertAPI's smallest monthly subscription on 04/10 — "Developer", 1,000 conversions a month
// billed monthly (convertapi.com/prices, read 04/10). Past it ConvertAPI does not stop: "extra conversions are billed
// automatically", so 100 % means "every further conversion costs extra", not "the tools stop".
// If the plan changes, change these two values (they are not environment variables on purpose: no hidden default).
const CONVERTAPI_PLAN_CONVERSIONS = 1000;
// Day of the month the subscription renews (taken on 04/10). Counting from this day keeps our period aligned with
// ConvertAPI's; if the real renewal is a day earlier, the counter only runs ahead (alerts early, never late).
const CONVERTAPI_PLAN_RENEWAL_DAY = 4;

function pad(n) { return String(n).padStart(2, '0'); }

/** Period key "plan-YYYY-MM" of the plan month that contains `now` (UTC), starting on the renewal day. */
function planPeriodKey(now = new Date()) {
  let y = now.getUTCFullYear();
  let m = now.getUTCMonth() + 1;
  if (now.getUTCDate() < CONVERTAPI_PLAN_RENEWAL_DAY) {
    m -= 1;
    if (m === 0) { m = 12; y -= 1; }
  }
  return `plan-${y}-${pad(m)}`;
}

function defaultDeps() {
  const { incrementCounter } = require('../quota/counters');
  const { checkAndAlertThresholds } = require('../quota/alerts');
  return { incrementCounter, checkAndAlertThresholds, now: () => new Date() };
}

/** Never throws: counting must not break a conversion that already succeeded (and was billed). */
async function recordConvertApiConversions(credits, deps = defaultDeps()) {
  try {
    const n = Number.isFinite(credits) && credits > 0 ? Math.ceil(credits) : 1;
    const periodKey = planPeriodKey(deps.now());
    const { newValue } = await deps.incrementCounter('convertapi_conversions', periodKey, n, 1_000_000_000);
    await deps.checkAndAlertThresholds({ counterName: 'convertapi_plan', periodKey, value: newValue, cap: CONVERTAPI_PLAN_CONVERSIONS });
    return newValue;
  } catch (err) {
    console.error('ConvertAPI plan counter failed (non-fatal):', err?.message || err);
    return null;
  }
}

module.exports = { recordConvertApiConversions, planPeriodKey, CONVERTAPI_PLAN_CONVERSIONS, CONVERTAPI_PLAN_RENEWAL_DAY };

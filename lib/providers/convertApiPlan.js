// P30 (04/10): warning BEFORE the ConvertAPI plan runs out.
//
// ConvertAPI reports the remaining conversions only to a "master token" (GET /user, docs read 04/10); the site holds an
// ordinary API token (CONVERTAPI_TOKEN), and no new variable may be added. So the site counts what it consumes itself:
// every conversion ConvertAPI counts adds to a counter per plan period, and the owner is alerted at 50, 80 and 100 % of
// the plan (lib/quota/alerts.js, once per threshold and period). Exact for the site's own use, which since P30 is the
// only use: real calls are refused outside Vercel production (lib/providers/convertApi.js).
//
// What ConvertAPI counts (its Terms of Service, convertapi.com/terms, read 03/10 by P31): "Each conversion request
// processed by the Services counts as one or more conversions. A conversion request is counted whether or not the
// conversion succeeds." and "For a successful conversion, the number counted is returned with the result as its
// ConversionCost value". So a 2xx adds its ConversionCost, and a request ConvertAPI processed and failed (HTTP 500,
// 400, 415...) adds 1 -- lib/providers/convertApi.js decides which (countedFailure). Matches the owner's dashboard
// (03/10): 109 conversions from 25/08 to 03/10 = 100 succeeded + 9 failed, and Vercel saw exactly 9 HTTP 500 answers
// from ConvertAPI in that time; the 2 HTTP 403 ("no conversions remaining") were not counted.
//
// The plan (owner, ConvertAPI dashboard, 03/10): "Developer", 1,000 conversions a month billed monthly, 57.49 CAD
// taxes included, 200 MB files, 1 simultaneous conversion. Past 1,000 ConvertAPI does not stop: "extra conversions are
// billed automatically" (convertapi.com/pricing), so 100 % means "every further conversion costs extra".
// If the plan changes, change these values (they are not environment variables on purpose: no hidden default).
const CONVERTAPI_PLAN_CONVERSIONS = 1000;
// Day of the month the subscription renews: the dashboard shows the period "2026-10-03 -> 2026-11-03" (P31, 03/10;
// P30 had written the 4th). Our period starts at 00:00 UTC that day: conversions made between that time and the real
// renewal hour are counted in the new period (a few hours at most).
const CONVERTAPI_PLAN_RENEWAL_DAY = 3;
// Conversions ConvertAPI had already counted in a period before the site's counter covered it, read on the owner's
// dashboard. Applied to that period only (added to the site's own count before the thresholds are checked); a period
// absent from this table starts at 0, as every later period will.
//  - plan-2026-10 (03/10 -> 03/11): 6 conversions used at the reading of 2026-10-03, 23:08 UTC (P30's checks on www and
//    the owner's iPhone Merge PDF test with fidelite-01.docx). Until this code is deployed, the deployed code (renewal
//    on the 4th) counts 03/10 conversions in plan-2026-09 and those from 04/10 00:00 UTC in plan-2026-10, so the site's
//    plan-2026-10 count holds no conversion made before the reading: no double count. The ones made between 23:08 and
//    00:00 UTC on 03/10 (if any) are missed: at most a few, and the error is on the low side by that much.
const CONVERTAPI_PLAN_BASELINE = Object.freeze({ 'plan-2026-10': 6 });

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

/** Conversions already used in that period before the site counted them (0 for every period not in the table). */
function planBaseline(periodKey) {
  return Object.prototype.hasOwnProperty.call(CONVERTAPI_PLAN_BASELINE, periodKey) ? CONVERTAPI_PLAN_BASELINE[periodKey] : 0;
}

/**
 * Adds `credits` conversions (a 2xx's ConversionCost, or 1 for a counted failure) to the current plan period and checks
 * the 50/80/100 % thresholds on the period's total (baseline included). Returns that total, or null if counting failed.
 * Never throws: counting must not break a conversion that already succeeded (and was billed).
 */
async function recordConvertApiConversions(credits, deps) {
  try {
    deps = deps || defaultDeps();
    const n = Number.isFinite(credits) && credits > 0 ? Math.ceil(credits) : 1;
    const periodKey = planPeriodKey(deps.now());
    const { newValue } = await deps.incrementCounter('convertapi_conversions', periodKey, n, 1_000_000_000);
    const used = newValue + planBaseline(periodKey);
    await deps.checkAndAlertThresholds({ counterName: 'convertapi_plan', periodKey, value: used, cap: CONVERTAPI_PLAN_CONVERSIONS });
    return used;
  } catch (err) {
    console.error('ConvertAPI plan counter failed (non-fatal):', err?.message || err);
    return null;
  }
}

module.exports = { recordConvertApiConversions, planPeriodKey, planBaseline, CONVERTAPI_PLAN_CONVERSIONS, CONVERTAPI_PLAN_RENEWAL_DAY, CONVERTAPI_PLAN_BASELINE };

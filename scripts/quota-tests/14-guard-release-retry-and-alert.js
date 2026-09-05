// scripts/quota-tests/14-guard-release-retry-and-alert.js
//
// Proves the fix for the release()-side counterpart of 13's commit()
// hardening: guard.release() used to call releaseGlobalSpend()/
// logUsageEvent() exactly once with no error handling. If that failed (a
// transient Supabase outage), the reservation stayed stuck in
// global_spend_microusd with no retry and no distinguishing alert.
//
// Same policy as commit(), same shape: retry the same attempt once; if the
// retry also fails, fire an explicit 'quota-release-failed' alert carrying
// route/tool/period/reservedMicros/error.
//
// Key difference from 13's commit()-failure scenario, and the reason this
// needs its own test rather than reusing 13's assertions: a release() that
// fails twice leaves a reservation that corresponds to NO real spend at all
// (the provider call failed or never happened) -- unlike commit()'s
// double-failure case, where the reservation likely *does* correspond to a
// real, already-incurred cost. This test asserts the alert detail string
// says so explicitly, not just that an alert fired.
//
// Uses the same require-order-before-first-use trick as 13 to patch
// lib/quota/counters.js's decrementCounter export -- see 13's header
// comment for why patching after globalSpend.js/guard.js are first
// required would silently no-op (this project's own documented history).
//
// NOTE: this script makes real Supabase calls (via lib/quota/supabaseAdmin.js,
// which reads SUPABASE_SERVICE_ROLE_KEY from process.env) and is meant to be
// run by hand in local dev with that env var already set in the shell -- same
// as every other script in this directory. It is not executed as part of
// writing this fix -- SUPABASE_SERVICE_ROLE_KEY never enters the
// implementer's or controller's working environment (permanent rule, see
// docs/plans/2026-08-28-quota-spend-limits-plan.md's Global Constraints).

// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const assert = require('node:assert');

// Patch BEFORE any module that requires './counters' is itself required --
// see 13-guard-commit-retry-and-alert.js's header comment for why order
// matters here.
const countersModule = require('../../lib/quota/counters');
const realDecrementCounter = countersModule.decrementCounter;
let decrementCounterCallCount = 0;
let forceFailuresRemaining = 0;
countersModule.decrementCounter = async (...args) => {
  decrementCounterCallCount++;
  if (forceFailuresRemaining > 0) {
    forceFailuresRemaining--;
    throw new Error('simulated Supabase outage (decrement_usage_counter RPC)');
  }
  return realDecrementCounter(...args);
};

const { guardPaidRoute } = require('../../lib/quota/guard');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { hashIp } = require('../../lib/quota/ipHash');
const { WORST_CASE_COST_MICROS } = require('../../lib/quota/config');

const ROUTE = 'ai'; // must be a real route key -- reserveGlobalSpend() looks up WORST_CASE_COST_MICROS[route]
const TOOL = 'test-release-retry'; // unique to this script -- scopes usage_events cleanup

function fakeReq(ip) {
  return { headers: { get: (name) => (name === 'x-forwarded-for' ? ip : null) } };
}

async function cleanupIpAndEvents(ip) {
  const hash = hashIp(ip);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:hour:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:day:${hash}`);
  await supabaseAdmin.from('usage_events').delete().eq('tool', TOOL);
}

async function readCounterValue(bucketKey, periodKey) {
  const { data } = await supabaseAdmin
    .from('usage_counters').select('value')
    .eq('bucket_key', bucketKey).eq('period_key', periodKey)
    .maybeSingle();
  return data ? Number(data.value) : 0;
}

// countersModule.adjustCounter was never patched (only decrementCounter
// was) -- this always runs the real RPC, unaffected by the simulated
// outage above.
async function restoreCounter(bucketKey, periodKey, before) {
  const current = await readCounterValue(bucketKey, periodKey);
  await countersModule.adjustCounter(bucketKey, periodKey, before - current);
}

async function main() {
  const ip = '198.51.100.15';
  const period = currentUtcMonthKey();
  await cleanupIpAndEvents(ip);
  const baseline = await readCounterValue('global_spend_microusd', period);

  try {
    const sent = [];
    const stubSendAlert = async (service, status) => { sent.push({ service, status }); };

    const guard = await guardPaidRoute(fakeReq(ip), { route: ROUTE, tool: TOOL });
    assert.strictEqual(guard.ok, true);

    decrementCounterCallCount = 0;
    forceFailuresRemaining = 2; // both the first attempt and the one retry must fail
    await guard.release(stubSendAlert);

    assert.strictEqual(decrementCounterCallCount, 2, 'release() must retry the failed decrement exactly once (2 total attempts), not zero and not more');

    const afterRelease = await readCounterValue('global_spend_microusd', period);
    assert.strictEqual(
      afterRelease - baseline,
      WORST_CASE_COST_MICROS.ai,
      'when the decrement fails twice, the reservation must stay stuck at the full worst-case amount -- release() never got to actually decrement it'
    );

    assert.strictEqual(sent.length, 1, 'a double decrement failure must alert exactly once');
    assert.strictEqual(sent[0].service, 'quota-release-failed');
    assert.ok(sent[0].status.includes(ROUTE), 'alert detail must identify the route');
    assert.ok(sent[0].status.includes(TOOL), 'alert detail must identify the tool');
    assert.ok(sent[0].status.includes(period), 'alert detail must identify the period, to find the stuck reservation');
    assert.ok(
      /never actually spent/i.test(sent[0].status),
      'alert detail must explicitly say this amount was never actually spent -- distinct from quota-commit-failed, where the money likely was spent'
    );

    console.log('PASS: a release() that fails twice retries once, stays stuck at the reserved amount, and alerts exactly once with an explicit "not real spend" message.');
  } finally {
    countersModule.decrementCounter = realDecrementCounter;
    await restoreCounter('global_spend_microusd', period, baseline);
    await cleanupIpAndEvents(ip);
  }
}

main().catch((err) => {
  countersModule.decrementCounter = realDecrementCounter;
  console.error('FAIL:', err.message);
  process.exit(1);
});

// scripts/quota-tests/13-guard-commit-retry-and-alert.js
//
// Proves the fix for the second reservation-integrity gap: guard.commit()
// used to call reconcileGlobalSpend()/logUsageEvent() exactly once with no
// error handling. If that DB call failed (a transient Supabase outage) AFTER
// the provider had already been successfully called -- i.e. money was
// already spent, or the call had already succeeded -- the exception just
// propagated up to the route's outer catch, which alerts a generic
// "unhandled error" but never distinguishes "we don't know if the real
// spend got recorded."
//
// Decision (stated by the user, applies to all 5 paid routes including
// convert-to-pdf): never release in this case -- the cost is real, so
// releasing would silently undercount it, which is the one outcome this
// whole quota system exists to prevent. Instead: retry the commit exactly
// once; if the retry also fails, keep the full worst-case reservation in
// place (already applied by reserveGlobalSpend, so "keep" just means "do
// nothing more to it") and fire an explicit 'quota-commit-failed' alert
// carrying enough to find the request (route, tool, period, reserved
// amount, underlying error).
//
// This script monkeypatches lib/quota/counters.js's adjustCounter export
// to fail twice before guard.js/globalSpend.js are ever required, so the
// CommonJS destructuring in globalSpend.js (`const { adjustCounter } =
// require('./counters')`) picks up the patched function -- patching after
// those modules are already required would silently no-op (destructuring
// copies the reference once, at require time; this is the exact pitfall
// noted in this project's own history, see
// docs/plans/2026-08-28-quota-spend-limits-plan.md's Task 0-8 progress
// note about a monkeypatch that "silently no-oped").
//
// NOTE: this script makes real Supabase calls (via lib/quota/supabaseAdmin.js,
// which reads SUPABASE_SERVICE_ROLE_KEY from process.env) and is meant to be
// run by hand in local dev with that env var already set in the shell -- same
// as every other script in this directory. It is not executed as part of
// writing this fix -- SUPABASE_SERVICE_ROLE_KEY never enters the
// implementer's or controller's working environment (permanent rule, see
// the same plan doc's Global Constraints).

// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const assert = require('node:assert');

// Patch BEFORE any module that requires './counters' is itself required --
// see the header comment above for why order matters here.
const countersModule = require('../../lib/quota/counters');
const realAdjustCounter = countersModule.adjustCounter;
let adjustCounterCallCount = 0;
let forceFailuresRemaining = 0;
countersModule.adjustCounter = async (...args) => {
  adjustCounterCallCount++;
  if (forceFailuresRemaining > 0) {
    forceFailuresRemaining--;
    throw new Error('simulated Supabase outage (adjust_usage_counter RPC)');
  }
  return realAdjustCounter(...args);
};

const { guardPaidRoute } = require('../../lib/quota/guard');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { hashIp } = require('../../lib/quota/ipHash');
const { WORST_CASE_COST_MICROS } = require('../../lib/quota/config');

const ROUTE = 'ai'; // must be a real route key -- reserveGlobalSpend() looks up WORST_CASE_COST_MICROS[route]
const TOOL = 'test-commit-retry'; // unique to this script -- scopes usage_events cleanup

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

// Uses the REAL adjustCounter (not the patched one) -- restoration must
// never be at the mercy of the simulated outage.
async function restoreCounter(bucketKey, periodKey, before) {
  const current = await readCounterValue(bucketKey, periodKey);
  await realAdjustCounter(bucketKey, periodKey, before - current);
}

async function main() {
  const ip = '198.51.100.14';
  const period = currentUtcMonthKey();
  await cleanupIpAndEvents(ip);
  const baseline = await readCounterValue('global_spend_microusd', period);

  try {
    const sent = [];
    const stubSendAlert = async (service, status) => { sent.push({ service, status }); };

    const guard = await guardPaidRoute(fakeReq(ip), { route: ROUTE, tool: TOOL });
    assert.strictEqual(guard.ok, true);

    adjustCounterCallCount = 0;
    forceFailuresRemaining = 2; // both the first attempt and the one retry must fail
    await guard.commit(1, stubSendAlert); // a real, known cost -- but reconciliation itself will fail twice

    assert.strictEqual(adjustCounterCallCount, 2, 'commit() must retry the failed reconciliation exactly once (2 total attempts), not zero and not more');

    const afterCommit = await readCounterValue('global_spend_microusd', period);
    assert.strictEqual(
      afterCommit - baseline,
      WORST_CASE_COST_MICROS.ai,
      'when reconciliation fails twice, the full worst-case reservation must stay in place -- never released, never reconciled down'
    );

    assert.strictEqual(sent.length, 1, 'a double reconciliation failure must alert exactly once');
    assert.strictEqual(sent[0].service, 'quota-commit-failed');
    assert.ok(sent[0].status.includes(ROUTE), 'alert detail must identify the route');
    assert.ok(sent[0].status.includes(TOOL), 'alert detail must identify the tool');
    assert.ok(sent[0].status.includes(period), 'alert detail must identify the period, to find the stuck reservation');

    console.log('PASS: a commit() that fails twice keeps the full worst-case reservation and alerts exactly once (no under-count, no silent loss).');
  } finally {
    countersModule.adjustCounter = realAdjustCounter;
    await restoreCounter('global_spend_microusd', period, baseline);
    await cleanupIpAndEvents(ip);
  }
}

main().catch((err) => {
  countersModule.adjustCounter = realAdjustCounter;
  console.error('FAIL:', err.message);
  process.exit(1);
});

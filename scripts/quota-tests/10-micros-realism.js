// scripts/quota-tests/10-micros-realism.js
//
// Proves the actual motivating scenario for the cents->micros migration,
// using the EXACT real numbers from the user's own diagnostic: a live
// /api/ai (text-summarizer) call returned OpenAI usage
// {prompt_tokens: 291, completion_tokens: 76}.
//
// Real cost: 291 * 0.00000015 + 76 * 0.0000006
//          = 0.00004365 + 0.0000456
//          = 0.00008925 dollars ($0.00008925)
//
// Old (cents) unit:   Math.ceil(0.00008925 * 100)       = Math.ceil(0.008925) = 1 cent
//                      1 cent of real spend recorded as 1 FULL cent -- a 112x (>10,000%) overcount.
// New (micros) unit:  Math.ceil(0.00008925 * 1_000_000) = Math.ceil(89.25)    = 90 micros
//                      a 0.84% overcount instead of 11,200%.
//
// NOTE: this script makes real Supabase calls (via lib/quota/supabaseAdmin.js,
// which reads SUPABASE_SERVICE_ROLE_KEY from process.env) and is meant to be
// run by hand in local dev with that env var already set in the shell -- same
// as every other script in this directory. It is not executed as part of
// writing this fix.

// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const assert = require('node:assert');
const { reserveGlobalSpend, reconcileGlobalSpend } = require('../../lib/quota/globalSpend');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { adjustCounter } = require('../../lib/quota/counters');
const { actualAiCostMicros } = require('../../lib/quota/config');

const ROUTE = 'ai';
const REALISTIC_USAGE = { prompt_tokens: 291, completion_tokens: 76 };
const TRUE_DOLLARS = 291 * 0.00000015 + 76 * 0.0000006;
const TRUE_MICROS = TRUE_DOLLARS * 1_000_000; // 89.25, un-rounded
const N = 100; // large enough to demonstrate cumulative-accuracy without being absurd

// global_spend_microusd is the ONE real, shared production bucket for the
// current UTC month -- never DELETE it. Read the pre-test value, assert on
// the DELTA the test's own operations produce, then restore the bucket to
// exactly its pre-test value in a `finally` block (re-reading the current
// value at restore time, not relying on a value computed earlier, so the
// restore is correct even if an assertion above threw mid-test).
async function readCounterValue(bucketKey, periodKey) {
  const { data } = await supabaseAdmin
    .from('usage_counters').select('value')
    .eq('bucket_key', bucketKey).eq('period_key', periodKey)
    .maybeSingle();
  return data ? Number(data.value) : 0;
}

async function restoreCounter(bucketKey, periodKey, before) {
  const current = await readCounterValue(bucketKey, periodKey);
  await adjustCounter(bucketKey, periodKey, before - current);
}

function unitTest() {
  const perCallMicros = actualAiCostMicros(REALISTIC_USAGE);
  assert.strictEqual(perCallMicros, 90, 'Math.ceil(89.25) must round up to exactly 90 micros');

  const newDistortionPct = ((perCallMicros - TRUE_MICROS) / TRUE_MICROS) * 100;
  assert.ok(newDistortionPct >= 0 && newDistortionPct < 5,
    `micro-dollar rounding distortion should be under 5% of true cost, got ${newDistortionPct.toFixed(4)}%`);

  // What the OLD cents unit would have produced for this exact real call,
  // expressed in the same micro-dollar terms for comparison.
  const oldCents = Math.ceil(TRUE_DOLLARS * 100); // Math.ceil(0.008925) = 1
  const oldMicrosEquivalent = oldCents * 10_000; // 1 cent = 10,000 micros
  const oldDistortionPct = ((oldMicrosEquivalent - TRUE_MICROS) / TRUE_MICROS) * 100;
  assert.ok(oldDistortionPct > 10_000,
    `the old cents-based equivalent should be off by over 10,000%, got ${oldDistortionPct.toFixed(2)}%`);

  return perCallMicros;
}

async function main() {
  const perCallMicros = unitTest();

  const period = currentUtcMonthKey();
  const before = await readCounterValue('global_spend_microusd', period);

  try {
    for (let i = 0; i < N; i++) {
      const reservation = await reserveGlobalSpend(ROUTE);
      assert.strictEqual(reservation.allowed, true, `reservation ${i + 1}/${N} should be allowed`);
      await reconcileGlobalSpend(reservation.periodKey, reservation.reservedMicros, perCallMicros);
    }

    const after = await readCounterValue('global_spend_microusd', period);
    assert.strictEqual(after - before, N * perCallMicros, `${N} realistic calls should accumulate exactly ${N} * ${perCallMicros} micros, no per-call drift/loss`);
  } finally {
    await restoreCounter('global_spend_microusd', period, before);
  }

  console.log('PASS: micro-dollar unit avoids the ~100x cent-rounding distortion; N realistic calls accumulate exactly N * per-call cost.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

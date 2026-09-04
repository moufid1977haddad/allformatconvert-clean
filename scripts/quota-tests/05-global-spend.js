// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const assert = require('node:assert');
const { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend } = require('../../lib/quota/globalSpend');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { adjustCounter } = require('../../lib/quota/counters');

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

async function main() {
  const period = currentUtcMonthKey();
  const beforeSpend = await readCounterValue('global_spend_microusd', period);

  try {
    const r1 = await reserveGlobalSpend('ai');
    assert.strictEqual(r1.allowed, true);

    await reconcileGlobalSpend(r1.periodKey, r1.reservedMicros, 1); // actual cost (1 micro-dollar) much lower than the worst-case reservation
    const afterReconcile = await readCounterValue('global_spend_microusd', period);
    assert.strictEqual(afterReconcile - beforeSpend, 1, 'reconciliation should replace the worst-case reservation with the real cost');

    const r2 = await reserveGlobalSpend('remove-bg');
    assert.strictEqual(r2.allowed, true);
    await releaseGlobalSpend(r2.periodKey, r2.reservedMicros);
    const afterRelease = await readCounterValue('global_spend_microusd', period);
    assert.strictEqual(afterRelease - beforeSpend, 1, 'a released reservation must leave the counter exactly where it was before the reservation');

    console.log('PASS: global spend reserve/reconcile/release.');
  } finally {
    // alert_sent:global_spend:% is NOT touched here -- it is the real
    // production idempotency flag checkAndAlertThresholds sets when the real
    // spend counter genuinely crosses 50/80/100% of its cap that month (spec
    // §4.5, "exactly once per threshold per period"). This test's own
    // reservations are tiny relative to the cap (a single 'ai' worst-case
    // reservation), nowhere near crossing a real threshold on their own, so
    // there is never a flag this test legitimately owns to clean up --
    // deleting one here would risk erasing a REAL crossing and causing a
    // duplicate real alert the next time that threshold is crossed. Same
    // principle as the counter-restore fix above: never touch real
    // production state a test doesn't own.
    await restoreCounter('global_spend_microusd', period, beforeSpend);
  }
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

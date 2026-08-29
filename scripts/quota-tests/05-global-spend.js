// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const assert = require('node:assert');
const { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend } = require('../../lib/quota/globalSpend');
const { reserveAdobeTransaction, releaseAdobeTransaction } = require('../../lib/quota/adobeCounter');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { adjustCounter } = require('../../lib/quota/counters');

// global_spend_microusd and adobe_tx are the ONE real, shared production
// buckets for the current UTC month -- never DELETE either of them. Read
// the pre-test value, assert on the DELTA the test's own operations
// produce, then restore the bucket to exactly its pre-test value in a
// `finally` block (re-reading the current value at restore time, not
// relying on a value computed earlier, so the restore is correct even if
// an assertion above threw mid-test).
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
  const beforeAdobe = await readCounterValue('adobe_tx', period);

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

    const a1 = await reserveAdobeTransaction();
    assert.strictEqual(a1.allowed, true);
    await releaseAdobeTransaction(a1.periodKey);
    const adobeAfter = await readCounterValue('adobe_tx', period);
    assert.strictEqual(adobeAfter - beforeAdobe, 0);

    console.log('PASS: global spend reserve/reconcile/release and Adobe counter.');
  } finally {
    await restoreCounter('global_spend_microusd', period, beforeSpend);
    await restoreCounter('adobe_tx', period, beforeAdobe);
    await supabaseAdmin.from('usage_counters').delete().like('bucket_key', 'alert_sent:global_spend:%').eq('period_key', period);
    await supabaseAdmin.from('usage_counters').delete().like('bucket_key', 'alert_sent:adobe_tx:%').eq('period_key', period);
  }
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

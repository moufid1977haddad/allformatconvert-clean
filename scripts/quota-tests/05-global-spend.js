const assert = require('node:assert');
const { reserveGlobalSpend, releaseGlobalSpend, reconcileGlobalSpend } = require('../../lib/quota/globalSpend');
const { reserveAdobeTransaction, releaseAdobeTransaction } = require('../../lib/quota/adobeCounter');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');

async function main() {
  const period = currentUtcMonthKey();
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'global_spend_cents').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'adobe_tx').eq('period_key', period);

  const r1 = await reserveGlobalSpend('ai');
  assert.strictEqual(r1.allowed, true);

  await reconcileGlobalSpend(r1.periodKey, r1.reservedCents, 1); // actual cost much lower than worst-case reservation
  const { data: afterReconcile } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'global_spend_cents').eq('period_key', period).single();
  assert.strictEqual(Number(afterReconcile.value), 1, 'reconciliation should replace the worst-case reservation with the real cost');

  const r2 = await reserveGlobalSpend('remove-bg');
  assert.strictEqual(r2.allowed, true);
  await releaseGlobalSpend(r2.periodKey, r2.reservedCents);
  const { data: afterRelease } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'global_spend_cents').eq('period_key', period).single();
  assert.strictEqual(Number(afterRelease.value), 1, 'a released reservation must leave the counter exactly where it was before the reservation');

  const a1 = await reserveAdobeTransaction();
  assert.strictEqual(a1.allowed, true);
  await releaseAdobeTransaction(a1.periodKey);
  const { data: adobeAfter } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'adobe_tx').eq('period_key', period).single();
  assert.strictEqual(Number(adobeAfter.value), 0);

  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'global_spend_cents').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'adobe_tx').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().like('bucket_key', 'alert_sent:global_spend:%').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().like('bucket_key', 'alert_sent:adobe_tx:%').eq('period_key', period);

  console.log('PASS: global spend reserve/reconcile/release and Adobe counter.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

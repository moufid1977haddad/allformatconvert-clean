// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const assert = require('node:assert');
const { incrementCounter, decrementCounter, adjustCounter } = require('../../lib/quota/counters');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');

async function main() {
  const bucket = 'test:counters-' + Date.now();
  const period = '2000-01';

  const first = await incrementCounter(bucket, period, 4, 10);
  assert.strictEqual(first.newValue, 4);
  assert.strictEqual(first.allowed, true);

  const second = await incrementCounter(bucket, period, 4, 10);
  assert.strictEqual(second.newValue, 8);
  assert.strictEqual(second.allowed, true);

  const blocked = await incrementCounter(bucket, period, 4, 10);
  assert.strictEqual(blocked.allowed, false);
  assert.strictEqual(blocked.newValue, 8, 'a blocked increment must not change the stored value');

  await decrementCounter(bucket, period, 3);
  const afterDecrement = await incrementCounter(bucket, period, 0, 10);
  assert.strictEqual(afterDecrement.newValue, 5);

  const reconciled = await adjustCounter(bucket, period, -5);
  assert.strictEqual(reconciled, 0);

  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', bucket);
  console.log('PASS: counters.js wraps the RPC functions correctly.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

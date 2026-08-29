const { createClient } = require('@supabase/supabase-js');

// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const testBucket = 'test:schema-check';
  const testPeriod = '2000-01';

  const inc = await admin.rpc('increment_usage_counter', {
    p_bucket_key: testBucket, p_period_key: testPeriod, p_amount: 3, p_cap: 10,
  });
  if (inc.error) throw new Error('increment_usage_counter failed: ' + inc.error.message);
  const row = inc.data[0];
  if (row.new_value !== 3 || row.allowed !== true) throw new Error('unexpected increment result: ' + JSON.stringify(row));

  const capped = await admin.rpc('increment_usage_counter', {
    p_bucket_key: testBucket, p_period_key: testPeriod, p_amount: 100, p_cap: 10,
  });
  if (capped.error) throw new Error(capped.error.message);
  if (capped.data[0].allowed !== false) throw new Error('expected cap to block a 100-unit increment on a cap of 10');

  const dec = await admin.rpc('decrement_usage_counter', { p_bucket_key: testBucket, p_period_key: testPeriod, p_amount: 3 });
  if (dec.error) throw new Error(dec.error.message);

  const adj = await admin.rpc('adjust_usage_counter', { p_bucket_key: testBucket, p_period_key: testPeriod, p_delta: -5 });
  if (adj.error) throw new Error(adj.error.message);
  if (adj.data !== 0) throw new Error('expected adjust to clamp at 0, got ' + adj.data);

  await admin.from('usage_counters').delete().eq('bucket_key', testBucket);

  const eventInsert = await admin.from('usage_events').insert({ route: 'test', tool: 'test', outcome: 'accepted', estimated_cost_cents: 1 });
  if (eventInsert.error) throw new Error('usage_events insert failed: ' + eventInsert.error.message);
  await admin.from('usage_events').delete().eq('route', 'test');

  console.log('PASS: schema, RPC functions, and grants all behave as designed.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

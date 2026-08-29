const { supabaseAdmin } = require('./supabaseAdmin');

async function incrementCounter(bucketKey, periodKey, amount, cap) {
  const { data, error } = await supabaseAdmin.rpc('increment_usage_counter', {
    p_bucket_key: bucketKey, p_period_key: periodKey, p_amount: amount, p_cap: cap,
  });
  if (error) throw new Error(`increment_usage_counter failed: ${error.message}`);
  const row = data && data[0];
  return { newValue: Number((row && row.new_value) || 0), allowed: !!(row && row.allowed === true) };
}

async function decrementCounter(bucketKey, periodKey, amount) {
  const { error } = await supabaseAdmin.rpc('decrement_usage_counter', {
    p_bucket_key: bucketKey, p_period_key: periodKey, p_amount: amount,
  });
  if (error) throw new Error(`decrement_usage_counter failed: ${error.message}`);
}

async function adjustCounter(bucketKey, periodKey, delta) {
  const { data, error } = await supabaseAdmin.rpc('adjust_usage_counter', {
    p_bucket_key: bucketKey, p_period_key: periodKey, p_delta: delta,
  });
  if (error) throw new Error(`adjust_usage_counter failed: ${error.message}`);
  return Number(data || 0);
}

module.exports = { incrementCounter, decrementCounter, adjustCounter };

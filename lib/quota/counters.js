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

// Several counters, all incremented or none (one RPC = one transaction, see
// increment_usage_counters_all_or_none in supabase/usage_counters.sql).
// items: [{ bucketKey, periodKey, amount, cap }]. Returns
// { allowed, results: [{ newValue, overCap }] } with results in items order.
// There is deliberately no compensating decrement anywhere: a denied call
// changed nothing, so a network error can never leave one counter inflated.
async function incrementCountersAllOrNone(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('incrementCountersAllOrNone: items must be a non-empty array');
  const { data, error } = await supabaseAdmin.rpc('increment_usage_counters_all_or_none', {
    p_buckets: items.map((i) => i.bucketKey),
    p_periods: items.map((i) => i.periodKey),
    p_amounts: items.map((i) => i.amount),
    p_caps: items.map((i) => i.cap),
  });
  if (error) throw new Error(`increment_usage_counters_all_or_none failed: ${error.message}`);
  if (!Array.isArray(data) || data.length !== items.length) {
    throw new Error(`increment_usage_counters_all_or_none returned ${Array.isArray(data) ? data.length : 'no'} rows for ${items.length} counters`);
  }
  const rows = [...data].sort((a, b) => Number(a.idx) - Number(b.idx));
  return {
    allowed: rows.every((r) => r.allowed === true),
    results: rows.map((r) => ({ newValue: Number(r.new_value || 0), overCap: r.over_cap === true })),
  };
}

module.exports = { incrementCounter, decrementCounter, adjustCounter, incrementCountersAllOrNone };

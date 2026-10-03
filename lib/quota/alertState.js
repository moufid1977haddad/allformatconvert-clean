const { supabaseAdmin } = require('./supabaseAdmin');

// Reuses the existing usage_counters table (bucket_key/period_key/value) as
// a persistent boolean flag per incident key, with a fixed period_key so
// the row never rotates out on its own -- this is state, not a per-period
// counter. value 1 = "currently a problem", 0/absent = "currently fine".
//
// Direct table reads/writes (not the increment_usage_counter RPC), since
// this is a set, not an add -- same pattern health-check's own housekeeping
// already uses on this table.
const PERIOD_KEY = 'current';

// Returns { alert: true, recovered: bool } exactly on a state transition
// (fine->problem or problem->fine); { alert: false } otherwise. Fails open:
// a DB error is logged and treated as a transition, since a missed alert is
// worse than an occasional duplicate.
async function checkStateTransition(key, isProblem) {
  const bucketKey = `alert_state:${key}`;
  try {
    const { data, error } = await supabaseAdmin
      .from('usage_counters')
      .select('value')
      .eq('bucket_key', bucketKey)
      .eq('period_key', PERIOD_KEY)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const wasProblem = (data?.value || 0) === 1;
    if (isProblem === wasProblem) return { alert: false };

    const { error: upsertErr } = await supabaseAdmin
      .from('usage_counters')
      .upsert(
        { bucket_key: bucketKey, period_key: PERIOD_KEY, value: isProblem ? 1 : 0, updated_at: new Date().toISOString() },
        { onConflict: 'bucket_key,period_key' }
      );
    if (upsertErr) throw new Error(upsertErr.message);

    return { alert: true, recovered: !isProblem };
  } catch (err) {
    console.error(`alert state check failed for "${key}" (failing open, alerting anyway):`, err.message);
    return { alert: true, recovered: !isProblem };
  }
}

module.exports = { checkStateTransition };

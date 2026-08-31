// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const assert = require('node:assert');
const { checkStateTransition } = require('../../lib/quota/alertState');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');

async function main() {
  const key = 'test-health-' + Date.now();

  try {
    // First observation of a problem -- transition, alert.
    let t = await checkStateTransition(key, true);
    assert.strictEqual(t.alert, true);
    assert.strictEqual(t.recovered, false);

    // Still a problem on the next check -- no transition, silence.
    t = await checkStateTransition(key, true);
    assert.strictEqual(t.alert, false, 'a persisting problem must not re-alert');

    t = await checkStateTransition(key, true);
    assert.strictEqual(t.alert, false, 'a persisting problem must not re-alert (3rd check)');

    // Back to normal -- transition, alert, recovered.
    t = await checkStateTransition(key, false);
    assert.strictEqual(t.alert, true);
    assert.strictEqual(t.recovered, true);

    // Still fine -- no transition, silence.
    t = await checkStateTransition(key, false);
    assert.strictEqual(t.alert, false, 'a persisting normal state must not re-alert');

    console.log('PASS: alert state transitions fire exactly once on change, silent while unchanged.');
  } finally {
    await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `alert_state:${key}`);
  }
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

// Guard: require both env vars before proceeding
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your shell before running this script.');
  process.exit(1);
}

const assert = require('node:assert');
const { guardPaidRoute } = require('../../lib/quota/guard');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { hashIp } = require('../../lib/quota/ipHash');
const { adjustCounter } = require('../../lib/quota/counters');

function fakeReq(ip) {
  return { headers: { get: (name) => (name === 'x-forwarded-for' ? ip : null) } };
}

// ip_rate:* and usage_events rows here are scoped to a fake test IP/tool
// that never collides with real traffic -- safe to DELETE. The
// global_spend_microusd bucket is the ONE real, shared production bucket
// for the current UTC month and must never be deleted -- see
// readCounterValue/restoreCounter below.
async function cleanupIpAndEvents(ip) {
  const hash = hashIp(ip);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:hour:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:day:${hash}`);
  await supabaseAdmin.from('usage_events').delete().eq('tool', 'test-guard-route');
}

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
  const ip = '198.51.100.7';
  await cleanupIpAndEvents(ip);
  const period = currentUtcMonthKey();
  const before = await readCounterValue('global_spend_microusd', period);

  try {
    const guard1 = await guardPaidRoute(fakeReq(ip), { route: 'ai', tool: 'test-guard-route' });
    assert.strictEqual(guard1.ok, true);
    await guard1.commit(1); // reconcile down to 1 micro-dollar actual

    const afterCommit = await readCounterValue('global_spend_microusd', period);
    assert.strictEqual(afterCommit - before, 1);

    const guard2 = await guardPaidRoute(fakeReq(ip), { route: 'ai', tool: 'test-guard-route' });
    assert.strictEqual(guard2.ok, true);
    await guard2.release(); // simulate provider failure
    const afterRelease = await readCounterValue('global_spend_microusd', period);
    assert.strictEqual(afterRelease - before, 1, 'a released reservation must not leave residual spend -- verification #4');

    const { data: events } = await supabaseAdmin.from('usage_events').select('outcome').eq('tool', 'test-guard-route').order('id');
    assert.deepStrictEqual(events.map((e) => e.outcome), ['accepted', 'provider_failed']);

    console.log('PASS: guardPaidRoute -- commit reconciles, release restores, both logged.');
  } finally {
    await restoreCounter('global_spend_microusd', period, before);
    await cleanupIpAndEvents(ip);
  }
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

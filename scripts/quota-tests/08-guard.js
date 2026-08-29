const assert = require('node:assert');
const { guardPaidRoute } = require('../../lib/quota/guard');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { hashIp } = require('../../lib/quota/ipHash');

function fakeReq(ip) {
  return { headers: { get: (name) => (name === 'x-forwarded-for' ? ip : null) } };
}

async function cleanupAll(ip) {
  const hash = hashIp(ip);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:hour:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:day:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey());
  await supabaseAdmin.from('usage_events').delete().eq('route', 'test-guard-route');
}

async function main() {
  const ip = '198.51.100.7';
  await cleanupAll(ip);

  const guard1 = await guardPaidRoute(fakeReq(ip), { route: 'ai', tool: 'test-guard-route' });
  assert.strictEqual(guard1.ok, true);
  await guard1.commit(1); // reconcile down to 1 cent actual

  const { data: afterCommit } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey()).single();
  assert.strictEqual(Number(afterCommit.value), 1);

  const guard2 = await guardPaidRoute(fakeReq(ip), { route: 'ai', tool: 'test-guard-route' });
  assert.strictEqual(guard2.ok, true);
  await guard2.release(); // simulate provider failure
  const { data: afterRelease } = await supabaseAdmin.from('usage_counters').select('value').eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey()).single();
  assert.strictEqual(Number(afterRelease.value), 1, 'a released reservation must not leave residual spend -- verification #4');

  const { data: events } = await supabaseAdmin.from('usage_events').select('outcome').eq('route', 'test-guard-route').order('id');
  assert.deepStrictEqual(events.map((e) => e.outcome), ['accepted', 'provider_failed']);

  await cleanupAll(ip);
  console.log('PASS: guardPaidRoute -- commit reconciles, release restores, both logged.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

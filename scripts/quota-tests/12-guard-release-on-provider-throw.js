// scripts/quota-tests/12-guard-release-on-provider-throw.js
//
// Proves the fix for the "orphaned reservation" bug: app/api/remove-bg,
// app/api/ai, app/api/ai-vision and app/api/ai-transcribe all used to call
// guard.release() only inside the `if (!response.ok)` branch -- i.e. only
// when the provider *responded* with a failure. If fetch() itself threw
// (network error, DNS failure, timeout) before any response existed, that
// throw skipped straight past the release() call to the route's outer
// catch, which alerts but never releases -- leaving the worst-case
// reservation stuck in global_spend_microusd for the rest of the month.
//
// The fix makes every one of those 4 routes wrap the provider call through
// commit() in its own try/catch whose catch block unconditionally calls
// guard.release(), mirroring the pattern already used by
// app/api/convert-to-pdf/route.ts's ConvertAPI path. This script does not
// import route.ts directly (plain `node` can't run Next route handlers
// outside the Next runtime) -- instead it exercises the exact same
// guard.js contract those routes now rely on, under the exact failure
// shape the fix targets: a call that throws before any cost is known.
//
// NOTE: this script makes real Supabase calls (via lib/quota/supabaseAdmin.js,
// which reads SUPABASE_SERVICE_ROLE_KEY from process.env) and is meant to be
// run by hand in local dev with that env var already set in the shell -- same
// as every other script in this directory. It is not executed as part of
// writing this fix -- SUPABASE_SERVICE_ROLE_KEY never enters the
// implementer's or controller's working environment (permanent rule, see
// docs/plans/2026-08-28-quota-spend-limits-plan.md's Global Constraints).

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

const ROUTE = 'remove-bg'; // must be a real route key -- reserveGlobalSpend() looks up WORST_CASE_COST_MICROS[route]
const TOOL = 'test-release-on-throw'; // unique to this script -- scopes usage_events cleanup

function fakeReq(ip) {
  return { headers: { get: (name) => (name === 'x-forwarded-for' ? ip : null) } };
}

async function cleanupIpAndEvents(ip) {
  const hash = hashIp(ip);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:hour:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:day:${hash}`);
  await supabaseAdmin.from('usage_events').delete().eq('tool', TOOL);
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

// Mirrors the exact shape now in remove-bg/ai/ai-vision/ai-transcribe's
// route.ts: guard created, then a try/catch around the provider call whose
// catch unconditionally releases before any cost was ever established.
async function simulateGuardedRouteWhoseFetchThrows(guard) {
  try {
    await Promise.reject(new Error('simulated network failure (ECONNRESET/DNS/timeout)'));
    await guard.commit(1); // unreachable -- documents that commit() is never reached on this path
    return 'committed';
  } catch (err) {
    await guard.release();
    return 'released';
  }
}

async function main() {
  const ip = '198.51.100.13';
  const period = currentUtcMonthKey();
  await cleanupIpAndEvents(ip);
  const baseline = await readCounterValue('global_spend_microusd', period);

  try {
    const guard = await guardPaidRoute(fakeReq(ip), { route: ROUTE, tool: TOOL });
    assert.strictEqual(guard.ok, true);

    const outcome = await simulateGuardedRouteWhoseFetchThrows(guard);
    assert.strictEqual(outcome, 'released');

    const afterRelease = await readCounterValue('global_spend_microusd', period);
    assert.strictEqual(
      afterRelease - baseline,
      0,
      'a provider call that throws before any cost is known must fully release its reservation -- net zero effect on global_spend_microusd'
    );

    const { data: events } = await supabaseAdmin
      .from('usage_events').select('outcome').eq('tool', TOOL).order('id');
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].outcome, 'provider_failed');

    console.log('PASS: a thrown provider call releases its reservation in full (net zero), exactly like a response-level failure.');
  } finally {
    await restoreCounter('global_spend_microusd', period, baseline);
    await cleanupIpAndEvents(ip);
  }
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

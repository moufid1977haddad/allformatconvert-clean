// scripts/quota-tests/15-guard-unbilled-vs-billed-parse-failure.js
//
// Proves the release()/commit(null) boundary rule now applied in
// app/api/ai, app/api/ai-vision, app/api/ai-transcribe and
// app/api/convert-to-pdf, after an independent review found that all four
// routes could call guard.release() AFTER the provider had already
// returned a real 2xx response (and therefore very likely already billed
// the call) -- e.g. OpenAI returns 200 but the response body is truncated
// mid-stream and response.json() throws. The old code treated that
// exactly like a network failure (release the reservation), silently
// undercounting a cost that was probably real.
//
// The rule, stated exactly (per the decision this fix implements):
//   - fetch() itself throws, before any response exists -> release().
//     Nothing was billed; there is nothing to release incorrectly.
//   - A response exists but is not 2xx -> release() (unchanged). The
//     provider rejected the request; not billed.
//   - A response exists and IS 2xx, and anything fails after that (body
//     unreadable, parsing, whatever) -> NEVER release(). The provider
//     already responded successfully, so it was very likely already
//     billed. Treated as a real, unknown cost via commit(null, ...) --
//     the exact contract scripts/quota-tests/09-unknown-cost-guard.js
//     already proves: keeps the full worst-case reservation, alerts
//     'quota-cost-unknown' exactly once, never released.
//
// Both branches of that rule are exercised below (a prior version of this
// file hardcoded only the 2xx branch, leaving the non-2xx `release()` arm
// as dead code -- caught in independent review; fixed here by
// parameterizing and running both).
//
// Like scripts/quota-tests/12-guard-release-on-provider-throw.js, this
// script does NOT import any route.ts file directly (plain `node` can't
// run a Next route handler outside the Next runtime -- confirmed by
// direct testing when these guard.js tests were first written). It
// instead simulates the exact decision each of the 4 fixed routes now
// makes -- "was there a response, and was it ok?" -- and asserts on the
// real, observable guard.js contract that decision relies on. This proves
// the DECISION LOGIC's outcome is sound; it cannot, by itself, prove that
// a given route.ts file's actual try/catch still implements that exact
// branching -- that remains a manual-review responsibility, same caveat
// as test 12.
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
const { WORST_CASE_COST_MICROS } = require('../../lib/quota/config');

const ROUTE = 'ai'; // must be a real route key -- reserveGlobalSpend() looks up WORST_CASE_COST_MICROS[route]
const TOOL = 'test-billed-parse-failure'; // unique to this script -- scopes usage_events cleanup

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

// Mirrors the exact decision now in ai/ai-vision/ai-transcribe/route.ts's
// inner try/catch around response.json(): a response's parse failure
// routes to commit(null, ...) when the response was 2xx (already billed),
// or release() when it wasn't (never billed).
async function simulateParseFailure(guard, sendAlertFn, responseOk) {
  try {
    throw new Error('simulated: response.json() failed (truncated stream)');
  } catch {
    if (responseOk) {
      await guard.commit(null, sendAlertFn);
      return 'committed-unknown-cost';
    }
    await guard.release(sendAlertFn);
    return 'released';
  }
}

async function runScenario(responseOk) {
  const ip = responseOk ? '198.51.100.16' : '198.51.100.17';
  const period = currentUtcMonthKey();
  await cleanupIpAndEvents(ip);
  const baseline = await readCounterValue('global_spend_microusd', period);

  try {
    const sent = [];
    const stubSendAlert = async (service, status) => { sent.push({ service, status }); };

    const guard = await guardPaidRoute(fakeReq(ip), { route: ROUTE, tool: TOOL });
    assert.strictEqual(guard.ok, true);

    const outcome = await simulateParseFailure(guard, stubSendAlert, responseOk);

    if (responseOk) {
      assert.strictEqual(outcome, 'committed-unknown-cost', 'a 2xx response with an unparseable body must commit(null, ...), not release()');

      const after = await readCounterValue('global_spend_microusd', period);
      assert.strictEqual(
        after - baseline,
        WORST_CASE_COST_MICROS.ai,
        'the reservation must stay at the full worst-case amount -- NOT released back to baseline, since the provider likely already billed this call'
      );

      assert.strictEqual(sent.length, 1, 'this path must alert exactly once (quota-cost-unknown), same as any other unknown-cost commit');
      assert.strictEqual(sent[0].service, 'quota-cost-unknown');

      const { data: events } = await supabaseAdmin
        .from('usage_events').select('outcome, estimated_cost_micros').eq('tool', TOOL).order('id');
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].outcome, 'accepted', 'a billed-but-unparseable call is still an accepted usage event, not a provider_failed one');
      assert.strictEqual(Number(events[0].estimated_cost_micros), WORST_CASE_COST_MICROS.ai);

      console.log('PASS (2xx branch): a 2xx response whose body fails to parse keeps the full reservation via commit(null, ...) and is never released.');
    } else {
      assert.strictEqual(outcome, 'released', 'a non-2xx response with an unparseable body must release(), not commit()');

      const after = await readCounterValue('global_spend_microusd', period);
      assert.strictEqual(
        after - baseline,
        0,
        'the reservation must be fully released back to baseline -- the provider rejected the request, so nothing was billed'
      );

      assert.strictEqual(sent.length, 0, 'release() must never fire a quota-cost-unknown alert -- that alert is commit(null)-only');

      const { data: events } = await supabaseAdmin
        .from('usage_events').select('outcome, estimated_cost_micros').eq('tool', TOOL).order('id');
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].outcome, 'provider_failed');

      console.log('PASS (non-2xx branch): a non-2xx response with an unparseable body is fully released, as before.');
    }
  } finally {
    await restoreCounter('global_spend_microusd', period, baseline);
    await cleanupIpAndEvents(ip);
  }
}

async function main() {
  await runScenario(true);
  await runScenario(false);
  console.log('PASS: both sides of the response.ok boundary are correctly exercised.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

// scripts/quota-tests/09-unknown-cost-guard.js
//
// Proves the fix for the bug found during Tasks 9-12's live verification: an
// unknown/unavailable real cost (a missing or malformed `usage`/`duration`
// field from OpenAI) must never reconcile the global spend counter down to
// zero. It must keep the full worst-case reservation and alert the incident,
// strictly distinct from (a) a known real cost, which still reconciles
// normally, and (b) the no-argument commit() shape used by remove-bg's flat,
// deterministic cost, which is expected and must never alert.
//
// NOTE: this script makes real Supabase calls (via lib/quota/supabaseAdmin.js,
// which reads SUPABASE_SERVICE_ROLE_KEY from process.env) and is meant to be
// run by hand in local dev with that env var already set in the shell -- same
// as every other script in this directory. It is not executed as part of
// writing this fix.
const assert = require('node:assert');
const { guardPaidRoute } = require('../../lib/quota/guard');
const { supabaseAdmin } = require('../../lib/quota/supabaseAdmin');
const { currentUtcMonthKey } = require('../../lib/quota/period');
const { hashIp } = require('../../lib/quota/ipHash');
const { WORST_CASE_COST_CENTS, actualAiCostCents, actualAiTranscribeCostCents } = require('../../lib/quota/config');

const ROUTE = 'ai'; // must be a real route key -- reserveGlobalSpend() looks up WORST_CASE_COST_CENTS[route] and throws for an unknown one
const TOOL = 'test-unknown-cost'; // unique to this script -- used to scope usage_events cleanup, since ROUTE is shared with real 'ai' traffic

function fakeReq(ip) {
  return { headers: { get: (name) => (name === 'x-forwarded-for' ? ip : null) } };
}

async function cleanupAll(ip) {
  const hash = hashIp(ip);
  const period = currentUtcMonthKey();
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:hour:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', `ip_rate:day:${hash}`);
  await supabaseAdmin.from('usage_counters').delete().eq('bucket_key', 'global_spend_cents').eq('period_key', period);
  await supabaseAdmin.from('usage_counters').delete().like('bucket_key', 'alert_sent:global_spend:%').eq('period_key', period);
  await supabaseAdmin.from('usage_events').delete().eq('tool', TOOL);
}

function unitTests() {
  // The exact bug this fix corrects: a genuinely unknown real cost must
  // return null, never 0 (0 is reserved for a real, known, zero-valued cost).
  assert.strictEqual(actualAiCostCents(undefined), null, 'no usage object at all is unknown, not free');
  assert.strictEqual(actualAiCostCents({}), null, 'a usage object missing both token fields is unknown, not free');
  assert.strictEqual(
    actualAiCostCents({ prompt_tokens: 1, completion_tokens: 'not-a-number' }),
    null,
    'a partially-malformed usage object is still unknown, not partially known'
  );
  assert.strictEqual(
    typeof actualAiCostCents({ prompt_tokens: 100, completion_tokens: 50 }),
    'number',
    'a well-formed usage object must still produce a real, known cost'
  );

  assert.strictEqual(actualAiTranscribeCostCents(undefined), null, 'no duration at all is unknown, not free');
  assert.strictEqual(actualAiTranscribeCostCents(NaN), null, 'NaN is unknown, not free');
  assert.strictEqual(
    typeof actualAiTranscribeCostCents(0),
    'number',
    '0 seconds is a real, valid (if degenerate) known duration -- distinct from "we don\'t know the duration"'
  );
}

async function main() {
  unitTests();

  const ip = '198.51.100.99';
  await cleanupAll(ip);

  try {
    // -- Branch A: unknown cost (null) must keep the full worst-case
    // reservation exactly as reserved, and must alert exactly once.
    const sentA = [];
    const stubSendAlertA = async (service, status) => { sentA.push({ service, status }); };

    const guardA = await guardPaidRoute(fakeReq(ip), { route: ROUTE, tool: TOOL });
    assert.strictEqual(guardA.ok, true);
    await guardA.commit(null, stubSendAlertA);

    const { data: afterA } = await supabaseAdmin
      .from('usage_counters').select('value')
      .eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey())
      .single();
    assert.strictEqual(
      Number(afterA.value),
      WORST_CASE_COST_CENTS.ai,
      'an unknown real cost must keep the full worst-case reservation, never reconcile toward 0'
    );

    assert.strictEqual(sentA.length, 1, 'commit(null, ...) must alert exactly once');
    assert.strictEqual(sentA[0].service, 'quota-cost-unknown');
    assert.ok(sentA[0].status.includes(ROUTE), 'alert status must identify the route');
    assert.ok(sentA[0].status.includes(TOOL), 'alert status must identify the tool');

    const { data: eventsA } = await supabaseAdmin
      .from('usage_events').select('outcome, estimated_cost_cents')
      .eq('tool', TOOL).order('id');
    assert.strictEqual(eventsA.length, 1);
    assert.strictEqual(eventsA[0].outcome, 'accepted');
    assert.strictEqual(Number(eventsA[0].estimated_cost_cents), WORST_CASE_COST_CENTS.ai);

    await cleanupAll(ip);

    // -- Branch B (regression, per Task 8's 08-guard.js): a known actual cost
    // still reconciles down as before, and must NOT alert.
    const sentB = [];
    const stubSendAlertB = async (service, status) => { sentB.push({ service, status }); };

    const guardB = await guardPaidRoute(fakeReq(ip), { route: ROUTE, tool: TOOL });
    assert.strictEqual(guardB.ok, true);
    await guardB.commit(1, stubSendAlertB); // reconcile down to 1 cent actual

    const { data: afterB } = await supabaseAdmin
      .from('usage_counters').select('value')
      .eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey())
      .single();
    assert.strictEqual(Number(afterB.value), 1, 'a known actual cost must still reconcile down to the real value');
    assert.strictEqual(sentB.length, 0, 'a known cost must never alert');

    await cleanupAll(ip);

    // -- Branch C (regression): commit() called with no cost argument at all
    // (remove-bg's flat-cost shape -- the reservation already equals the
    // actual cost, so no reconciliation is performed) must keep the full
    // reservation and must NOT alert -- this is the expected, non-incident
    // path. The stub is still passed as the *second* argument so it can be
    // asserted on; omitting the first argument (actualCostCents) is what
    // matters here; commit() has no default for that first parameter, so
    // `commit(undefined, stub)` and a literal no-argument `commit()` take
    // the identical code path.
    const sentC = [];
    const stubSendAlertC = async (service, status) => { sentC.push({ service, status }); };

    const guardC = await guardPaidRoute(fakeReq(ip), { route: ROUTE, tool: TOOL });
    assert.strictEqual(guardC.ok, true);
    await guardC.commit(undefined, stubSendAlertC);

    const { data: afterC } = await supabaseAdmin
      .from('usage_counters').select('value')
      .eq('bucket_key', 'global_spend_cents').eq('period_key', currentUtcMonthKey())
      .single();
    assert.strictEqual(
      Number(afterC.value),
      WORST_CASE_COST_CENTS.ai,
      'commit() with no cost argument must keep the full reservation (flat-cost shape)'
    );
    assert.strictEqual(sentC.length, 0, 'commit() with no cost argument must never alert -- expected, not an incident');
  } finally {
    await cleanupAll(ip);
  }

  console.log('PASS: unknown real cost keeps the worst-case reservation and alerts; known cost reconciles; flat-cost commit() is unaffected.');
}

main().catch((err) => { console.error('FAIL:', err.message); process.exit(1); });

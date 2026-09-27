// node scripts/quota-tests/18-upscale-budget.js
// In-memory counters only (never the real Supabase buckets -- standing rule on SUPABASE_SERVICE_ROLE_KEY):
// the AI upscaler's own monthly budget cuts off when reached, without spending anything.
const assert = require('assert');
const { reserveUpscale, upscaleCostMicros, monthlyBudgetMicros, UPSCALE_MONTHLY_BUDGET_MICROS, UPSCALE_WORST_CASE_MICROS } = require('../../lib/quota/upscaleBudget');

function memCounters() {
  const m = new Map();
  const k = (b, p) => b + '|' + p;
  return {
    async incrementCounter(b, p, amount, cap) {
      const v = (m.get(k(b, p)) || 0) + amount;
      if (v > cap) return { allowed: false, newValue: v - amount };
      m.set(k(b, p), v);
      return { allowed: true, newValue: v };
    },
    async decrementCounter(b, p, amount) { m.set(k(b, p), (m.get(k(b, p)) || 0) - amount); },
    async adjustCounter(b, p, delta) { m.set(k(b, p), (m.get(k(b, p)) || 0) + delta); },
    spent() { for (const [key, v] of m) if (key.startsWith('upscale_spend_micros')) return v; return 0; },
  };
}
let pass = 0;
async function t(name, fn) { await fn(); pass++; console.log('PASS', name); }

(async () => {
  await t('cost of a measured 1 Mpx x4 (34.5 s, 30 MB PNG) is about $0.005', async () => {
    const c = upscaleCostMicros({ seconds: 34.5, outputBytes: 30e6 });
    assert.ok(c > 4000 && c < 6000, String(c));
  });
  await t('cost of a 6 Mpx x4 estimate (207 s, 180 MB PNG) stays under the worst-case reservation', async () => {
    const c = upscaleCostMicros({ seconds: 207, outputBytes: 180e6 });
    assert.ok(c < UPSCALE_WORST_CASE_MICROS, `${c} >= ${UPSCALE_WORST_CASE_MICROS}`);
  });
  await t(`the $${UPSCALE_MONTHLY_BUDGET_MICROS / 1e6} budget refuses once reached (503, reset date), and nothing more is reserved`, async () => {
    const c = memCounters();
    let n = 0;
    for (;;) { const r = await reserveUpscale(c, {}); if (!r.ok) { assert.strictEqual(r.status, 503); assert.match(r.error, /monthly budget/); break; } n++; }
    assert.strictEqual(n, Math.floor(UPSCALE_MONTHLY_BUDGET_MICROS / UPSCALE_WORST_CASE_MICROS));
    const before = c.spent();
    assert.strictEqual((await reserveUpscale(c, {})).ok, false);
    assert.strictEqual(c.spent(), before, 'a refused request reserves nothing');
  });
  await t('settling to real costs frees room: more images fit than worst cases would allow', async () => {
    const c = memCounters();
    let n = 0;
    for (;;) { const r = await reserveUpscale(c, {}); if (!r.ok) break; await r.settle({ seconds: 34.5, outputBytes: 30e6 }); n++; if (n > 5000) break; }
    assert.ok(n > 900, `only ${n} 1-Mpx images in $5`);
    assert.ok(c.spent() <= UPSCALE_MONTHLY_BUDGET_MICROS);
  });
  await t('release gives the reservation back; settle(null) keeps the worst case', async () => {
    const c = memCounters();
    const a = await reserveUpscale(c, {}); await a.release(); assert.strictEqual(c.spent(), 0);
    const b = await reserveUpscale(c, {}); await b.settle(null); assert.strictEqual(c.spent(), UPSCALE_WORST_CASE_MICROS);
  });
  await t('a variable can only LOWER the budget (preview proof), never raise it; garbage is refused', async () => {
    assert.strictEqual(monthlyBudgetMicros({ UPSCALE_MONTHLY_BUDGET_MICROS: '0' }), 0);
    assert.strictEqual(monthlyBudgetMicros({ UPSCALE_MONTHLY_BUDGET_MICROS: '999999999' }), UPSCALE_MONTHLY_BUDGET_MICROS);
    assert.throws(() => monthlyBudgetMicros({ UPSCALE_MONTHLY_BUDGET_MICROS: 'abc' }));
    const c = memCounters();
    const r = await reserveUpscale(c, { UPSCALE_MONTHLY_BUDGET_MICROS: '0' });
    assert.strictEqual(r.ok, false);
  });
  console.log(`${pass} passed`);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });

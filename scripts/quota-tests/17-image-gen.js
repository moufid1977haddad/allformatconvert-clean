// node scripts/quota-tests/17-image-gen.js
// In-memory counters only (never the real Supabase buckets -- see the standing rule on
// SUPABASE_SERVICE_ROLE_KEY): the image generator's per-IP and monthly-budget limits.
process.env.IP_RATE_LIMIT_PER_HOUR ||= '30';
process.env.IP_RATE_LIMIT_PER_DAY ||= '100';
process.env.IP_HASH_SALT ||= 'test-salt';
const assert = require('assert');
const { reserveImageGen, IMAGE_GEN_PER_IP_PER_DAY, IMAGE_GEN_MONTHLY_BUDGET_MICROS } = require('../../lib/quota/imageGen');
const { IMAGE_GEN_WORST_CASE_MICROS } = require('../../lib/quota/config');

function memCounters() {
  const m = new Map();
  const k = (b, p) => b + '|' + p;
  return {
    m,
    async incrementCounter(b, p, amount, cap) {
      const v = (m.get(k(b, p)) || 0) + amount;
      if (v > cap) return { allowed: false, value: v - amount };
      m.set(k(b, p), v);
      return { allowed: true, value: v };
    },
    async decrementCounter(b, p, amount) { m.set(k(b, p), (m.get(k(b, p)) || 0) - amount); },
    async adjustCounter(b, p, delta) { m.set(k(b, p), (m.get(k(b, p)) || 0) + delta); },
    budget() { for (const [key, v] of m) if (key.startsWith('imagegen_spend_micros')) return v; return 0; },
  };
}
const req = (ip) => ({ headers: { get: (h) => (h.toLowerCase() === 'x-forwarded-for' ? ip : null) } });
let pass = 0;
async function t(name, fn) { await fn(); pass++; console.log('PASS', name); }

(async () => {
  await t(`${IMAGE_GEN_PER_IP_PER_DAY} per IP per day, then 429`, async () => {
    const c = memCounters();
    for (let i = 0; i < IMAGE_GEN_PER_IP_PER_DAY; i++) assert.ok((await reserveImageGen(req('1.1.1.1'), c)).ok);
    const r = await reserveImageGen(req('1.1.1.1'), c);
    assert.strictEqual(r.ok, false); assert.strictEqual(r.status, 429);
    assert.ok((await reserveImageGen(req('2.2.2.2'), c)).ok, 'another visitor is not affected');
  });
  await t('settle moves the reservation to the real cost', async () => {
    const c = memCounters();
    const r = await reserveImageGen(req('3.3.3.3'), c);
    assert.strictEqual(c.budget(), IMAGE_GEN_WORST_CASE_MICROS);
    await r.settle(6080);
    assert.strictEqual(c.budget(), 6080);
  });
  await t('unknown cost (null) keeps the worst case, never zero', async () => {
    const c = memCounters();
    const r = await reserveImageGen(req('4.4.4.4'), c);
    await r.settle(null);
    assert.strictEqual(c.budget(), IMAGE_GEN_WORST_CASE_MICROS);
  });
  await t('release gives back budget and the visitor\'s image', async () => {
    const c = memCounters();
    for (let i = 0; i < IMAGE_GEN_PER_IP_PER_DAY; i++) await (await reserveImageGen(req('5.5.5.5'), c)).release();
    assert.strictEqual(c.budget(), 0);
    assert.ok((await reserveImageGen(req('5.5.5.5'), c)).ok, 'released attempts do not count');
  });
  await t('settle/release are idempotent', async () => {
    const c = memCounters();
    const r = await reserveImageGen(req('6.6.6.6'), c);
    await r.settle(5000); await r.settle(5000); await r.release();
    assert.strictEqual(c.budget(), 5000);
  });
  await t('monthly budget refuses with 503 and gives the IP slot back', async () => {
    const c = memCounters();
    const fit = Math.floor(IMAGE_GEN_MONTHLY_BUDGET_MICROS / IMAGE_GEN_WORST_CASE_MICROS);
    for (let i = 0; i < fit; i++) assert.ok((await reserveImageGen(req(`10.0.${Math.floor(i / 250)}.${i % 250}`), c)).ok);
    const r = await reserveImageGen(req('9.9.9.9'), c);
    assert.strictEqual(r.ok, false); assert.strictEqual(r.status, 503);
    const ipUsed = [...c.m].filter(([key]) => key.startsWith('imagegen_ip')).filter(([, v]) => v > 0).length;
    assert.strictEqual(ipUsed, fit, 'the refused visitor was not charged a daily image');
  });
  console.log(`\n${pass} passed`);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });

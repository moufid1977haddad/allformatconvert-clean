// node scripts/quota-tests/21-ai-detect.js
// In-memory counters only (never the real Supabase buckets -- see the standing rule on
// SUPABASE_SERVICE_ROLE_KEY): the AI Detector's own limits (lib/quota/aiDetect.js, P17).
process.env.IP_HASH_SALT ||= 'test-salt';
const assert = require('assert');
const { reserveAiDetect, AI_DETECT_WORDS_PER_IP_PER_DAY, AI_DETECT_MONTHLY_BUDGET_MICROS } = require('../../lib/quota/aiDetect');

function memCounters() {
  const m = new Map();
  const k = (b, p) => b + '|' + p;
  const alerts = [];
  return {
    m, alerts,
    // Same contract as counters.js#incrementCountersAllOrNone: all go up, or none does.
    async incrementCountersAllOrNone(items) {
      const cur = items.map((i) => m.get(k(i.bucketKey, i.periodKey)) || 0);
      const over = items.map((i, n) => cur[n] + i.amount > i.cap);
      if (over.some(Boolean)) return { allowed: false, results: items.map((i, n) => ({ newValue: cur[n], overCap: over[n] })) };
      items.forEach((i, n) => m.set(k(i.bucketKey, i.periodKey), cur[n] + i.amount));
      return { allowed: true, results: items.map((i, n) => ({ newValue: cur[n] + i.amount, overCap: false })) };
    },
    async decrementCounter(b, p, amount) { m.set(k(b, p), (m.get(k(b, p)) || 0) - amount); },
    async checkAndAlertThresholds(a) { alerts.push(a); },
    sum(prefix) { let s = 0; for (const [key, v] of m) if (key.startsWith(prefix)) s += v; return s; },
    keys() { return [...m.keys()]; },
  };
}
const req = (ip) => ({ headers: { get: (h) => (h.toLowerCase() === 'x-real-ip' ? ip : null) } });
const A = (words) => ({ words, costMicros: (words / 100) * 50_000 });
let pass = 0;
async function t(name, fn) { await fn(); pass++; console.log('PASS', name); }

(async () => {
  await t('constants: 2,000 words a day per visitor, $50 a month', async () => {
    assert.strictEqual(AI_DETECT_WORDS_PER_IP_PER_DAY, 2000);
    assert.strictEqual(AI_DETECT_MONTHLY_BUDGET_MICROS, 50_000_000);
  });
  await t('a visitor gets 2,000 billed words a day, then a clear 429 naming what is left', async () => {
    const c = memCounters();
    for (let i = 0; i < 6; i++) assert.ok((await reserveAiDetect(req('1.1.1.1'), A(300), c)).ok); // 1,800
    const r = await reserveAiDetect(req('1.1.1.1'), A(300), c);
    assert.strictEqual(r.ok, false); assert.strictEqual(r.status, 429);
    assert.match(r.error, /300 words and 200 of today's 2000 free words are left/);
    assert.ok((await reserveAiDetect(req('1.1.1.1'), A(200), c)).ok, 'the 200 left can still be used');
    const done = await reserveAiDetect(req('1.1.1.1'), A(100), c);
    assert.strictEqual(done.status, 429); assert.match(done.error, /used today's 2000 free words/);
    assert.ok((await reserveAiDetect(req('2.2.2.2'), A(1000), c)).ok, 'another visitor is not affected');
  });
  await t('the reservation is the exact price, on the detector\'s OWN budget key only', async () => {
    const c = memCounters();
    await reserveAiDetect(req('3.3.3.3'), A(300), c);
    assert.strictEqual(c.sum('aidetect_spend_micros'), 150_000);
    assert.ok(!c.keys().some((key) => key.startsWith('global_spend')), 'the site-wide $20 counter is never touched');
  });
  await t('monthly budget: refuses with 503 and a clear site-wide message, without charging the visitor', async () => {
    const c = memCounters();
    // 100 visitors x 1,000 words = $50: exactly the budget.
    for (let i = 0; i < 100; i++) assert.ok((await reserveAiDetect(req(`10.0.0.${i}`), A(1000), c)).ok);
    assert.strictEqual(c.sum('aidetect_spend_micros'), 50_000_000);
    const r = await reserveAiDetect(req('9.9.9.9'), A(100), c);
    assert.strictEqual(r.ok, false); assert.strictEqual(r.status, 503);
    assert.match(r.error, /AI detector has reached its monthly budget — a site-wide limit, not something on your end\. It resets on /);
    assert.strictEqual(c.sum('aidetect_ip:day:'), 100 * 1000, 'the refused visitor was not charged any words');
    assert.strictEqual(c.sum('aidetect_spend_micros'), 50_000_000, 'never above the cap');
    const last = c.alerts[c.alerts.length - 1];
    assert.deepStrictEqual([last.counterName, last.value, last.cap], ['ai_detect_spend', 50_000_000, 50_000_000], 'the refusal reports 100 %');
  });
  await t('release (Pangram refused the task: nothing billed) gives back budget and words; idempotent', async () => {
    const c = memCounters();
    const r = await reserveAiDetect(req('5.5.5.5'), A(2000), c);
    await r.release(); await r.release();
    assert.strictEqual(c.sum('aidetect_spend_micros'), 0);
    assert.strictEqual(c.sum('aidetect_ip:day:'), 0);
    assert.ok((await reserveAiDetect(req('5.5.5.5'), A(2000), c)).ok, 'released words do not count');
  });
  await t('budget threshold alerts are checked with the detector\'s own counter and cap', async () => {
    const c = memCounters();
    await reserveAiDetect(req('6.6.6.6'), A(500), c);
    assert.deepStrictEqual(c.alerts.map((a) => [a.counterName, a.value, a.cap]), [['ai_detect_spend', 250_000, 50_000_000]]);
  });
  await t('a failing alert check never undoes the reservation', async () => {
    const c = memCounters();
    c.checkAndAlertThresholds = async () => { throw new Error('db blip'); };
    const r = await reserveAiDetect(req('7.7.7.7'), A(100), c);
    assert.ok(r.ok); assert.strictEqual(c.sum('aidetect_spend_micros'), 50_000);
  });
  await t('invalid analyses are refused before touching any counter', async () => {
    const c = memCounters();
    for (const bad of [{ words: 0, costMicros: 1 }, { words: 100, costMicros: 0 }, { words: 1.5, costMicros: 1 }, { words: NaN, costMicros: 1 }]) {
      await assert.rejects(reserveAiDetect(req('8.8.8.8'), bad, c), /invalid analysis/);
    }
    assert.strictEqual(c.keys().length, 0);
  });
  await t('counters unreachable: the error propagates (the route then answers 503 without calling Pangram)', async () => {
    const c = memCounters();
    c.incrementCountersAllOrNone = async () => { throw new Error('supabase down'); };
    await assert.rejects(reserveAiDetect(req('8.8.4.4'), A(100), c), /supabase down/);
  });
  await t('a release that failed part-way can be repeated and only does what is left', async () => {
    const c = memCounters();
    const r = await reserveAiDetect(req('7.7.9.9'), A(300), c);
    const real = c.decrementCounter; let n = 0;
    c.decrementCounter = async (...a) => { if (++n === 2) throw new Error('blip'); return real(...a); };
    await assert.rejects(r.release(), /blip/);
    assert.strictEqual(c.sum('aidetect_spend_micros'), 0, 'budget given back');
    assert.strictEqual(c.sum('aidetect_ip:day:'), 300, 'words not yet');
    await r.release(); await r.release();
    assert.strictEqual(c.sum('aidetect_ip:day:'), 0);
    assert.strictEqual(c.sum('aidetect_spend_micros'), 0, 'never below zero by a repeat');
  });
  await t('IPv6: one /64 is one visitor (no rotation through its addresses); IPv4 addresses stay apart', async () => {
    const c = memCounters();
    assert.ok((await reserveAiDetect(req('2001:db8:1:2:aaaa::1'), A(1000), c)).ok);
    assert.ok((await reserveAiDetect(req('2001:0db8:0001:0002:ffff:1:2:3'), A(1000), c)).ok);
    assert.strictEqual((await reserveAiDetect(req('2001:db8:1:2::9'), A(100), c)).status, 429, 'same /64');
    assert.ok((await reserveAiDetect(req('2001:db8:1:3::1'), A(1000), c)).ok, 'another /64');
    assert.ok((await reserveAiDetect(req('203.0.113.7'), A(2000), c)).ok);
    assert.ok((await reserveAiDetect(req('203.0.113.8'), A(2000), c)).ok);
  });
  await t('previews only (VERCEL_ENV=preview): 30,000 words per visitor for the corpus; the $50 budget is unchanged', async () => {
    const c = memCounters();
    const prev = { VERCEL_ENV: 'preview' };
    for (let i = 0; i < 30; i++) assert.ok((await reserveAiDetect(req('4.4.4.4'), A(1000), c, prev)).ok);
    assert.strictEqual((await reserveAiDetect(req('4.4.4.4'), A(100), c, prev)).status, 429);
    assert.strictEqual((await reserveAiDetect(req('4.4.8.8'), A(1000), c, { VERCEL_ENV: 'production' })).ok, true);
    assert.strictEqual((await reserveAiDetect(req('4.4.8.8'), A(1100), c, { VERCEL_ENV: 'production' })).status, 429, 'production keeps 2,000');
    const b = memCounters();
    for (let i = 0; i < 100; i++) await reserveAiDetect(req(`10.1.0.${i}`), A(1000), b, prev);
    assert.strictEqual((await reserveAiDetect(req('10.2.0.1'), A(100), b, prev)).status, 503, 'same $50 budget on previews');
  });
  console.log(`\n${pass} passed`);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });

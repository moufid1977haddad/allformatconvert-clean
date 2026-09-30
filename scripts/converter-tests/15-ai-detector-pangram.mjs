// AI Detector through Pangram (30/09, PREPARED, NOT IN SERVICE): lib/ai/pangram.js. No network, no key: Pangram's
// API is played by a fake fetch shaped like the answers documented on docs.pangram.com (29/09/2026).
// Run: node scripts/converter-tests/15-ai-detector-pangram.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const P = await import(new URL('../../lib/ai/pangram.js', import.meta.url));
const require = createRequire(import.meta.url);
let passed = 0; const tests = [];
const test = (n, f) => tests.push([n, f]);
const noSleep = async () => {};
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const SUCCESS = { stage: 'STAGE_SUCCESS', version: '4.0', prediction_short: 'AI', headline: 'AI Detected', fraction_ai: 0.93, fraction_ai_assisted: 0.05, fraction_human: 0.02, windows: [] };

test('without PANGRAM_API_KEY the detector refuses loudly (no silent fallback)', () => {
  assert.throws(() => P.requirePangramKey({}), /PANGRAM_API_KEY is not set/);
  assert.throws(() => P.requirePangramKey({ PANGRAM_API_KEY: '  ' }), /PANGRAM_API_KEY is not set/);
  assert.equal(P.requirePangramKey({ PANGRAM_API_KEY: 'k' }), 'k');
});
test('cost: $0.05 per started 100 words; the detector is NOT on the shared $20 guard; free words match lib/quota/aiDetect.js', () => {
  assert.equal(P.pangramCostMicros(40), 50_000);
  assert.equal(P.pangramCostMicros(100), 50_000);
  assert.equal(P.pangramCostMicros(101), 100_000);
  assert.equal(P.pangramCostMicros(300), 150_000);
  assert.equal(P.pangramCostMicros(P.AI_DETECT_MAX_WORDS), 500_000);
  assert.equal(P.billedWords(40), 100); assert.equal(P.billedWords(101), 200); assert.equal(P.billedWords(1000), 1000);
  process.env.IP_RATE_LIMIT_PER_HOUR ||= '1'; process.env.IP_RATE_LIMIT_PER_DAY ||= '1'; // config.js refuses to load without them
  const { WORST_CASE_COST_MICROS } = require('../../lib/quota/config.js');
  assert.equal(WORST_CASE_COST_MICROS['ai-detect'], undefined, 'ai-detect must never reserve on the site-wide cap');
  const { AI_DETECT_WORDS_PER_IP_PER_DAY, AI_DETECT_MONTHLY_BUDGET_MICROS } = require('../../lib/quota/aiDetect.js');
  assert.equal(AI_DETECT_WORDS_PER_IP_PER_DAY, P.AI_DETECT_FREE_WORDS_PER_DAY);
  assert.equal(AI_DETECT_MONTHLY_BUDGET_MICROS, 50_000_000);
});
test('billable words: spaced scripts by token, unspaced scripts (CJK, Thai) one word per character', () => {
  assert.equal(P.countBillableWords('  one two\nthree  '), 3);
  assert.equal(P.countBillableWords("l'été — déjà vu"), 4);
  assert.equal(P.countBillableWords('这是一个测试'), 6);
  assert.equal(P.countBillableWords('日本語のテキスト abc'), 9);
  assert.equal(P.countBillableWords('ภาษาไทย'), 7);
  assert.equal(P.countBillableWords('Привет мир'), 2);
  // review P17: invisible characters, hyphen chains and very long tokens cannot pass as one word
  assert.equal(P.countBillableWords('a​b‍c⁠d'), 4);
  assert.equal(P.countBillableWords('ab-ab-ab-ab'), 4);
  assert.equal(P.countBillableWords("don't l'été"), 2);
  assert.equal(P.countBillableWords('x'.repeat(800)), 100);
  assert.equal(P.countBillableWords('བོད་ཡིག'), 7); // each Tibetan code point (conservative)
  assert.equal(P.countBillableWords(''), 0);
});
test('task created, then read until STAGE_SUCCESS; key sent in x-api-key, model pangram-4', async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    if (init.method === 'POST') return reply(200, { task_id: 'abc-1', stage: 'STAGE_PREPROCESSING' });
    return reply(200, calls.length < 3 ? { task_id: 'abc-1', stage: 'STAGE_PREPROCESSING' } : SUCCESS);
  };
  const r = await P.detectWithPangram('some text', { apiKey: 'secret', fetchImpl, sleep: noSleep });
  assert.deepEqual(r, { verdict: 'ai', fractionAi: 0.93, fractionAiAssisted: 0.05, fractionHuman: 0.02, headline: 'AI Detected', version: '4.0' });
  assert.equal(calls[0].url, 'https://text.external-api.pangram.com/task');
  assert.equal(calls[0].init.headers['x-api-key'], 'secret');
  assert.deepEqual(JSON.parse(calls[0].init.body), { text: 'some text', model: 'pangram-4' });
  assert.equal(calls[1].url, 'https://text.external-api.pangram.com/task/abc-1');
});
test('Human and Mixed verdicts are read; a malformed result is an error, never a made-up verdict', () => {
  assert.equal(P.readPangramResult({ ...SUCCESS, prediction_short: 'Human', fraction_ai: 0, fraction_human: 1 }).verdict, 'human');
  assert.equal(P.readPangramResult({ ...SUCCESS, prediction_short: 'Mixed' }).verdict, 'mixed');
  assert.throws(() => P.readPangramResult({ ...SUCCESS, prediction_short: 'Maybe' }), /unexpected Pangram result/);
  assert.throws(() => P.readPangramResult({ ...SUCCESS, fraction_ai: 1.7 }), /unexpected Pangram result/);
});
test('refused creation is not billed; a failure after creation may be billed', async () => {
  await assert.rejects(P.detectWithPangram('t', { apiKey: 'k', sleep: noSleep, fetchImpl: async () => reply(429, { error: 'rate' }) }), (e) => e.billed === false && e.status === 429);
  await assert.rejects(P.detectWithPangram('t', { apiKey: 'k', sleep: noSleep, fetchImpl: async () => reply(402, { error: 'credits' }) }), (e) => e.billed === false);
  // review P17: a 5xx or an unreadable answer may come after the task was created -- never treated as unbilled
  await assert.rejects(P.detectWithPangram('t', { apiKey: 'k', sleep: noSleep, fetchImpl: async () => reply(502, null) }), (e) => e.billed === true);
  await assert.rejects(P.detectWithPangram('t', { apiKey: 'k', sleep: noSleep, fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('truncated'); } }) }), (e) => e.billed === true);
  await assert.rejects(P.detectWithPangram('t', { apiKey: 'k', sleep: noSleep, fetchImpl: async () => reply(200, { stage: 'STAGE_PREPROCESSING' }) }), (e) => e.billed === true);
  // every request carries a timeout signal
  const signals = [];
  await P.detectWithPangram('t', { apiKey: 'k', sleep: noSleep, fetchImpl: async (u, init = {}) => { signals.push(init.signal); return init.method === 'POST' ? reply(200, { task_id: 'x' }) : reply(200, SUCCESS); } });
  assert.ok(signals.length === 2 && signals.every((sg) => sg instanceof AbortSignal));
  const failing = async (url, init = {}) => init.method === 'POST' ? reply(200, { task_id: 'x' }) : reply(200, { stage: 'STAGE_FAILED' });
  await assert.rejects(P.detectWithPangram('t', { apiKey: 'k', sleep: noSleep, fetchImpl: failing }), (e) => e.billed === true);
  const stuck = async (url, init = {}) => init.method === 'POST' ? reply(200, { task_id: 'x' }) : reply(200, { stage: 'STAGE_PREPROCESSING' });
  await assert.rejects(P.detectWithPangram('t', { apiKey: 'k', sleep: noSleep, maxPolls: 3, fetchImpl: stuck }), /still running/);
});
test('word count', () => {
  assert.equal(P.countWords('  one two\nthree  '), 3);
  assert.equal(P.countWords(''), 0);
});

for (const [n, f] of tests) {
  try { await f(); passed++; console.log('PASS', n); } catch (e) { console.log('FAIL', n, '\n ', e.message); }
}
console.log(`${passed}/${tests.length}`);
process.exit(passed === tests.length ? 0 : 1);

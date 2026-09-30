// AI Detector (RAIDAR, lib/ai/raidar.js), 30/09: the verdict bands after the arXiv 2016 false positive.
// Oracle: the similarities measured on www on 30/09 (scripts/ai-detector/results/raidar-www.json).
// Run: node scripts/converter-tests/16-ai-detector-raidar.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
const R = await import(new URL('../../lib/ai/raidar.js', import.meta.url));
const measured = JSON.parse(fs.readFileSync(new URL('../ai-detector/results/raidar-www.json', import.meta.url), 'utf8')).rows;
let passed = 0; const tests = [];
const test = (n, f) => tests.push([n, f]);
test('the human LIGO abstract (0.905 on www) was called AI with the old 0.90 band (the defect is real)', () => {
  assert.ok(measured['h-arxiv-1602.03837'].sim >= 0.9 && measured['h-arxiv-1602.03837'].kind === 'human');
});
test('it now gets no verdict', () => assert.equal(R.raidarVerdict(measured['h-arxiv-1602.03837'].sim), 'uncertain'));
test('no human text measured on www is called AI', () => {
  for (const [id, r] of Object.entries(measured)) if (r.kind === 'human') assert.notEqual(R.raidarVerdict(r.sim), 'ai', id);
});
test('AI texts well above the band are still recognised', () => {
  assert.equal(R.raidarVerdict(measured['ai-gpt4omini-3'].sim), 'ai');
  assert.equal(R.raidarVerdict(0.93), 'ai');
  assert.equal(R.raidarVerdict(0.929), 'uncertain');
  assert.equal(R.raidarVerdict(0.799), 'human');
});
for (const [n, f] of tests) {
  try { await f(); passed++; console.log('PASS', n); } catch (e) { console.log('FAIL', n, '\n ', e.message); }
}
console.log(`${passed}/${tests.length}`);
process.exit(passed === tests.length ? 0 : 1);

// Split PDF planner: modes and refusals. Run: node scripts/pdf-split-tests/01-split-plan.mjs
import assert from 'node:assert/strict';
import { parseRanges, planSplit, partName } from '../../app/tools/pdf-tools/pdf-split/splitPlan.js';

let pass = 0;
const ok = (n, fn) => { fn(); pass++; console.log('PASS', n); };
const labels = (r) => r.files.map((f) => f.label);

ok('custom ranges, open end, en dash', () => {
  assert.deepEqual(labels(planSplit({ mode: 'ranges', spec: '1-3, 5, 8-' }, 10)), ['1-3', '5', '8-10']);
  assert.deepEqual(planSplit({ mode: 'ranges', spec: '2–4' }, 10).files[0].pages, [1, 2, 3]);
});
ok('refusals instead of empty PDFs (the old tool produced them)', () => {
  assert.match(parseRanges('5-3', 10).error, /backwards/);
  assert.match(parseRanges('abc', 10).error, /not a page/);
  assert.match(parseRanges('11', 10).error, /past the last page/);
  assert.match(parseRanges('0-2', 10).error, /start at 1/);
  assert.match(parseRanges('', 10).error, /Type the pages/);
});
ok('every N pages, last part shorter', () => {
  assert.deepEqual(labels(planSplit({ mode: 'every', every: 3 }, 10)), ['1-3', '4-6', '7-9', '10']);
  assert.match(planSplit({ mode: 'every', every: 10 }, 10).error, /same document/);
  assert.match(planSplit({ mode: 'every', every: 0 }, 10).error, /whole number/);
});
ok('extract all pages', () => {
  assert.equal(planSplit({ mode: 'all' }, 5).files.length, 5);
  assert.match(planSplit({ mode: 'all' }, 1).error, /only one page/);
});
ok('select pages, separate or merged', () => {
  assert.deepEqual(labels(planSplit({ mode: 'select', spec: '2, 4-5' }, 6)), ['2', '4', '5']);
  const m = planSplit({ mode: 'select', spec: '2, 4-5', merge: true }, 6);
  assert.equal(m.files.length, 1); assert.deepEqual(m.files[0].pages, [1, 3, 4]);
});
ok('merge ranges into one file keeps the order typed', () => {
  assert.deepEqual(planSplit({ mode: 'ranges', spec: '5-6, 1-2', merge: true }, 6).files[0].pages, [4, 5, 0, 1]);
});
ok('file names after the original', () => {
  assert.equal(partName('Report 2026.pdf', '1-3'), 'Report 2026_1-3.pdf');
  assert.equal(partName('a/b:c.PDF', '2,4-5'), 'a_b_c_2+4-5.pdf');
});
console.log(`\n${pass} passed`);

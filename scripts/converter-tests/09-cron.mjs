// Tests for app/lib/cronInfo.js (29/09). Oracle: crontab.guru's reading of
// the same expressions and the calendar.
// Run: node scripts/converter-tests/09-cron.mjs
import assert from 'node:assert/strict';
const { cronInfo } = await import(new URL('../../app/lib/cronInfo.js', import.meta.url));

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e.message); process.exitCode = 1; } };
const from = new Date(2026, 8, 29, 0, 0, 0); // local time, Tuesday 29 Sept 2026

test('valid expressions: description and next runs', () => {
  const r = cronInfo('*/15 9-17 * * 1-5', { from, count: 3 });
  assert.equal(r.ok, true);
  assert.match(r.description, /15 minutes/);
  assert.deepEqual(r.next.map((d) => [d.getHours(), d.getMinutes()]), [[9, 0], [9, 15], [9, 30]]);
  const y = cronInfo('0 0 1 1 *', { from, count: 1 });
  assert.equal(y.next[0].getFullYear(), 2027);
});
test('out-of-range fields and impossible dates are refused', () => {
  assert.equal(cronInfo('99 * * * *', { from }).ok, false);
  assert.equal(cronInfo('0 0 31 2 *', { from }).ok, false);
  assert.equal(cronInfo('* * *', { from }).ok, false);
  assert.match(cronInfo('* * *', { from }).error, /5 fields/);
});
console.log(`${passed} passed`);

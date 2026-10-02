// Tests for app/lib/timestamp.js (29/09). Oracle: known instants (ISO 8601).
// Run: node scripts/converter-tests/04-timestamp.mjs
import assert from 'node:assert/strict';
const { parseTimestamp, describe, parseDatetimeLocal, toDatetimeLocalValue, parseInZone, toZoneValue, describeZone } = await import(new URL('../../app/lib/timestamp.js', import.meta.url));

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e); process.exitCode = 1; } };
const iso = (s) => describe(parseTimestamp(s).ms).iso;

test('unit inferred from digits, as epochconverter does', () => {
  assert.deepEqual(parseTimestamp('1700000000'), { ms: 1700000000000, unit: 'seconds' });
  assert.deepEqual(parseTimestamp('1700000000000'), { ms: 1700000000000, unit: 'milliseconds' });
  assert.deepEqual(parseTimestamp('1700000000000000'), { ms: 1700000000000, unit: 'microseconds' });
  assert.deepEqual(parseTimestamp('1700000000000000000'), { ms: 1700000000000, unit: 'nanoseconds' });
  assert.equal(iso('1700000000'), '2023-11-14T22:13:20.000Z');
});
test('zero, negative, fractional seconds, spaces', () => {
  assert.equal(iso('0'), '1970-01-01T00:00:00.000Z');
  assert.equal(iso('-86400'), '1969-12-31T00:00:00.000Z');
  assert.equal(iso(' 1700000000.5 '), '2023-11-14T22:13:20.500Z');
  assert.equal(iso('2147483647'), '2038-01-19T03:14:07.000Z');
});
test('garbage and out-of-range values are refused, not partially read', () => {
  assert.throws(() => parseTimestamp('12abc'), /digits only/);
  assert.throws(() => parseTimestamp(''), /digits only/);
  assert.throws(() => parseTimestamp('1e9'), /digits only/);
  assert.throws(() => parseTimestamp('123456789012345678901'), /more than 20 digits/);
});
test('datetime-local round trip in the local zone (years < 100 included)', () => {
  for (const v of ['2024-02-29T23:59:59', '1969-12-31T00:00:00', '0050-06-15T12:00:00']) {
    assert.equal(toDatetimeLocalValue(parseDatetimeLocal(v)), v);
  }
  assert.throws(() => parseDatetimeLocal(''), /Pick a date/);
});
test('P24 time zones: offsets, skipped and repeated hours', () => {
  assert.equal(toZoneValue(0, 'Asia/Kolkata'), '1970-01-01T05:30:00');
  assert.match(describeZone(0, 'Asia/Kathmandu'), /UTC\+05:30/); // Nepal was +05:30 until 1986
  assert.equal(new Date(parseInZone('2024-07-01T12:00', 'America/New_York').ms).toISOString(), '2024-07-01T16:00:00.000Z');
  assert.throws(() => parseInZone('2024-03-31T02:30', 'Europe/Paris'), /does not exist/);
  const r = parseInZone('2024-10-27T02:30', 'Europe/Paris'); assert.equal(new Date(r.ms).toISOString(), '2024-10-27T00:30:00.000Z'); assert.equal(r.ambiguous, true);
  assert.equal(new Date(parseInZone('0050-06-01T00:00', 'UTC').ms).toISOString(), '0050-06-01T00:00:00.000Z'); // years < 100 not mapped to 19xx
  assert.match(describeZone(Date.UTC(2024, 0, 1), 'Asia/Kathmandu'), /UTC\+05:45/);
});
console.log(`${passed} passed`);

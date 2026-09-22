// Tests for app/lib/exactNumbers.js, on the exact inputs that produced wrong results in production
// on 2026-09-22 (docs/audit/RAPPORT-outils-mis-en-avant.md).
// Run: node scripts/exact-numbers-tests/01-exact-numbers.mjs
import assert from 'node:assert/strict';
const { formatSignificant, parseInBase, toRoman, fromRoman } = await import(new URL('../../app/lib/exactNumbers.js', import.meta.url));

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e); process.exitCode = 1; } };

test('1 mm in miles is not "0.0000"', () => assert.equal(formatSignificant(1 / 1609344), '0.0000006213711922'));
test('0.001 % of 5 is not "0.00"', () => assert.equal(formatSignificant((0.001 * 5) / 100), '0.00005'));
test('exact results stay short', () => { assert.equal(formatSignificant(212), '212'); assert.equal(formatSignificant(-273.15), '-273.15'); assert.equal(formatSignificant(0), '0'); });
test('1 km in inches with an exact factor', () => assert.equal(formatSignificant(1000 / 0.0254), '39370.07874'));
test('invalid digits are refused, not truncated', () => { assert.equal(parseInBase('1012', 2), null); assert.equal(parseInBase('12abc', 10), null); assert.equal(parseInBase('', 10), null); });
test('2^64 - 1 is exact', () => { const n = parseInBase('18446744073709551615', 10); assert.equal(n.toString(16), 'ffffffffffffffff'); assert.equal(n.toString(2), '1'.repeat(64)); });
test('prefixes and sign', () => { assert.equal(parseInBase('0xFF', 16), 255n); assert.equal(parseInBase('-0b101', 2), -5n); assert.equal(parseInBase('ff', 16), 255n); });
test('roman: canonical round trip', () => { assert.equal(toRoman(1994), 'MCMXCIV'); assert.equal(fromRoman('mcmxciv'), 1994); assert.equal(fromRoman('MMMCMXCIX'), 3999); });
test('roman: non-canonical refused', () => { for (const s of ['IM', 'VX', 'IIII', 'MMMM', 'ABC', 'IC', 'XM']) assert.equal(fromRoman(s), null, s); });
test('roman: out of range refused', () => { assert.equal(toRoman(4000), ''); assert.equal(toRoman(0), ''); });
console.log(`${passed} passed`);

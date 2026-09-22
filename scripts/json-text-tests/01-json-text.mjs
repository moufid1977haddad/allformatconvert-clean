// Tests for app/lib/jsonText.js: formatting must change whitespace only.
// Run: node scripts/json-text-tests/01-json-text.mjs
import assert from 'node:assert/strict';
const { reformatJson } = await import(new URL('../../app/lib/jsonText.js', import.meta.url));

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e); process.exitCode = 1; } };
const BS = String.fromCharCode(92); // one backslash, spelled out to survive any shell quoting
const NAME = `"caf${BS}u00e9 ${BS}"q${BS}" {x:[1,2]}"`;
const SRC = `{"id": 12345678901234567890, "price": 1.10, "exp": 1e21, "name": ${NAME}, "nested": {"list": [1, 2.50, true, null], "empty": {}, "e": [ ]}}`;
const STRING_OR_SPACE = new RegExp(`"(?:[^"${BS}${BS}]|${BS}${BS}.)*"|${BS}s+`, 'g');
const strip = (s) => s.replace(STRING_OR_SPACE, (m) => (m[0] === '"' ? m : ''));

test('64-bit id, 1.10, 1e21 and escapes kept exactly', () => {
  const out = reformatJson(SRC, 2);
  for (const lit of ['12345678901234567890', '1.10', '1e21', '2.50', NAME]) assert.ok(out.includes(lit), lit);
});
test('only whitespace changes (format and minify)', () => {
  assert.equal(strip(reformatJson(SRC, 2)), strip(SRC));
  assert.equal(reformatJson(SRC, 0), strip(SRC));
});
test('output is still valid JSON with the same structure', () => {
  assert.deepEqual(JSON.parse(reformatJson(SRC, 2)), JSON.parse(SRC));
});
test('same layout as JSON.stringify(…, 2) when nothing is lossy', () => {
  const plain = '{"a":[1,{"b":"x"}],"c":{},"d":[]}';
  assert.equal(reformatJson(plain, 2), JSON.stringify(JSON.parse(plain), null, 2));
});
test('invalid JSON still throws', () => assert.throws(() => reformatJson('{"a": [1, 2,,3]}', 2), SyntaxError));
console.log(`${passed} passed`);

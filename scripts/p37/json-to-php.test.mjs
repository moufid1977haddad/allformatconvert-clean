// P37 lot 1 — JSON to PHP, class mode: a whole number beyond PHP_INT_MAX is typed string, so the json_decode call
// of the generated "Usage:" line must pass JSON_BIGINT_AS_STRING. Without it PHP decodes the number as a float
// (1.2345678901235E+19) and the digits are lost before fromArray() runs.
// Oracle: the PHP manual (json_decode flags: JSON_BIGINT_AS_STRING "decodes large integers as their original string
// value"; signature json_decode(string $json, ?bool $associative = null, int $depth = 512, int $flags = 0)).
// PHP is not installed here, so the generated text is checked.
// Run: node scripts/p37/json-to-php.test.mjs
import assert from 'node:assert/strict';
const { jsonToPhpClass, jsonToPhpArray } = await import(new URL('../../app/lib/jsonToPhp.js', import.meta.url));

let passed = 0, failed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 4).join('\n    ')); } };
const usage = (out) => out.split('\n').find((l) => l.startsWith('// Usage:'));
const FLAG = 'json_decode($json, true, flags: JSON_BIGINT_AS_STRING)';

test('object with a big id: Usage decodes with JSON_BIGINT_AS_STRING', () => {
  const out = jsonToPhpClass('{"id": 12345678901234567890, "n": "x"}');
  assert.match(out, /public string \$id,/);
  assert.ok(usage(out).includes(FLAG), usage(out));
});
test('array of objects with a big number nested deep: same flag in the array_map Usage', () => {
  const out = jsonToPhpClass('[{"a": {"b": [ -9223372036854775809 ]}}, {"a": {"b": []}}]');
  assert.ok(usage(out).includes(FLAG), usage(out));
  assert.ok(usage(out).startsWith('// Usage: $items = array_map('), usage(out));
});
test('big number: a comment says why the property is a string', () => {
  const out = jsonToPhpClass('{"id": 12345678901234567890}');
  assert.ok(/PHP_INT_MAX/.test(out.split('\n').filter((l) => l.startsWith('//')).join('\n')), out.split('\n').slice(0, 5).join('\n'));
});
test('PHP_INT_MAX itself fits: int, plain Usage, no comment', () => {
  const out = jsonToPhpClass('{"id": 9223372036854775807, "m": -9223372036854775808}');
  assert.match(out, /public int \$id,/);
  assert.equal(usage(out), '// Usage: $root = Root::fromArray(json_decode($json, true));');
  assert.ok(!/PHP_INT_MAX/.test(out));
});
test('a big number inside a string is not a number: plain Usage', () => {
  const out = jsonToPhpClass('{"id": "12345678901234567890"}');
  assert.equal(usage(out), '// Usage: $root = Root::fromArray(json_decode($json, true));');
});
test('PHP array mode unchanged (string literal and its comment)', () => {
  const out = jsonToPhpArray('{"id": 12345678901234567890}');
  assert.match(out, /'id' => '12345678901234567890',/);
  assert.match(out, /JSON_BIGINT_AS_STRING/);
});
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;

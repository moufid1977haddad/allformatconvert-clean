// Tests for app/lib/jsonLossless.js and app/lib/yamlJson.js (29/09).
// Oracle: the exact text written in the input (a converter must not alter a
// value), js-yaml reading our YAML back, and JSON.parse on our JSON.
// Run: node scripts/converter-tests/01-json-yaml.mjs
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
const { parseJsonLossless, LosslessNumber } = await import(new URL('../../app/lib/jsonLossless.js', import.meta.url));
const { jsonToYaml, yamlToJson } = await import(new URL('../../app/lib/yamlJson.js', import.meta.url));

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e); process.exitCode = 1; } };

const SRC = '\uFEFF{"id": 12345678901234567890, "price": 1.10, "big": 1e400, "n": -3, "f": 0.5, "zip": "01234", "emoji": "caf\u00e9 \ud83d\ude00", "q": "a\\"b\\\\c\\n","__proto__": {"x": 1}, "empty": [], "nested": {"list": [1, 2.50, true, null]}}';

test('lossless parse keeps 64-bit ids, 1.10, 1e400; plain numbers stay numbers; BOM accepted', () => {
  const v = parseJsonLossless(SRC);
  assert.ok(v.id instanceof LosslessNumber); assert.equal(v.id.source, '12345678901234567890');
  assert.equal(v.price.source, '1.10'); assert.equal(v.big.source, '1e400');
  assert.equal(v.n, -3); assert.equal(v.f, 0.5); assert.equal(v.zip, '01234');
  assert.deepEqual(Object.keys(v), ['id', 'price', 'big', 'n', 'f', 'zip', 'emoji', 'q', '__proto__', 'empty', 'nested']);
  assert.equal(v.q, 'a"b\\c\n');
});
test('invalid JSON still throws the parser error', () => {
  assert.throws(() => parseJsonLossless('{"a":1,}'));
  assert.throws(() => parseJsonLossless(''));
});
test('JSON to YAML writes every number exactly and reads back', () => {
  const out = jsonToYaml(SRC);
  for (const lit of ['12345678901234567890', '1.10', '1e400', '2.50']) assert.ok(out.includes(lit), lit + '\n' + out);
  const back = yaml.load(out);
  assert.equal(back.zip, '01234'); assert.equal(back.emoji, 'caf\u00e9 \ud83d\ude00'); assert.equal(back.q, 'a"b\\c\n');
  assert.deepEqual(back.nested.list, [1, 2.5, true, null]);
});
test('JSON to YAML keeps strings that look like other types quoted', () => {
  const out = jsonToYaml('{"a":"yes","b":"123","c":"null","d":"2024-01-01","e":"-"}');
  const back = yaml.load(out);
  assert.deepEqual(back, { a: 'yes', b: '123', c: 'null', d: '2024-01-01', e: '-' });
});
test('YAML to JSON: dates stay text, big ints exact, hex/octal per YAML 1.2', () => {
  const out = yamlToJson('d: 2024-01-01\nid: 12345678901234567890\nneg: -98765432109876543210\nh: 0x1F\no: 0o17\nzip: "01234"\nt: true\nn: ~\nf: 1.5\n');
  assert.ok(out.includes('"d": "2024-01-01"'), out);
  assert.ok(out.includes('"id": 12345678901234567890'), out);
  assert.ok(out.includes('"neg": -98765432109876543210'), out);
  const back = JSON.parse(out);
  assert.equal(back.h, 31); assert.equal(back.o, 15); assert.equal(back.zip, '01234'); assert.equal(back.t, true); assert.equal(back.n, null); assert.equal(back.f, 1.5);
});
test('YAML to JSON: several documents become an array', () => {
  assert.deepEqual(JSON.parse(yamlToJson('a: 1\n---\na: 2\n')), [{ a: 1 }, { a: 2 }]);
});
test('YAML to JSON: .inf and .nan are refused with a clear message, not turned into null', () => {
  assert.throws(() => yamlToJson('x:\n  y: .inf\n'), /x\.y is \.inf/);
  assert.throws(() => yamlToJson('- .nan\n'), /\.nan/);
});
test('YAML to JSON: multi-line strings, comments, CRLF, emoji, anchors', () => {
  const out = JSON.parse(yamlToJson('# c\r\na: |\r\n  l1\r\n  l2\r\nb: >\r\n  x\r\n  y\r\ne: "\\U0001F600"\r\nbase: &b {k: 1}\r\nref: *b\r\n'));
  assert.equal(out.a, 'l1\nl2\n'); assert.equal(out.b, 'x y\n'); assert.equal(out.e, '\ud83d\ude00'); assert.deepEqual(out.ref, { k: 1 });
});
test('YAML to JSON: empty input gives null, duplicate keys refused', () => {
  assert.equal(yamlToJson(''), 'null');
  assert.throws(() => yamlToJson('a: 1\na: 2\n'));
});
console.log(`${passed} passed`);

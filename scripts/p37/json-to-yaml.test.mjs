// P37 lot 1 — JSON to YAML: keys in the order of the JSON source. Before: keys that are whole numbers came first,
// in numeric order (JavaScript object key order).
// Oracle: the source order, as Python's json.loads keeps it; js-yaml reading the YAML back must give the same data.
// Run: node scripts/p37/json-to-yaml.test.mjs
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
const { jsonToYaml } = await import(new URL('../../app/lib/yamlJson.js', import.meta.url));

let passed = 0, failed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 8).join('\n    ')); } };

test('top level: name, 10, 2 in source order, numeric keys quoted', () => {
  assert.equal(jsonToYaml('{"name": "a", "10": "x", "2": "y"}'), "name: a\n'10': x\n'2': 'y'\n");
});
test('nested and inside arrays', () => {
  const out = jsonToYaml('{"list": [{"b": 1, "1": 2}], "obj": {"z": true, "0": null}}');
  assert.equal(out, "list:\n  - b: 1\n    '1': 2\nobj:\n  z: true\n  '0': null\n");
});
test('round trip: js-yaml reads back the same data', () => {
  const src = '{"name": "a", "10": {"3": [1, {"9": "q", "k": 2}]}, "2": "y", "x y": "1"}';
  assert.deepEqual(yaml.load(jsonToYaml(src)), JSON.parse(src));
});
test('repeated key: last value, first position', () => {
  assert.equal(jsonToYaml('{"a": 1, "5": 2, "a": 3}'), "a: 3\n'5': 2\n");
});
test('unchanged: exact numbers, quoted strings, "__proto__" key', () => {
  assert.equal(jsonToYaml('{"id": 12345678901234567890, "p": 1.10, "s": "yes", "__proto__": 1}'), "id: 12345678901234567890\np: 1.10\ns: 'yes'\n__proto__: 1\n");
});
test('a key that looks like a big number or a negative is not reordered either', () => {
  assert.equal(jsonToYaml('{"b": 1, "-1": 2, "4294967295": 3, "1": 4}'), "b: 1\n'-1': 2\n'4294967295': 3\n'1': 4\n");
});
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;

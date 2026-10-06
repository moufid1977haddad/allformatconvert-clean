// P37 lot 1 — JSON to CSV: columns in the order of the JSON source. Before: keys that are whole numbers ("2", "10")
// came first, in numeric order, because a JavaScript object lists integer-like keys first.
// Oracle: the source order, as Python's json.loads (dict keeps insertion order) + csv.DictWriter gives it.
// Run: node scripts/p37/json-to-csv.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const { jsonToCsv } = await import(new URL('../../app/lib/jsonToCsv.js', import.meta.url));

let passed = 0, failed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 6).join('\n    ')); } };
// Python oracle for flat rows: header = keys in first-seen order, as json.loads keeps them.
const pyHeader = (json) => execFileSync('python', ['-I', '-c', 'import json,sys\nrows=json.loads(sys.stdin.read())\nrows=rows if isinstance(rows,list) else [rows]\nh=[]\nfor r in rows:\n  for k in r:\n    if k not in h: h.append(k)\nprint(",".join(h))'], { input: json, encoding: 'utf8' }).trim();

test('flat row: "name","2024","10","2" stay in source order', () => {
  const src = '[{"name": "Ann", "2024": 5, "10": "x", "2": "y"}]';
  const out = jsonToCsv(src);
  assert.equal(out.split('\n')[0], pyHeader(src));
  assert.equal(out, 'name,2024,10,2\nAnn,5,x,y');
});
test('several rows: first-seen order across rows, integer keys included', () => {
  const src = '[{"b": 1, "1": 2}, {"0": 3, "b": 4, "a": 5}]';
  assert.equal(jsonToCsv(src).split('\n')[0], pyHeader(src));
  assert.equal(jsonToCsv(src), 'b,1,0,a\n1,2,,\n4,,3,5');
});
test('nested object with integer keys flattened in source order', () => {
  const out = jsonToCsv('[{"id": "a", "scores": {"z": 1, "3": 2, "1": 3}}]');
  assert.equal(out.split('\n')[0], 'id,scores.z,scores.3,scores.1');
});
test('repeated key: last value, first position (as JSON.parse and json.loads)', () => {
  assert.equal(jsonToCsv('{"a": 1, "5": 2, "a": 3}'), 'a,5\n3,2');
});
test('unchanged: exact numbers, arrays, empty {} column, plain values', () => {
  assert.equal(jsonToCsv('[{"id": 12345678901234567890, "p": 1.10, "t": [1, 2], "e": {}}]'), 'id,p,t.0,t.1,e\n12345678901234567890,1.10,1,2,{}');
  assert.equal(jsonToCsv('[1, "a"]'), 'value\n1\na');
  assert.equal(jsonToCsv('{"__proto__": 1, "x": 2}'), '__proto__,x\n1,2');
});
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;

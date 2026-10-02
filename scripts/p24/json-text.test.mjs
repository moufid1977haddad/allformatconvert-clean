// P24: JSON Formatter's error position and lossless key sort. Usage: node scripts/p24/json-text.test.mjs
import assert from 'node:assert/strict';
import { jsonErrorPosition, sortJsonKeys, reformatJson } from '../../app/lib/jsonText.js';
for (const ok of ['{}', '[]', String.raw`{"a":[1,2,{"b":null}],"c":"xé\n"}`, ' 12.5e-3 ', '"s"', 'true']) assert.equal(jsonErrorPosition(ok), null, ok);
assert.deepEqual(jsonErrorPosition('{\n  "a": 1,\n  "b": }'), { line: 3, column: 8, offset: 19 });
assert.deepEqual(jsonErrorPosition('{"a":1,}'), { line: 1, column: 8, offset: 7 });
assert.deepEqual(jsonErrorPosition("{'a':1}"), { line: 1, column: 2, offset: 1 });
assert.equal(jsonErrorPosition('[1,2]x')?.offset, 5);
for (const bad of ['{"a":01}', '[1,]', '"\t"', '{"a" 1}', 'nul', '"x\n"']) assert.ok(jsonErrorPosition(bad), bad);
// agrees with JSON.parse on what is valid
for (const t of ['{"a":01}', '[1,]', '{"a":1}', '[]', '"\\u12"', '"\\u1234"', '-0.5e+2', '1.', '.5']) {
  let valid = true; try { JSON.parse(t); } catch { valid = false; }
  assert.equal(jsonErrorPosition(t) === null, valid, t);
}
assert.equal(await sortJsonKeys('{"b":12345678901234567890,"a":{"d":1.10,"c":[2,1]}}'), '{"a":{"c":[2,1],"d":1.10},"b":12345678901234567890}');
assert.equal(reformatJson('{"a":[1]}', '\t'), '{\n\t"a": [\n\t\t1\n\t]\n}');
console.log('json-text: all passed');

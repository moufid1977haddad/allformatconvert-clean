// P37 lot 1 — JSON to Python: the generated file must be valid Python and must not carry a false note.
// Before: a whole number beyond 64 bits made the output start with "// Note: ... typed as a float here",
// a SyntaxError in Python, and false (the field is typed int, and Python's int and json.loads keep every digit).
// Oracle: Python itself (py_compile on model.py, json.loads on the big number).
// Run: node scripts/p37/json-to-python.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const { jsonToCode } = await import(new URL('../../app/lib/jsonCodegen.js', import.meta.url));

let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 6).join('\n    ')); } };
const dir = mkdtempSync(join(tmpdir(), 'p37-py-'));
const py = (code) => execFileSync('python', ['-I', '-c', code], { encoding: 'utf8' }).trim();

const BIG = '{"id": 12345678901234567890, "neg": -98765432109876543210, "name": "x"}';
await test('beyond 64 bits: model.py compiles (py_compile)', async () => {
  const out = await jsonToCode(BIG, 'python');
  const f = join(dir, 'model.py');
  writeFileSync(f, out);
  try { execFileSync('python', ['-I', '-m', 'py_compile', f], { encoding: 'utf8', stdio: 'pipe' }); }
  catch (e) { throw new Error('py_compile failed:\n' + out.split('\n')[0] + '\n' + String(e.stderr).trim().split('\n').slice(-2).join('\n')); }
});
await test('beyond 64 bits: no // comment and no false "typed as a float" note', async () => {
  const out = await jsonToCode(BIG, 'python');
  assert.ok(!/^\s*\/\//m.test(out), 'a line starts with //: ' + out.split('\n')[0]);
  assert.ok(!/typed as a float/.test(out), 'says "typed as a float"');
  assert.match(out, /^\s+id: int$/m);
  assert.match(out, /^\s+neg: int$/m);
});
await test('Python keeps the digits: json.loads gives an exact int (why int is right)', () => {
  assert.equal(py('import json;print(json.loads(\'{"id": 12345678901234567890}\')["id"])'), '12345678901234567890');
});
await test('the dataclass built from json.loads holds the exact value', async () => {
  const out = await jsonToCode(BIG, 'python');
  const f = join(dir, 'model2.py');
  writeFileSync(f, out + '\nimport json\nd = json.loads(\'' + BIG + '\')\nr = Root(**d)\nprint(r.id, r.neg)\n');
  assert.equal(execFileSync('python', ['-I', f], { encoding: 'utf8' }).trim(), '12345678901234567890 -98765432109876543210');
});
await test('other languages keep their note (C-style comment, Go/TS/Rust/C#)', async () => {
  for (const t of ['typescript', 'go', 'csharp', 'rust']) {
    const out = await jsonToCode(BIG, t);
    assert.ok(out.startsWith('// Note: 2 whole numbers are beyond 64 bits'), t + ': ' + out.split('\n')[0]);
  }
});
await test('no big number: output unchanged and compiles', async () => {
  const out = await jsonToCode('{"a": 1, "b": "x"}', 'python');
  assert.ok(out.startsWith('from dataclasses import dataclass'));
  const f = join(dir, 'model3.py'); writeFileSync(f, out);
  execFileSync('python', ['-I', '-m', 'py_compile', f]);
});
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;

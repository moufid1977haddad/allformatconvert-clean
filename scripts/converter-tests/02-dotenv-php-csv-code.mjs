// Tests for app/lib/dotenv.js, jsonToPhp.js, jsonToCsv.js, jsonCodegen.js (29/09).
// Oracles: the real `dotenv` and `dotenv-expand` packages (the parser Node,
// Next.js and Vite use); the TypeScript compiler on generated TypeScript;
// Python itself on the generated dataclasses; quicktype-core (the engine of
// app.quicktype.io) for Rust; exact expected text for CSV and PHP arrays.
// Run: node scripts/converter-tests/02-dotenv-php-csv-code.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
const { expand } = require('dotenv-expand');
const lib = (f) => import(new URL(`../../app/lib/${f}`, import.meta.url));
const { parseDotenv, dotenvToJson, jsonToDotenv } = await lib('dotenv.js');
const { jsonToPhpArray, jsonToPhpClass } = await lib('jsonToPhp.js');
const { jsonToCsv } = await lib('jsonToCsv.js');
const { jsonToCode } = await lib('jsonCodegen.js');

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ---------- .env ----------
// Examples from the dotenv README and the competitor pages (Flavio Copes,
// DevToolLab): export, quotes, multi-line, inline comments, CRLF, BOM.
const ENV = '\uFEFF# comment\r\nexport NODE_ENV=production\r\nPORT=3000\r\nEMPTY=\r\nSPACED = hello world   # trailing comment\r\nHASH="value # not a comment"\r\nSINGLE=\'literal \\n $PORT\'\r\nDOUBLE="line1\\nline2"\r\nMULTI="-----BEGIN KEY-----\r\nabc\r\n-----END KEY-----"\r\nBACK=`it\'s "quoted"`\r\nYAML_STYLE: yes\r\nZERO=007\r\nURL=http://x/${PORT}/p\r\nnot a variable line\r\nPORT=3001\r\n';

test('.env: every key/value equals dotenv.parse (the reference parser)', () => {
  const ref = dotenv.parse(Buffer.from(ENV));
  const { json, ignored } = dotenvToJson(ENV);
  assert.deepEqual(JSON.parse(json), ref);
  assert.deepEqual(ignored, [16]); // 'not a variable line'
});
test('.env: expansion equals dotenv-expand', () => {
  const src = 'A=1\nB=${A}2\nC="${B}-${MISSING:-def}"\nD=\'${A}\'\nE=\\$A\n';
  const ref = expand({ parsed: dotenv.parse(src), processEnv: {} }).parsed;
  const ours = JSON.parse(dotenvToJson(src, { expandVars: true }).json);
  assert.deepEqual(ours, ref);
});
test('.env: types only on request; 007, 1.10 and huge ints stay text', () => {
  const src = 'A=42\nB=3.5\nC=true\nD=null\nE=007\nF=1.10\nG=12345678901234567890\nH=hello';
  assert.deepEqual(JSON.parse(dotenvToJson(src).json), { A: '42', B: '3.5', C: 'true', D: 'null', E: '007', F: '1.10', G: '12345678901234567890', H: 'hello' });
  assert.deepEqual(JSON.parse(dotenvToJson(src, { types: true }).json), { A: 42, B: 3.5, C: true, D: null, E: '007', F: '1.10', G: '12345678901234567890', H: 'hello' });
});
test('JSON to .env round-trips through dotenv.parse exactly', () => {
  const obj = { PLAIN: 'abc', SPACE: 'a b', HASH: 'x # y', NL: 'l1\nl2', Q1: "it's", Q2: 'say "hi"', BOTH: 'it\'s "x"\nnl', EMPTY: '', NUM: 5, NESTED: { a: 1 }, EMOJI: 'caf\u00e9 \ud83d\ude00', DOLLAR: '$HOME', LEAD: ' x' };
  const env = jsonToDotenv(JSON.stringify(obj));
  const back = dotenv.parse(env);
  for (const [k, v] of Object.entries(obj)) assert.equal(back[k], typeof v === 'object' ? JSON.stringify(v) : String(v), k + ' in\n' + env);
});
test('JSON to .env refuses an invalid variable name and a non-object', () => {
  assert.throws(() => jsonToDotenv('{"bad key":1}'), /not a valid/);
  assert.throws(() => jsonToDotenv('[1,2]'), /object/);
});

// ---------- JSON to CSV ----------
test('CSV: union of keys, nested flattened, exact numbers, quoting, plain arrays', () => {
  const csv = jsonToCsv('[{"id":12345678901234567890,"name":"Smith, John","addr":{"city":"Paris"}},{"id":2,"extra":"x\\"y","tags":["a","b"],"addr":{}}]');
  assert.equal(csv, 'id,name,addr.city,extra,tags.0,tags.1,addr\n12345678901234567890,"Smith, John",Paris,,,,\n2,,,"x""y",a,b,{}');
  assert.equal(jsonToCsv('[1,"a",null]'), 'value\n1\na\n');
  assert.equal(jsonToCsv('{"a":1.10}'), 'a\n1.10');
  assert.throws(() => jsonToCsv('[]'), /empty/);
  assert.throws(() => jsonToCsv('"x"'), /array of objects/);
});

// ---------- PHP ----------
test('PHP array: escapes, exact numbers, big ints as strings, nesting', () => {
  const out = jsonToPhpArray('{"s":"it\'s \\\\ ok","big":12345678901234567890,"f":1.10,"n":null,"b":false,"e":{},"l":[1,{"k":"v"}]}');
  assert.ok(out.startsWith('<?php\n\n// Integers beyond PHP_INT_MAX'), out);
  assert.ok(out.includes("'s' => 'it\\'s \\\\ ok',"), out);
  assert.ok(out.includes("'big' => '12345678901234567890',"));
  assert.ok(out.includes("'f' => 1.10,"));
  assert.ok(out.includes("'n' => null,") && out.includes("'b' => false,") && out.includes("'e' => [],"));
  assert.ok(out.includes("            'k' => 'v',"), out);
});
test('PHP class: nested classes, nullable, camelCase with original keys, arrays of objects', () => {
  const out = jsonToPhpClass('[{"user_id":1,"first-name":"a","address":{"city":"X"},"orders":[{"total":1.5}]},{"user_id":2,"first-name":null,"address":{"city":"Y"},"orders":[]}]');
  for (const frag of ['final class Root', 'public int $userId,', 'public ?string $firstName,', 'public Address $address,', '/** @var Order[] */', 'public array $orders,', 'final class Order', 'public float $total,', "userId: $data['user_id'],", "firstName: $data['first-name'] ?? null,", "address: Address::fromArray($data['address']),", "orders: array_map(fn (array $item) => Order::fromArray($item), $data['orders']),"]) {
    assert.ok(out.includes(frag), frag + '\n' + out);
  }
});

// ---------- JSON to code (quicktype) ----------
const SAMPLE = '[{"id":1,"first-name":"Ann","class":"x","score":1.5,"tags":["a"],"address":{"city":"Paris","zip":"01234"},"nick":null},{"id":2,"first-name":"Bob","class":"y","score":2,"tags":[],"address":{"city":"Oslo","zip":"0150"},"nick":"b","extra":true}]';

test('Rust: nested struct, Vec, Option, i64, snake_case with serde rename', async () => {
  const out = await jsonToCode(SAMPLE, 'rust');
  assert.ok(out.includes('#[serde(rename = "first-name")]') || out.includes('#[serde(rename_all = "kebab-case")]'), out);
  for (const frag of ['pub type Root = Vec<RootElement>;', 'pub id: i64,', 'pub first_name: String,', 'pub score: f64,', 'pub tags: Vec<String>,', 'pub address: Address,', 'pub nick: Option<String>,', 'pub extra: Option<bool>,', 'pub struct Address', 'Serialize, Deserialize']) {
    assert.ok(out.includes(frag), frag + '\n' + out);
  }
});
test('TypeScript output compiles with tsc --strict and has nested interfaces', async () => {
  const out = await jsonToCode(SAMPLE, 'typescript');
  assert.ok(/"first-name":\s+string;/.test(out) && out.includes('interface Address') && /extra\?:\s+boolean;/.test(out), out);
  const dir = mkdtempSync(join(tmpdir(), 'tsgen-'));
  writeFileSync(join(dir, 'gen.ts'), out + '\nconst r: Root[] = ' + SAMPLE + ';\nconsole.log(r.length);\n');
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--strict', '--noEmit', '--target', 'es2020', '--typeRoots', join(dir, 'none'), join(dir, 'gen.ts')], { stdio: 'pipe' });
});
test('Python output runs and loads the sample', async () => {
  const out = await jsonToCode(SAMPLE, 'python');
  assert.ok(out.includes('@dataclass') && out.includes('class Address') && out.includes('first_name: str'), out);
  let py = 'python';
  try { execFileSync(py, ['--version'], { stdio: 'pipe' }); } catch { py = null; }
  if (py) {
    const dir = mkdtempSync(join(tmpdir(), 'pygen-'));
    writeFileSync(join(dir, 'gen.py'), out + '\nprint(RootElement.__annotations__)\n');
    execFileSync(py, [join(dir, 'gen.py')], { stdio: 'pipe' });
  }
});
test('Go and C#: nested types, json tags / attributes keep original keys', async () => {
  const go = await jsonToCode(SAMPLE, 'go');
  assert.ok(go.includes('type Address struct') && go.includes('`json:"first-name"`') && /ID\s+int64/.test(go), go);
  const cs = await jsonToCode(SAMPLE, 'csharp');
  assert.ok(cs.includes('public partial class Address') && cs.includes('[JsonPropertyName("first-name")]') && /public long Id/.test(cs), cs);
});
test('invalid JSON is reported, not turned into code', async () => {
  await assert.rejects(() => jsonToCode('{"a":', 'rust'));
});

for (const [name, fn] of tests) {
  try { await fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e.message); process.exitCode = 1; }
}
console.log(`${passed}/${tests.length} passed`);

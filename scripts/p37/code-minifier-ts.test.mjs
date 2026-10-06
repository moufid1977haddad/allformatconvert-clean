// P37 suites -- Code Minifier, TS mode. Before: the page ran Sucrase with the typescript transform only, then Terser.
// - A namespace holding values (namespace A { export const x = 1 }) was removed with its code, without a word:
//   the minified file then threw "A is not defined" when run.
// - TSX failed with Sucrase's bare "Unexpected token" message.
// After: TS mode uses convertTypescript (app/lib/typescriptToJs.js), the code of the TypeScript to JS page, then Terser.
// Oracle: TypeScript's own transpiler (ts.transpileModule); outputs are run in a vm context and must print the same.
// Run: node scripts/p37/code-minifier-ts.test.mjs
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
const t = await import(new URL('../../app/lib/codeTools.js', import.meta.url));
// Before the fix the page called minifyJs(await typescriptToJs(input)).
const minifyTs = t.minifyTypescript || (async (code) => t.minifyJs(await t.typescriptToJs(code)));

let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n   ', String(e.message).split('\n').slice(0, 4).join('\n    ')); } };
const tsc = (code) => ts.transpileModule(code, { fileName: 'a.ts', compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
const run = (js) => { const lines = []; try { vm.runInNewContext(js, { console: { log: (...a) => lines.push(a.map(String).join(' ')) } }); } catch (e) { lines.push('THROWS ' + e.constructor.name + ': ' + e.message); } return lines.join(' | '); };
const err = async (code) => { try { const out = await minifyTs(code); return 'NO ERROR, output: ' + out; } catch (e) { return e.message; } };

await test('namespace with code: refused, the message names it', async () => {
  const m = await err('namespace A { export const x = 1; export function f() { return x + 1; } }\nconsole.log(A.x, A.f());');
  assert.match(m, /namespace "A" \(line 1\) contains code/);
});
await test('nested namespace with code: refused with its full name', async () => {
  const m = await err('const k: number = 1;\nnamespace Outer.Inner { export const v = 2; }\nconsole.log(Outer.Inner.v + k);');
  assert.match(m, /namespace "Outer\.Inner" \(line 2\)/);
});
await test('namespace with types only, and declare namespace: removed, output runs like tsc', async () => {
  const code = 'namespace T { export interface I { a: number } }\ndeclare namespace D { const y: number }\nconst o: T.I = { a: 4 };\nconsole.log(o.a * 2);';
  assert.equal(run(await minifyTs(code)), run(tsc(code)));
  assert.equal(run(await minifyTs(code)), '8');
});
await test('TSX: clear message about JSX, not a bare Unexpected token', async () => {
  const m = await err('const C = (p: { n: string }) => <div className="a">{p.n}</div>;');
  assert.match(m, /JSX/);
  assert.doesNotMatch(m, /^Unexpected token/);
});
await test('old-style casts <number>x still minified, same output as tsc', async () => {
  const code = 'const z: unknown = "5";\nconst y = <number>(<any>z) * 2;\nconsole.log(y);';
  assert.equal(run(await minifyTs(code)), run(tsc(code)));
});
await test('plain TypeScript: interfaces, generics, enum, same output as tsc', async () => {
  const code = 'interface P { a: number }\nconst o: P = { a: 1 };\nfunction f<T>(x: T, y?: number): T { return y ? x : x; }\nenum E { A, B }\nconsole.log(o.a, f<string>("s"), E.B);';
  const out = await minifyTs(code);
  assert.equal(run(out), run(tsc(code)));
  assert.ok(out.length < code.length, out);
});
await test('syntax error: still an error', async () => {
  await assert.rejects(() => minifyTs('let x: = ;'));
});
console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;

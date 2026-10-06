// P37 lot 1 -- TypeScript to JS: app/lib/typescriptToJs.js (the code the page runs).
//   node scripts/p37/typescript-to-js.test.mjs
// Oracle: TypeScript's own transpiler (ts.transpileModule, devDependency `typescript`). Where both outputs
// are runnable, each is run in a fresh vm context and the printed values must be identical.
import vm from 'node:vm';
import ts from 'typescript';
const { convertTypescript } = await import(new URL('../../app/lib/typescriptToJs.js', import.meta.url));
let fail = 0;
const ok = (cond, label, detail = '') => { console.log(`${cond ? 'PASS' : 'FAIL'} ${label}${detail ? ' -- ' + detail : ''}`); if (!cond) fail++; };
const conv = async (code) => { try { return { out: await convertTypescript(code) }; } catch (e) { return { err: e.message }; } };
const tsc = (code, tsx = false) => ts.transpileModule(code, { fileName: tsx ? 'a.tsx' : 'a.ts', compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve } }).outputText;
const run = (js) => { const lines = []; try { vm.runInNewContext(js, { console: { log: (...a) => lines.push(a.map(String).join(' ')) } }); } catch (e) { lines.push('THROWS ' + e.constructor.name + ': ' + e.message); } return lines.join(' | '); };
const short = (s) => JSON.stringify(s.length > 90 ? s.slice(0, 90) + '…' : s);

// 1. JSX is recognized wherever it is written, not only after `return`.
const JSX = [
  ['arrow without return', 'const C = (p: { n: string }) => <div className="a">{p.n}</div>;', '<div className="a">{p.n}</div>'],
  ['JSX in a variable', 'const el: JSX.Element = <span id="x" />;', '<span id="x" />'],
  ['fragment as an argument', 'render(<><b>hi</b></>, root as HTMLElement);', '<><b>hi</b></>'],
  ['generic arrow + JSX', 'const id = <T,>(x: T) => x;\nconst C = () => <p>{id<string>("a")}</p>;', '<p>{id("a")}</p>'],
  ['return (<div>) still works', 'function C(): JSX.Element { return (<div>ok</div>); }', '<div>ok</div>'],
];
for (const [label, code, expect] of JSX) {
  const { out, err } = await conv(code);
  const flat = (x) => x.replace(/\s+/g, ''); // tsc reprints `<span />` as `<span/>`
  ok(out !== undefined && flat(out).includes(flat(expect)) && flat(tsc(code, true)).includes(flat(expect)), `JSX: ${label}`, err || short(out));
}
// 2. Old-style casts in a .ts file keep working (they are not JSX).
for (const code of ['const z: unknown = "5";\nconst y = <number>(<any>z) * 2;\nconsole.log(y);', 'const a = <string>"x"; console.log(a.length);']) {
  const { out, err } = await conv(code);
  ok(out !== undefined && run(out) === run(tsc(code)), `cast without JSX: ${short(code)}`, err || run(out));
}
// 3. Namespaces with values are compiled by tsc; this tool must never drop them silently:
//    either the output runs like tsc's, or the conversion stops with a message naming the namespace.
const NS = [
  'namespace A { export const x = 1; export function f() { return x + 1; } }\nconsole.log(A.x, A.f());',
  'namespace Outer.Inner { export const v = 2; }\nconsole.log(Outer.Inner.v);',
  'module M { export let q = 3; }\nconsole.log(M.q);',
  'namespace T { export interface I { a: number } }\nnamespace V { export enum E { A } }\nconsole.log(V.E.A);',
  'declare namespace D { const y: number }\nnamespace W { console.log("side effect"); }',
];
for (const code of NS) {
  const { out, err } = await conv(code);
  const ref = run(tsc(code));
  const good = out !== undefined ? run(out) === ref : /namespace/i.test(err) && /tsc/.test(err);
  ok(good, `namespace with values: ${short(code)}`, out !== undefined ? `ours ${run(out)} / tsc ${ref}` : err);
}
// 4. Type-only and ambient namespaces are removed, as tsc does (no false refusal).
const TYPE_ONLY = [
  'namespace T { export interface I { a: number } export type U = string; }\nconst v: T.I = { a: 1 };\nconsole.log(v.a);',
  'declare namespace D { const x: number; namespace E { const y: string } }\nconsole.log(1);',
  'declare module "m" { namespace Q { const z: 1 } }\nconsole.log(2);',
  'declare global { namespace NodeJS { interface ProcessEnv { A: string } } }\nexport {};\nconsole.log(3);',
  'export declare namespace X { function f(): void }\nconsole.log(4);',
  'namespace Empty {}\nnamespace Nested { export namespace Deeper { export type K = 1 } }\nconsole.log(5);',
];
for (const code of TYPE_ONLY) {
  const { out, err } = await conv(code);
  const runnable = (s) => s.replace(/^export \{\};?$/m, '');
  ok(out !== undefined && run(runnable(out)) === run(runnable(tsc(code))), `type-only namespace kept out: ${short(code)}`, err || run(runnable(out)));
}
// 5. The words namespace / module used as names are untouched.
{
  const code = 'const namespace = 1; const module = { exports: 2 };\nconsole.log(namespace, module.exports);';
  const { out, err } = await conv(code);
  ok(out !== undefined && run(out) === '1 2', 'namespace/module as identifiers', err || run(out));
}
// 6. Everyday TypeScript runs like tsc's output.
{
  const code = 'interface P { a: number }\nenum E { A, B = 5 }\nclass K { constructor(private n: number, public m = 2) {} get s() { return this.n + this.m; } }\nconst o = { a: 1 } satisfies P;\nconsole.log(o.a, E.B, E[5], new K(3).s, (null as any)?.x ?? "d");';
  const { out, err } = await conv(code);
  ok(out !== undefined && run(out) === run(tsc(code)), 'enum, parameter properties, satisfies, optional chaining', err || `${run(out)} / tsc ${run(tsc(code))}`);
}
// 7. A syntax error keeps its line:column.
{
  const { out, err } = await conv('const a = 1;\nconst b: = 2;');
  ok(out === undefined && /\(2:\d+\)/.test(err), 'syntax error reports line:column', err || 'converted');
}
console.log(fail ? `\n${fail} FAILED` : '\nALL PASS');
process.exit(fail ? 1 : 0);

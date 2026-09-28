// Tests for app/lib/codeTools.js (29/09). Oracle: running the code before and
// after (same console output), re-parsing the output (JS, CSS via csso, SQL
// comments kept), and known results (Sass, sucrase, Myers diff).
// Run: node scripts/converter-tests/05-code-tools.mjs
import assert from 'node:assert/strict';
const t = await import(new URL('../../app/lib/codeTools.js', import.meta.url));

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const run = (code) => { const logs = []; new Function('console', code)({ log: (...a) => logs.push(a.join(' ')) }); return logs.join('|'); };

// Cases that broke the old hand-written minifiers (measured 29/09).
const JS = [
  'let a = 1\nlet b = 2\nconsole.log(a + b)',
  'const x = 5\n;[1,2].forEach(n => console.log(n))',
  'function f() {\n  return\n  42\n}\nconsole.log(f())',
  'let s = `a  //  b\n  c`; console.log(s)',
  'let r = /a\\/\\/b/g; console.log("a//b".replace(r, "X"))',
  'let i = 1\ni\n++\ni\nconsole.log(i)',
  'let a = 1, b = 2; console.log(a - -b, a + +b)',
  'console.log("café 😀".length, 12345678901234567890n)',
];
test('JS minify: same behaviour as the source on every case', async () => {
  for (const c of JS) assert.equal(run(await t.minifyJs(c)), run(c), c);
});
test('JS minify: invalid code is an error, not a silently broken output', async () => {
  await assert.rejects(() => t.minifyJs('let = ;'));
});
test('JS beautify keeps behaviour', async () => {
  for (const c of JS) assert.equal(run(await t.beautify(c, 'js')), run(c), c);
});
test('CSS minify keeps data: URLs, strings and selectors; beautify keeps them too', async () => {
  const css = 'a{background:url(data:image/png;base64,AAA=)} /* c;{} */ b > c{content:"x ; {y}"}\n@media (min-width:1px){d{color:red}}';
  const min = await t.minifyCss(css);
  assert.ok(min.includes('url(data:image/png;base64,AAA=)') && min.includes('"x ; {y}"') && min.includes('b>c'), min);
  const pretty = await t.beautify(css, 'css');
  assert.ok(pretty.includes('url(data:image/png;base64,AAA=)') && pretty.includes('"x ; {y}"'), pretty);
});
test('HTML beautify leaves <pre> and <textarea> content untouched', async () => {
  const out = await t.beautify('<div><pre>  a\n   b</pre><textarea> t  </textarea><p>x</p></div>', 'html');
  assert.ok(out.includes('<pre>  a\n   b</pre>') && out.includes('<textarea> t  </textarea>'), out);
});
test('SQL format: keywords upper-cased, comments and strings intact', async () => {
  const out = await t.formatSql("select a, count(b, c) from t -- where x, y\nwhere s = 'O''Brien, Jr' and n in (1,2) order by a");
  assert.ok(out.includes('-- where x, y') && out.includes("'O''Brien, Jr'") && /^SELECT/.test(out) && out.includes('ORDER BY'), out);
});
test('diff: an inserted line is one addition (Myers), not a cascade', async () => {
  const d = await t.diffLines('a\nb\nc', 'x\na\nb\nc');
  assert.deepEqual(d.map((x) => x.type), ['added', 'same', 'same', 'same']);
  const d2 = await t.diffLines('a\r\nb', 'a\nb');
  assert.deepEqual(d2.map((x) => x.type), ['same', 'same']);
});
test('TypeScript to JS: types removed, object literals and ternaries intact', async () => {
  const js = await t.typescriptToJs('interface P { a: number }\ntype T = string | number;\nconst o: P = { a: 1 };\nfunction f<T>(x: T, y?: number): T { return y ? x : x; }\nenum E { A, B }\nconsole.log(o.a, f<string>("s"), E.B)');
  assert.ok(!/interface|type T|: number|<T>/.test(js), js);
  assert.equal(run(js), '1 s 1');
});
test('SCSS to CSS: variables, nesting, mixins, & compiled by Dart Sass', async () => {
  const css = await t.scssToCss('$c: #333;\n@mixin m($p) { padding: $p; }\n.a { color: $c; &:hover { color: red; } .b { @include m(2px); } }');
  assert.ok(css.includes('.a {\n  color: #333;\n}') && css.includes('.a:hover') && css.includes('.a .b {\n  padding: 2px;\n}'), css);
  await assert.rejects(() => t.scssToCss('.a { color: $undefined; }'));
});
test('Markdown to HTML: GFM tables, code, links, nested lists, escaping', async () => {
  const html = await t.markdownToHtml('# T\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```js\nx < 1\n```\n\n- a\n  - b\n\n[l](https://x.y) **b** *i*');
  for (const f of ['<h1>T</h1>', '<table>', '<td>1</td>', '<code class="language-js">x &lt; 1', '<ul>', '<a href="https://x.y">l</a>', '<strong>b</strong>', '<em>i</em>']) assert.ok(html.includes(f), f + '\n' + html);
});

for (const [name, fn] of tests) {
  try { await fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e.message); process.exitCode = 1; }
}
console.log(`${passed}/${tests.length} passed`);

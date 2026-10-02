// P25 (E4): the snapshot cannot hand Chromium anything that loads, runs or navigates — including the two parser tricks
// found by the independent review (03/10) — and stays linear on hostile CSS. node scripts/p25/snapshot.test.mjs
import assert from 'node:assert';
import { parse } from 'parse5';
import { snapshotPage, cssTokens, CSP } from '../../lib/urlFetch/snapshot.mjs';
let n = 0;
const pages = new Map();
const fetcher = async (url) => {
  const u = new URL(url, 'https://evil.example/').href;
  if (!pages.has(u)) return { url: u, status: 404, contentType: 'text/plain', body: Buffer.from('') };
  const [type, body] = pages.get(u);
  return { url: u, status: 200, contentType: type, body: Buffer.from(body, 'latin1') };
};
// Chromium's view: parsed with scripting on; nothing dangerous may be live.
function live(html) {
  const found = [];
  const walk = (x) => { if (x.tagName) {
    if (['script', 'iframe', 'object', 'embed', 'base', 'link', 'frame', 'template', 'noscript'].includes(x.tagName)) found.push(x.tagName);
    if (x.tagName === 'meta' && x.attrs.some((a) => a.name === 'http-equiv' && !/content-security-policy/i.test(a.value))) found.push('meta ' + x.attrs.map((a) => a.value).join(' '));
    for (const a of x.attrs) if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) found.push(`${x.tagName}[${a.name}]`);
  } for (const c of [...(x.childNodes || []), ...(x.content?.childNodes || [])]) walk(c); };
  walk(parse(html, { scriptingEnabled: true }));
  return found;
}
async function snap(html, extra = {}) {
  pages.clear();
  pages.set('https://evil.example/', ['text/html', html]);
  for (const [k, v] of Object.entries(extra)) pages.set(k, v);
  return snapshotPage('https://evil.example/', { fetcher });
}

// 1. A style sheet that closes its <style> and adds a meta refresh (review, critical)
let r = await snap('<!doctype html><link rel=stylesheet href="/e.css"><p>hi', { 'https://evil.example/e.css': ['text/css', 'a{}</style><meta http-equiv=refresh content="0;url=http://169.254.169.254/">'] });
assert.deepStrictEqual(live(r.html), [], 'css breakout'); n++;
// same through @import and through an inline <style>
r = await snap('<!doctype html><style>@import "/i.css";</style><p>hi', { 'https://evil.example/i.css': ['text/css', 'b{}</style><meta http-equiv=refresh content=0>'] });
assert.deepStrictEqual(live(r.html), [], 'import breakout'); n++;
// 2. <template> + <noscript> parser differential (review, critical)
r = await snap('<!doctype html><template><noscript><p title="</noscript></template><meta http-equiv=refresh content=0>"></noscript></template><p>x');
assert.deepStrictEqual(live(r.html), [], 'template/noscript mutation'); n++;
// noscript in body (scripting-off parse) then shown: no mutation either
r = await snap('<!doctype html><noscript><p title="</noscript><meta http-equiv=refresh content=0>">fallback</p></noscript>');
assert.deepStrictEqual(live(r.html), [], 'noscript attribute trick'); n++;
// Classic vectors
r = await snap(`<!doctype html><meta http-equiv="Refresh" content="0;url=http://10.0.0.1/"><META HTTP-EQUIV=refresh CONTENT=1><base href="http://10.0.0.1/">
<script>location='http://10.0.0.1'</script><iframe src="http://10.0.0.1"></iframe><object data="http://10.0.0.1"></object><embed src="x">
<a href="javascript:alert(1)" onclick="x()">a</a><a href=" java\tscript:alert(1)">b</a><img src=x onerror="x()"><svg><script>x()</script><a xlink:href="javascript:x()"><text>t</text></a><image href="http://10.0.0.1/a.png"/></svg>
<math><mtext><table><mglyph><style><img src=x onerror=alert(1)></style></table></mtext></math><form action="http://10.0.0.1"><button formaction="http://10.0.0.1">b</button></form>`);
assert.deepStrictEqual(live(r.html), [], 'classic vectors'); n++;
assert.ok(!/10\.0\.0\.1/.test(r.html.replace(/<a [^>]*>/g, '')), 'no private address left outside links'); n++;
// The CSP is the first element and precedes everything (doctype kept; comments before the doctype allowed)
r = await snap('<!-- c --><!DOCTYPE html><html><head><title>T</title></head><body>x</body></html>');
assert.ok(r.html.indexOf('Content-Security-Policy') < r.html.indexOf('<html') && /^<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy"/.test(r.html), "csp first, doctype kept, leading comment dropped"); n++;
assert.ok(r.html.includes(CSP) && r.title === 'T', 'csp content and title'); n++;
// Review 2: 2 KB of comments before the doctype — the lock stays in the first bytes; a "</head>" inside an attribute
// cannot move the page setup out of <head>, and the setup is inside the checked document.
pages.clear();
pages.set('https://evil.example/', ['text/html', `<!--${'x'.repeat(2048)}--><!doctype html><html><head><title t="</head><meta http-equiv=refresh content=0>">T</title></head><body>x</body></html>`]);
r = await snapshotPage('https://evil.example/', { fetcher, extraCss: '@page { size: A4; margin: 10mm; }' });
assert.ok(r.html.indexOf('<meta charset="utf-8">') < 100 && r.html.startsWith('<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy"'), 'lock in the first bytes'); n++;
assert.deepStrictEqual(live(r.html), [], 'attribute </head>'); n++;
assert.ok(/<head>[\s\S]*<style data-page-setup="">@page \{ size: A4; margin: 10mm; \}<\/style><\/head>/.test(r.html), 'page setup inside head'); n++;
// Resources inlined, lazy images resolved, noscript content shown
r = await snap('<!doctype html><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-src="/a.png"><div style="background:url(/b.png)">x</div><noscript><img src="/c.png"></noscript>',
  { 'https://evil.example/a.png': ['image/png', '\x89PNG....'], 'https://evil.example/b.png': ['application/octet-stream', '\x89PNG....'], 'https://evil.example/c.png': ['image/png', '\x89PNG....'] });
assert.strictEqual((r.html.match(/data:image\/png;base64/g) || []).length, 3, 'three images inlined'); n++;
// 3. Hostile CSS stays linear (review: 320 KB of "url(" took 77 s with the old regex)
for (const css of ['url('.repeat(1_250_000), 'url("'.repeat(1_000_000), '@import url('.repeat(400_000), 'url( x'.repeat(800_000)]) {
  const t = Date.now(); cssTokens(css); const ms = Date.now() - t;
  assert.ok(ms < 1500, `cssTokens ${css.slice(0, 12)}… ${css.length} chars took ${ms} ms`); n++;
}
const toks = cssTokens('a{background:url( "x.png" )} @import url(y.css) screen; @import "z.css"; b{src:url(f.woff2) format("woff2")}');
assert.deepStrictEqual(toks.map((t) => [t.type, t.value]), [['url', 'x.png'], ['import', 'y.css'], ['import', 'z.css'], ['url', 'f.woff2']], 'tokens'); n++;
// A page that is not HTML, and an error answer
pages.clear(); pages.set('https://evil.example/', ['application/pdf', '%PDF-1.7']);
await assert.rejects(snapshotPage('https://evil.example/', { fetcher }), (e) => e.code === 'not_html'); n++;
pages.clear();
await assert.rejects(snapshotPage('https://evil.example/', { fetcher }), (e) => e.code === 'http_error'); n++;
console.log(`snapshot: ${n} checks passed`);

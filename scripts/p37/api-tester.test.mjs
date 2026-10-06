// P37 lot 1 -- API Tester: the request built by app/lib/apiTesterRequest.js (the code the page runs).
//   node scripts/p37/api-tester.test.mjs
// Checks: a relative or scheme-less address is refused (the browser would resolve it against our page);
// a Content-Type typed in any capitalization replaces the default one (one header, one value).
const { buildApiRequest } = await import(new URL('../../app/lib/apiTesterRequest.js', import.meta.url));
const PAGE = 'https://www.onlineconvertools.com/tools/developer-tools/api-tester';
let fail = 0;
const ok = (cond, label, detail = '') => { console.log(`${cond ? 'PASS' : 'FAIL'} ${label}${detail ? ' -- ' + detail : ''}`); if (!cond) fail++; };
const tryBuild = (a) => { try { return { r: buildApiRequest(a) }; } catch (e) { return { err: e.message }; } };

// 1. Addresses that are not absolute http(s) URLs must be refused before fetch().
for (const url of ['/api/users', 'api.example.com/users', '127.0.0.1:8080/x', 'localhost:3000/api', 'ftp://example.com/f', '  ']) {
  const { r, err } = tryBuild({ url, method: 'GET', headersText: '{"Authorization":"Bearer t"}', body: '' });
  let where = '';
  if (r) { try { where = 'fetch would go to ' + new URL(r.url, PAGE).href; } catch { where = 'fetch would fail'; } }
  ok(Boolean(err) && /https?:\/\//.test(err), `refused: ${JSON.stringify(url)}`, err || where);
}
// 2. Absolute addresses pass unchanged (spaces around them trimmed).
for (const url of ['https://api.example.com/users?a=1', 'http://localhost:3000/api', ' https://x.test/a ']) {
  const { r, err } = tryBuild({ url, method: 'GET', headersText: '', body: '' });
  ok(r && r.url === url.trim(), `accepted: ${JSON.stringify(url)}`, err || r.url);
}
// 3. Content-Type: one header whatever its capitalization.
for (const key of ['Content-Type', 'content-type', 'CONTENT-TYPE', 'content-Type']) {
  const { r, err } = tryBuild({ url: 'https://x.test/a', method: 'POST', headersText: JSON.stringify({ [key]: 'text/plain' }), body: 'hi' });
  const h = r && new Headers(r.init.headers);
  ok(h && h.get('content-type') === 'text/plain', `user ${key} replaces the default`, err || `sent: ${h.get('content-type')}`);
}
{
  const { r } = tryBuild({ url: 'https://x.test/a', method: 'POST', headersText: '', body: '{"a":1}' });
  ok(new Headers(r.init.headers).get('content-type') === 'application/json' && r.init.body === '{"a":1}', 'body without header: application/json');
  const g = tryBuild({ url: 'https://x.test/a', method: 'GET', headersText: '{"X-A":"1"}', body: 'ignored' }).r;
  const gh = new Headers(g.init.headers);
  ok(gh.get('content-type') === null && gh.get('x-a') === '1' && g.init.body === undefined, 'GET: no body, no Content-Type, user header kept');
  const d = tryBuild({ url: 'https://x.test/a', method: 'DELETE', headersText: '{"authorization":"Bearer t"}', body: '' }).r;
  ok(new Headers(d.init.headers).get('content-type') === null && new Headers(d.init.headers).get('authorization') === 'Bearer t', 'DELETE without body: no Content-Type');
}
// 4. Headers must be a JSON object.
for (const headersText of ['[["a","b"]]', 'null', '"x"', '42']) {
  const { err } = tryBuild({ url: 'https://x.test/a', method: 'GET', headersText, body: '' });
  ok(Boolean(err) && /object/i.test(err), `headers ${headersText} refused`, err || 'accepted');
}
{
  const { err } = tryBuild({ url: 'https://x.test/a', method: 'GET', headersText: '{bad', body: '' });
  ok(Boolean(err), 'invalid JSON headers refused with the parser message', err);
}
console.log(fail ? `\n${fail} FAILED` : '\nALL PASS');
process.exit(fail ? 1 : 0);

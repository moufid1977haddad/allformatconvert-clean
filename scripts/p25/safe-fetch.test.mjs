// P25 (E4): unit checks of the SSRF guard. node scripts/p25/safe-fetch.test.mjs
// Network part: a local server on 127.0.0.1 must be refused, by IP and through a public name that redirects to it.
import assert from 'node:assert';
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { isPublicAddress, checkUrl, safeFetch, FetchRefused } = require('../../lib/urlFetch/safeFetch.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0',
  '224.0.0.1', '255.255.255.255', '198.18.0.1', '192.0.2.5', '::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', 'ff02::1',
  '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:169.254.169.254', '64:ff9b::a9fe:a9fe', '64:ff9b::10.0.0.1', '2002:7f00:1::1',
  '2001:db8::1', '2001::1', '::127.0.0.1', 'fec0::1']) ok(!isPublicAddress(ip), `must be refused: ${ip}`);
for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.215.14', '2606:4700:4700::1111', '2001:4860:4860::8888', '::ffff:8.8.8.8', '64:ff9b::808:808'])
  ok(isPublicAddress(ip), `must be allowed: ${ip}`);
for (const u of ['file:///etc/passwd', 'ftp://example.com/', 'gopher://x/', 'http://user:pw@example.com/', 'http://example.com:8080/', 'http://localhost/',
  'http://foo.internal/', 'http://[::1]/', 'http://127.1/', 'http://2130706433/', 'http://0x7f.0.0.1/', 'http://017700000001/', 'javascript:alert(1)', 'not a url'])
  assert.throws(() => checkUrl(u), FetchRefused, `must be refused: ${u}`), n++;
ok(checkUrl('https://example.com/a?b=1').href === 'https://example.com/a?b=1', 'plain https');
ok(checkUrl('http://example.com:80/').port === '', 'port 80 allowed');

// A local server: refused by address, and a redirect to it refused at the hop.
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end('<p>internal secret</p>'); });
await new Promise((res) => srv.listen(0, '127.0.0.1', res));
const port = srv.address().port;
await assert.rejects(safeFetch(`http://127.0.0.1:${port}/`), FetchRefused); n++;
await assert.rejects(safeFetch('http://localtest.me/'), (e) => e instanceof FetchRefused && e.code === 'private'); n++; // public DNS name → 127.0.0.1
// httpbin-style public redirector to a private address (each hop checked)
await assert.rejects(safeFetch('https://httpbin.org/redirect-to?url=http%3A%2F%2F169.254.169.254%2Flatest%2Fmeta-data%2F'), (e) => e instanceof FetchRefused && e.code === 'private'); n++;
srv.close();
// A real page, and the size limit on the decompressed body
const r = await safeFetch('https://example.com/', { accept: 'text/html' });
ok(r.status === 200 && /<html/i.test(r.body.toString()), 'example.com fetched');
await assert.rejects(safeFetch('https://example.com/', { maxBytes: 100 }), (e) => e.code === 'too_large'); n++;
console.log(`safe-fetch: ${n} checks passed`);

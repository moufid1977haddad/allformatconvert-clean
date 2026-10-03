// P30 lot 5: the isolated Chromium service, from outside: what it lets through and what it refuses.
//   RAILWAY_BIN=<railway.exe> node scripts/p30/isolated-probe.mjs <https://isolated-domain> <out-dir>
// The front's signing key is derived here exactly as services/gotenberg/edge/main.go does, from gotenberg-v2's Basic
// Auth credentials read through the Railway CLI (kept in this process: never printed, never written).
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [base, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const v = JSON.parse(execFileSync(process.env.RAILWAY_BIN, ['variables', '--service', 'gotenberg-v2', '--json'], { encoding: 'utf8' }));
const seed = crypto.createHash('sha256').update(Buffer.concat([Buffer.from('oct-chromium-isolated-v1'), Buffer.from([0]),
  Buffer.from(v.GOTENBERG_API_BASIC_AUTH_USERNAME), Buffer.from([0]), Buffer.from(v.GOTENBERG_API_BASIC_AUTH_PASSWORD)])).digest();
const priv = crypto.createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' });
const basic = 'Basic ' + Buffer.from(`${v.GOTENBERG_API_BASIC_AUTH_USERNAME}:${v.GOTENBERG_API_BASIC_AUTH_PASSWORD}`).toString('base64');
const sign = (method, uri, ts = Math.floor(Date.now() / 1000)) =>
  `${ts}.${crypto.sign(null, Buffer.from(`oct-edge-v1\n${ts}\n${method}\n${uri}`), priv).toString('base64url')}`;

const html = Buffer.from('<!doctype html><html><body><h1>P30 isolated probe</h1><p>printed by the isolated Chromium</p></body></html>');
const form = () => { const fd = new FormData(); fd.append('files', new Blob([html]), 'index.html'); return fd; };
let pass = 0, fail = 0;
async function check(name, method, uri, headers, expect, body) {
  const r = await fetch(base + uri, { method, headers, body: method === 'GET' ? undefined : body ?? form(), signal: AbortSignal.timeout(120_000) });
  const b = Buffer.from(await r.arrayBuffer());
  const ok = typeof expect === 'number' ? r.status === expect : expect(r, b);
  ok ? pass++ : fail++;
  console.log(ok ? 'PASS' : 'FAIL', name, r.status, b.length, 'bytes');
  return b;
}
const H = '/forms/chromium/convert/html';
await check('health is public', 'GET', '/health', {}, 200);
await check('unsigned conversion refused', 'POST', H, {}, 403);
await check("gotenberg's own Basic Auth is useless here", 'POST', H, { Authorization: basic }, 403);
await check('garbage signature refused', 'POST', H, { 'Oct-Edge-Signature': '123.abc' }, 403);
await check('expired signature refused', 'POST', H, { 'Oct-Edge-Signature': sign('POST', H, Math.floor(Date.now() / 1000) - 300) }, 403);
await check('signature of another path refused', 'POST', H, { 'Oct-Edge-Signature': sign('POST', '/forms/chromium/convert/url') }, 403);
for (const p of ['/forms/libreoffice/convert', '/forms/pdfengines/merge', '/forms/pdfengines/convert', '/version', '/debug', '/prometheus/metrics', '/'])
  await check(`signed ${p} not exposed`, p === '/version' || p === '/debug' || p.startsWith('/prom') || p === '/' ? 'GET' : 'POST', p,
    { 'Oct-Edge-Signature': sign(p === '/version' || p === '/debug' || p.startsWith('/prom') || p === '/' ? 'GET' : 'POST', p) }, 404);
const pdf = await check('signed HTML conversion', 'POST', H, { 'Oct-Edge-Signature': sign('POST', H) }, (r, b) => r.status === 200 && b.subarray(0, 5).toString() === '%PDF-');
if (pdf.subarray(0, 5).toString() === '%PDF-') fs.writeFileSync(path.join(out, 'isolated-probe.pdf'), pdf);
console.log(`isolated-probe ${base}: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

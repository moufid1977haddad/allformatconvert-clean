// P32 (04/10) — lib/pdfRender.js (the /api/pdf-render handler) against the REAL local pdf-tools service (Poppler of
// this machine) and a fake media service for the staged path. The per-visitor rate limit is an in-memory stand-in:
// this test never touches Supabase (rule of 28/08: no script writes usage_counters).
//   node scripts/p32/pdf-render-route.test.mjs
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { handlePdfRender, renderFields } = require(path.join(ROOT, 'lib', 'pdfRender.js'));
const PDF = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const PDF_BYTES = fs.readFileSync(PDF);
const which = (b) => execFileSync(process.platform === 'win32' ? 'where' : 'which', [b]).toString().split(/\r?\n/)[0].trim();
const KEY = 'p32-route-test-key';
const SERVER_TICKET = 'server-ticket-for-test';
const JID = 'b'.repeat(32);

let failures = 0, passes = 0;
const check = (name, ok, extra = '') => { if (ok) passes++; else failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

// fake media service: GET /v1/jobs/<jid>/source with the server ticket → the staged PDF
let sourceReads = 0;
const media = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === `/v1/jobs/${JID}/source` && req.headers.authorization === 'Bearer ' + SERVER_TICKET) {
    sourceReads++;
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': String(PDF_BYTES.length) });
    return res.end(PDF_BYTES);
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => media.listen(3495, '127.0.0.1', r));

const svc = spawn(process.execPath, ['src/server.js'], {
  cwd: path.join(ROOT, 'services', 'pdf-tools'),
  env: { ...process.env, PORT: '3494', API_KEYS: JSON.stringify({ [KEY]: { name: 'p32-route-test' } }), PDFTOPPM_BIN: which('pdftoppm'), PDFINFO_BIN: which('pdfinfo'), MEDIA_SERVICE_URL: 'http://127.0.0.1:3495' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const svcLog = [];
svc.stdout.on('data', (d) => svcLog.push(d.toString()));
svc.stderr.on('data', (d) => svcLog.push(d.toString()));
for (let i = 0; i < 75; i++) { try { await fetch('http://127.0.0.1:3494/health'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }

const env = { PDFTOOLS_SERVICE_URL: 'http://127.0.0.1:3494/', PDFTOOLS_API_KEY: KEY };
let counted = 0;
const allow = async () => { counted++; return { allowed: true }; };
const openStagedOk = (body) => (body.ticket === 'browser-ticket' && body.jid === JID ? { ok: true, jid: JID, serverTicket: SERVER_TICKET, maxBytes: 44 * 1024 * 1024 } : { ok: false, status: 401, error: 'This upload session is not valid or has expired. Please start again.' });
const reports = [];
const deps = (over = {}) => ({ env, rateLimit: allow, openStaged: openStagedOk, reportFailure: async (d) => { reports.push(d); }, ...over });

function direct(fields, bytes = PDF_BYTES, name = 'Relevé de compte privé.pdf') {
  const form = new FormData();
  if (bytes) form.append('file', new Blob([bytes], { type: 'application/pdf' }), name);
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  return new Request('http://localhost/api/pdf-render', { method: 'POST', body: form, headers: { 'x-real-ip': '203.0.113.7' } });
}
const stagedReq = (body) => new Request('http://localhost/api/pdf-render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

try {
  let res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg', quality: 92 }), deps());
  let buf = Buffer.from(await res.arrayBuffer());
  check('direct: page 1 JPG 150 dpi', res.status === 200 && res.headers.get('content-type') === 'image/jpeg' && buf[0] === 0xff && buf[1] === 0xd8, `${res.status} ${buf.length} B`);
  check('direct: X-Render-Dpi / Pages passed on, no-store', res.headers.get('x-render-dpi') === '150' && res.headers.get('x-render-pages') === '3' && res.headers.get('cache-control') === 'no-store');
  check('direct: the request was counted once', counted === 1, `counted=${counted}`);
  check('the visitor\'s file name is not sent to the service', !svcLog.join('').includes('Relevé'));

  counted = 0;
  res = await handlePdfRender(direct({ page: 1, dpi: 9999, format: 'jpg' }), deps());
  check('bad dpi → 400, not counted', res.status === 400 && counted === 0, (await res.json()).error);
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'webp' }), deps());
  check('format webp (not a server format) → 400', res.status === 400);
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }, null), deps());
  check('no file → 400', res.status === 400);
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }, Buffer.alloc(0)), deps());
  check('empty file → 400', res.status === 400);
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }, Buffer.alloc(4 * 1024 * 1024 + 1, 0x25)), deps());
  check('direct body over 4 MB → 413 (large-file upload)', res.status === 413 && counted === 0);
  res = await handlePdfRender(direct({ page: 9, dpi: 150, format: 'jpg' }), deps());
  check('page beyond the end → service 400 with the count, passed on', res.status === 400 && /3 pages/.test((await res.json()).error));

  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }), deps({ rateLimit: async () => ({ allowed: false, layer: 'hour', retryAfterSeconds: 1200 }) }));
  let j = await res.json();
  check('hourly limit → 429 + Retry-After + sentence', res.status === 429 && res.headers.get('retry-after') === '1200' && /this hour/.test(j.error), j.error);
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }), deps({ rateLimit: async () => ({ allowed: false, layer: 'day', retryAfterSeconds: 5000 }) }));
  j = await res.json();
  check('daily limit → 429 + sentence', res.status === 429 && /tomorrow/.test(j.error));
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }), deps({ rateLimit: async () => { throw new Error('supabase down'); } }));
  check('rate-limit backend down → 503 (fails closed, nothing sent)', res.status === 503);

  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }), deps({ env: {} }));
  check('not configured → 500 with a sentence (no silent fallback)', res.status === 500 && /not configured/.test((await res.json()).error));

  // staged path: the service reads the file from the media service itself
  counted = 0;
  res = await handlePdfRender(stagedReq({ jid: JID, ticket: 'browser-ticket', page: 2, dpi: 150, format: 'png' }), deps());
  buf = Buffer.from(await res.arrayBuffer());
  check('staged: page 2 PNG via the media service', res.status === 200 && res.headers.get('content-type') === 'image/png' && buf[0] === 0x89 && sourceReads === 1, `${res.status} ${buf.length} B reads=${sourceReads}`);
  res = await handlePdfRender(stagedReq({ jid: JID, ticket: 'browser-ticket', page: 3, dpi: 72, format: 'jpg' }), deps());
  check('staged: a second page reads the same staged file again', res.status === 200 && sourceReads === 2 && counted === 2);
  res = await handlePdfRender(stagedReq({ jid: JID, ticket: 'forged', page: 1, dpi: 150, format: 'jpg' }), deps());
  check('staged: invalid browser ticket → 401, not counted', res.status === 401 && counted === 2);
  res = await handlePdfRender(stagedReq({ jid: JID, ticket: 'browser-ticket', page: 1, dpi: 150, format: 'jpg' }), deps({ openStaged: () => ({ ok: true, jid: JID, serverTicket: SERVER_TICKET, maxBytes: 100 * 1024 * 1024 }) }));
  check('staged: ticket issued for a 100 MB purpose → 413', res.status === 413);
  res = await handlePdfRender(new Request('http://localhost/api/pdf-render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{nope' }), deps());
  check('staged: bad JSON → 400', res.status === 400);

  // service down → 502 + alert
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }), deps({ env: { PDFTOOLS_SERVICE_URL: 'http://127.0.0.1:3499', PDFTOOLS_API_KEY: KEY } }));
  check('service unreachable → 502 + alert', res.status === 502 && reports.some((r) => r.startsWith('unreachable')), reports.join(' | '));
  // service answering something that is not an image → 502
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }), deps({ fetchImpl: async () => new Response('<html>', { status: 200, headers: { 'Content-Type': 'text/html' } }) }));
  check('unexpected answer type → 502, never handed to the page', res.status === 502);
  // review 04/10: another site's form, the service's key refused, the global hourly cap
  const cross = direct({ page: 1, dpi: 150, format: 'jpg' });
  const crossReq = new Request(cross, { headers: { ...Object.fromEntries(cross.headers), 'sec-fetch-site': 'cross-site' } });
  counted = 0;
  res = await handlePdfRender(crossReq, deps());
  check('cross-site form → 403, not counted', res.status === 403 && counted === 0);
  reports.length = 0;
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }), deps({ env: { ...env, PDFTOOLS_API_KEY: 'wrong-key' } }));
  j = await res.json();
  check('service refuses our key → 500 with a neutral sentence + alert', res.status === 500 && !/API key/i.test(j.error) && reports.includes('service_refused_401'), `${j.error} | ${reports.join(',')}`);
  res = await handlePdfRender(direct({ page: 1, dpi: 150, format: 'jpg' }), deps({ rateLimit: async () => ({ allowed: false, layer: 'global', retryAfterSeconds: 900 }) }));
  check('global hourly cap → 429 + sentence', res.status === 429 && /too many pages right now/.test((await res.json()).error));
  // unit: renderFields
  check('renderFields keeps only checked fields', JSON.stringify(renderFields({ page: '2', dpi: '300', format: 'jpg', quality: '80', extra: 'x' }).fields) === JSON.stringify({ page: '2', dpi: '300', format: 'jpg', quality: '80' }));
} finally {
  svc.kill();
  media.close();
}
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);

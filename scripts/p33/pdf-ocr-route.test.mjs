// P33 (05/10) — lib/pdfOcr.js (the /api/pdf-ocr handler) against the REAL local pdf-tools service (Poppler and
// Tesseract of this machine) and a fake media service for the staged path. The per-visitor rate limit is an in-memory
// stand-in: this test never touches Supabase (rule of 28/08: no script writes usage_counters).
//   TESSDATA_PREFIX=<dir with eng, fra> node scripts/p33/pdf-ocr-route.test.mjs
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { handlePdfOcr, ocrFields } = require(path.join(ROOT, 'lib', 'pdfOcr.js'));
const { LANGUAGES } = require(path.join(ROOT, 'lib', 'ocrLanguageCodes.js'));
const PDF = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const PDF_BYTES = fs.readFileSync(PDF);
const which = (b) => execFileSync(process.platform === 'win32' ? 'where' : 'which', [b]).toString().split(/\r?\n/)[0].trim();
const TESSERACT = process.env.TESSERACT_BIN || (process.platform === 'win32' ? 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe' : 'tesseract');
const KEY = 'p33-route-test-key';
const SERVER_TICKET = 'server-ticket-for-test';
const JID = 'c'.repeat(32);

let failures = 0, passes = 0;
const check = (name, ok, extra = '') => { if (ok) passes++; else failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

let sourceReads = 0;
const media = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === `/v1/jobs/${JID}/source` && req.headers.authorization === 'Bearer ' + SERVER_TICKET) {
    sourceReads++;
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': String(PDF_BYTES.length) });
    return res.end(PDF_BYTES);
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => media.listen(3595, '127.0.0.1', r));

const svc = spawn(process.execPath, ['src/server.js'], {
  cwd: path.join(ROOT, 'services', 'pdf-tools'),
  env: { ...process.env, PORT: '3594', API_KEYS: JSON.stringify({ [KEY]: { name: 'p33-route-test' } }), PDFTOPPM_BIN: which('pdftoppm'), PDFINFO_BIN: which('pdfinfo'), TESSERACT_BIN: TESSERACT, MEDIA_SERVICE_URL: 'http://127.0.0.1:3595' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const svcLog = [];
svc.stdout.on('data', (d) => svcLog.push(d.toString()));
svc.stderr.on('data', (d) => svcLog.push(d.toString()));
for (let i = 0; i < 75; i++) { try { await fetch('http://127.0.0.1:3594/health'); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }

const env = { PDFTOOLS_SERVICE_URL: 'http://127.0.0.1:3594/', PDFTOOLS_API_KEY: KEY };
let counted = 0;
const allow = async () => { counted++; return { allowed: true }; };
const openStagedOk = (body) => (body.ticket === 'browser-ticket' && body.jid === JID ? { ok: true, jid: JID, serverTicket: SERVER_TICKET, maxBytes: 44 * 1024 * 1024 } : { ok: false, status: 401, error: 'This upload session is not valid or has expired. Please start again.' });
const reports = [];
const deps = (over = {}) => ({ env, rateLimit: allow, openStaged: openStagedOk, reportFailure: async (d) => { reports.push(d); }, ...over });

function direct(fields, bytes = PDF_BYTES, name = 'Relevé de compte privé.pdf') {
  const form = new FormData();
  if (bytes) form.append('file', new Blob([bytes], { type: 'application/pdf' }), name);
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  return new Request('http://localhost/api/pdf-ocr', { method: 'POST', body: form, headers: { 'x-real-ip': '203.0.113.7' } });
}
const stagedReq = (body) => new Request('http://localhost/api/pdf-ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

try {
  let res = await handlePdfOcr(direct({ page: 2, lang: 'eng' }), deps());
  let j = await res.json();
  check('direct: page 2 recognized (text + base64 text-only PDF)', res.status === 200 && j.ok && /photo-2\.jpg/.test(j.text) && Buffer.from(j.pdf, 'base64').subarray(0, 5).toString() === '%PDF-', `${res.status} ${JSON.stringify(j).slice(0, 160)}`);
  check('direct: only the expected fields, no-store', JSON.stringify(Object.keys(j).sort()) === JSON.stringify(['dpi', 'ok', 'pages', 'pdf', 'reduced', 'text']) && res.headers.get('cache-control') === 'no-store' && j.pages === 3 && j.dpi === 300);
  check('direct: counted once', counted === 1, `counted=${counted}`);
  check('the visitor\'s file name is not sent to the service, no recognized text in its log', !svcLog.join('').includes('Relevé') && !/photo-2|PDF avec/.test(svcLog.join('')));
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng+fra' }), deps());
  check('two languages pass', res.status === 200);

  counted = 0;
  for (const [what, fields] of [['a code not in the site list', { page: 1, lang: 'xxx' }], ['4 languages', { page: 1, lang: 'eng+fra+deu+spa' }], ['same language twice', { page: 1, lang: 'eng+eng' }], ['shell text in lang', { page: 1, lang: 'eng;ls' }], ['path in lang', { page: 1, lang: '../../etc' }], ['no lang', { page: 1 }], ['dpi 2000', { page: 1, lang: 'eng', dpi: 2000 }], ['page 0', { page: 0, lang: 'eng' }], ['page with text', { page: '1 OR 1', lang: 'eng' }]]) {
    res = await handlePdfOcr(direct(fields), deps());
    check(`${what} → 400, not counted, nothing sent`, res.status === 400 && counted === 0, `${res.status} ${(await res.json()).error}`);
  }
  res = await handlePdfOcr(direct({ page: 1, lang: 'deu' }), deps());
  j = await res.json();
  check('a site language whose model this service lacks → the service\'s 422 sentence, passed on', res.status === 422 && /no model for deu/.test(j.error), j.error);
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }, null), deps());
  check('no file → 400', res.status === 400);
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }, Buffer.alloc(0)), deps());
  check('empty file → 400', res.status === 400);
  counted = 0;
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }, Buffer.alloc(4 * 1024 * 1024 + 1, 0x25)), deps());
  check('direct body over 4 MB → 413 (large-file upload), not counted', res.status === 413 && counted === 0);
  res = await handlePdfOcr(direct({ page: 9, lang: 'eng' }), deps());
  check('page beyond the end → service 400 with the count, passed on', res.status === 400 && /3 pages/.test((await res.json()).error));

  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ rateLimit: async () => ({ allowed: false, layer: 'hour', retryAfterSeconds: 1200 }) }));
  j = await res.json();
  check('hourly limit → 429 + Retry-After + sentence', res.status === 429 && res.headers.get('retry-after') === '1200' && /this hour/.test(j.error), j.error);
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ rateLimit: async () => ({ allowed: false, layer: 'day', retryAfterSeconds: 5000 }) }));
  check('daily limit → 429 + sentence', res.status === 429 && /tomorrow/.test((await res.json()).error));
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ rateLimit: async () => ({ allowed: false, layer: 'global', retryAfterSeconds: 900 }) }));
  check('global hourly cap → 429 + sentence', res.status === 429 && /too many pages right now/.test((await res.json()).error));
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ rateLimit: async () => { throw new Error('supabase down'); } }));
  check('rate-limit backend down → 503 (fails closed, nothing sent)', res.status === 503);
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ env: {} }));
  check('not configured → 500 with a sentence (no silent fallback)', res.status === 500 && /not configured/.test((await res.json()).error));

  counted = 0;
  res = await handlePdfOcr(stagedReq({ jid: JID, ticket: 'browser-ticket', page: 3, lang: 'eng' }), deps());
  j = await res.json();
  check('staged: page 3 via the media service', res.status === 200 && /photo-3\.jpg/.test(j.text) && sourceReads === 1, `${res.status} reads=${sourceReads}`);
  res = await handlePdfOcr(stagedReq({ jid: JID, ticket: 'forged', page: 1, lang: 'eng' }), deps());
  check('staged: invalid browser ticket → 401, not counted', res.status === 401 && counted === 1);
  res = await handlePdfOcr(stagedReq({ jid: JID, ticket: 'browser-ticket', page: 1, lang: 'eng' }), deps({ openStaged: () => ({ ok: true, jid: JID, serverTicket: SERVER_TICKET, maxBytes: 100 * 1024 * 1024 }) }));
  check('staged: ticket issued for a 100 MB purpose → 413', res.status === 413);
  res = await handlePdfOcr(stagedReq({ jid: JID, ticket: 'browser-ticket', page: 1, lang: 'klingon' }), deps());
  check('staged: bad lang → 400 before the file is fetched', res.status === 400 && sourceReads === 1);
  res = await handlePdfOcr(new Request('http://localhost/api/pdf-ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{nope' }), deps());
  check('staged: bad JSON → 400', res.status === 400);

  reports.length = 0;
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ env: { PDFTOOLS_SERVICE_URL: 'http://127.0.0.1:3599', PDFTOOLS_API_KEY: KEY } }));
  check('service unreachable → 502 + alert', res.status === 502 && reports.some((r) => r.startsWith('unreachable')), reports.join(' | '));
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ fetchImpl: async () => new Response('<html>', { status: 200, headers: { 'Content-Type': 'text/html' } }) }));
  check('answer that is not the expected JSON → 502, never handed to the page', res.status === 502);
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ fetchImpl: async () => new Response(JSON.stringify({ ok: true, text: 'x', pdf: '<script>', dpi: 300 }), { status: 200, headers: { 'Content-Type': 'application/json' } }) }));
  check('answer with a pdf field that is not base64 → 502', res.status === 502);
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ fetchImpl: async () => new Response('Not Found', { status: 404 }) }));
  check('old service without the endpoint (404) → 502 + alert', res.status === 502 && reports.includes('service_has_no_ocr_endpoint'));
  const cross = direct({ page: 1, lang: 'eng' });
  counted = 0;
  res = await handlePdfOcr(new Request(cross, { headers: { ...Object.fromEntries(cross.headers), 'sec-fetch-site': 'cross-site' } }), deps());
  check('cross-site form → 403, not counted', res.status === 403 && counted === 0);
  reports.length = 0;
  res = await handlePdfOcr(direct({ page: 1, lang: 'eng' }), deps({ env: { ...env, PDFTOOLS_API_KEY: 'wrong-key' } }));
  j = await res.json();
  check('service refuses our key → 500 with a neutral sentence + alert', res.status === 500 && !/API key/i.test(j.error) && reports.includes('service_refused_401'), `${j.error} | ${reports.join(',')}`);
  check('ocrFields keeps only checked fields', JSON.stringify(ocrFields({ page: '2', lang: 'eng+fra', dpi: '300', extra: 'x' }).fields) === JSON.stringify({ page: '2', dpi: '300', lang: 'eng+fra' }));
  check(`every one of the ${LANGUAGES.length} site languages passes the route's check`, LANGUAGES.every((l) => ocrFields({ page: 1, lang: l.code }).ok));
} finally {
  svc.kill();
  media.close();
}
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);

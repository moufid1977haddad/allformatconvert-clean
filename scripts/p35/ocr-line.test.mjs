// P35 (06/10, D1) — the OCR line end to end: lib/pdfOcr.js (the /api/pdf-ocr handler) -> the REAL local pdf-tools
// service (Poppler + Tesseract of this machine), many visitors at once. The rate limit is an in-memory stand-in (no
// Supabase), no paid call.
//   TESSDATA_PREFIX=<dir with eng> node scripts/p35/ocr-line.test.mjs
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { handlePdfOcr } = require(path.join(ROOT, 'lib', 'pdfOcr.js'));
const PDF = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const PDF_BYTES = fs.readFileSync(PDF);
const which = (b) => execFileSync(process.platform === 'win32' ? 'where' : 'which', [b]).toString().split(/\r?\n/)[0].trim();
const TESSERACT = process.env.TESSERACT_BIN || (process.platform === 'win32' ? 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe' : 'tesseract');
const KEY = 'p35-line-test-key';
const PORT = 3596;

let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `— ${info}`); };

const svc = spawn(process.execPath, ['src/server.js'], {
  cwd: path.join(ROOT, 'services', 'pdf-tools'),
  // OCR_CONCURRENCY left to its default (2, the owner's decision); a short legacy wait to test the old callers
  env: { ...process.env, PORT: String(PORT), API_KEYS: JSON.stringify({ [KEY]: { name: 'p35-line-test' } }), PDFTOPPM_BIN: which('pdftoppm'), PDFINFO_BIN: which('pdfinfo'), TESSERACT_BIN: TESSERACT, OCR_QUEUE_MS: '1500', OCR_LINE_HEARTBEAT_MS: '250' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const log = [];
svc.stdout.on('data', (d) => log.push(d.toString()));
svc.stderr.on('data', (d) => log.push(d.toString()));
let health = null;
for (let i = 0; i < 75 && !health; i++) { try { health = await (await fetch(`http://127.0.0.1:${PORT}/health`)).json(); } catch { await new Promise((r) => setTimeout(r, 200)); } }
check('0 /health says 2 at a time and the line', health && health.ocr && health.ocr.concurrency === 2 && health.ocr.line === true, JSON.stringify(health && health.ocr));

const env = { PDFTOOLS_SERVICE_URL: `http://127.0.0.1:${PORT}/`, PDFTOOLS_API_KEY: KEY };
const reports = [];
const deps = { env, rateLimit: async () => ({ allowed: true }), openStaged: () => ({ ok: false, status: 400, error: 'no' }), clientKey: (r) => createHash('sha256').update(r.headers.get('x-real-ip')).digest('hex'), reportFailure: async (d) => { reports.push(d); } };

function request(ip, { line = true, signal, page = 2 } = {}) {
  const form = new FormData();
  form.append('file', new Blob([PDF_BYTES], { type: 'application/pdf' }), 'x.pdf');
  form.append('page', String(page)); form.append('lang', 'eng'); form.append('dpi', '300');
  return new Request('http://localhost/api/pdf-ocr', { method: 'POST', body: form, signal, headers: { 'x-real-ip': ip, ...(line ? { accept: 'application/x-ndjson, application/json' } : {}) } });
}

// the page's reading of the answer (same rules as app/lib/serverPageOcr.js readLine)
async function run(name, ip, opts = {}) {
  const t0 = Date.now();
  const ev = { name, ip, t0, positions: [], started: null, end: null, body: null, ndjson: false };
  const res = await handlePdfOcr(request(ip, opts), deps);
  ev.status = res.status;
  if ((res.headers.get('content-type') || '').startsWith('application/x-ndjson')) {
    ev.ndjson = true;
    // read as it arrives (each line timed); opts.leaveAfterFirstLine: the visitor closes the page while waiting
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      let value, done;
      try { ({ value, done } = await reader.read()); } catch { break; }
      if (value) buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
        if (!line) continue;
        const m = JSON.parse(line);
        if (m.queued) { if (ev.started) ev.queuedAfterStart = true; if (!ev.positions.length || ev.positions.at(-1) !== m.position) ev.positions.push(m.position); }
        else if (m.started) ev.started = Date.now();
        else ev.body = m;
      }
      if (opts.leaveAfterFirstLine && ev.positions.length && !ev.leaving) { ev.leaving = setTimeout(() => { ev.left = true; reader.cancel().catch(() => {}); }, 500); }
      if (done) break;
    }
  } else ev.body = await res.json();
  if (ev.started === null) ev.started = t0;
  ev.end = Date.now();
  return ev;
}

// 1. seven requests at once from four visitors: A×3, B×2, C, D
const t = Date.now();
const runs = await Promise.all([
  run('A1', '198.51.100.1'), run('A2', '198.51.100.1'), run('A3', '198.51.100.1'),
  run('B1', '198.51.100.2'), run('B2', '198.51.100.2'), run('C1', '198.51.100.3'), run('D1', '198.51.100.4'),
]);
for (const r of runs) console.log(`  ${r.name} ${r.ip} status ${r.status} ${r.ndjson ? 'lines' : 'json'} places [${r.positions}] start +${((r.started - t) / 1000).toFixed(1)} s end +${((r.end - t) / 1000).toFixed(1)} s ${r.body && r.body.ok ? `ok, ${r.body.text.length} chars` : JSON.stringify(r.body)}`);
const ok = runs.filter((r) => r.body && r.body.ok);
check('1a every request answered with the text (no failure, no fallback needed)', ok.length === 7, `${ok.length}/7`);
check('1b the recognized text is real (page 2 holds "photo-2")', ok.every((r) => /photo/i.test(r.body.text)), ok.map((r) => r.body.text.slice(0, 40)).join(' | '));
// overlap computed from the intervals [started, end]
const at = (ts) => runs.filter((r) => r.started <= ts && ts < r.end - 300);
const instants = runs.flatMap((r) => [r.started + 50, r.end - 400]);
const peak = Math.max(...instants.map((x) => at(x).length));
check('1c never more than 2 recognitions at a time', peak <= 2, `peak ${peak}`);
const sameKey = instants.some((x) => { const ips = at(x).map((r) => r.ip); return new Set(ips).size !== ips.length; });
check('1d never 2 at a time for one visitor', !sameKey);
const waited = runs.filter((r) => r.positions.length);
check('1e the requests that waited were told their place (5 of 7)', waited.length === 5, waited.map((r) => r.name).join());
check('1f places only go down, end at 1 or less before starting', waited.every((r) => r.positions.every((n, i) => i === 0 || n < r.positions[i - 1])), JSON.stringify(waited.map((r) => [r.name, r.positions])));
check('1f2 once its recognition started, no request is told a place in line again (keep-alive every 250 ms here)', runs.every((r) => !r.queuedAfterStart), runs.filter((r) => r.queuedAfterStart).map((r) => r.name).join());
check('1g no failure reported to the owner', reports.length === 0, reports.join());

// 2. a visitor with a page in progress and 2 waiting: a 3rd waiting one is refused with its own sentence (429)
const four = await Promise.all([run('E1', '198.51.100.5'), run('E2', '198.51.100.5'), run('E3', '198.51.100.5'), run('E4', '198.51.100.5')]);
const refused = four.filter((r) => !(r.body && r.body.ok));
check('2a 3 served, the 4th refused', refused.length === 1 && /already waiting/.test(refused[0].body.error), JSON.stringify(four.map((r) => [r.name, r.status, r.body && (r.body.ok || r.body.error)])));
check('2b that refusal is not reported as a fault of the service', reports.length === 0, reports.join());

// 3. a waiting request cancelled by the visitor leaves the line; the one behind moves up and is served
// (the browser's fetch aborted = the response stream cancelled: the route aborts its call, the service sees the close)
const p1 = run('F1', '198.51.100.6'), p2 = run('G1', '198.51.100.7');
await new Promise((r) => setTimeout(r, 150));
const p3 = run('H1', '198.51.100.8', { leaveAfterFirstLine: true });
await new Promise((r) => setTimeout(r, 150));
const p4 = run('I1', '198.51.100.9');
const [r1, r2, r3, r4] = await Promise.all([p1, p2, p3, p4]);
await new Promise((r) => setTimeout(r, 300));
check('3a the visitor who left got no result', r3.left === true && !(r3.body && r3.body.ok), JSON.stringify(r3.body));
check('3a2 the service logged that request as left the line ("line_aborted"), not recognized', /line_aborted/.test(log.join('')), log.join('').slice(-600));
check('3b the one behind it moved from place 2 to place 1 and was served', r4.body && r4.body.ok && r4.positions[0] === 2 && r4.positions.includes(1), JSON.stringify([r4.positions, r4.body && r4.body.ok]));
check('3c the two first served', r1.body.ok && r2.body.ok);

// 4. an older caller (no line asked): JSON as in P33; with the service busy beyond OCR_QUEUE_MS (1.5 s here): 503 "busy"
const legacy = await Promise.all([run('L1', '198.51.100.10', { line: false }), run('L2', '198.51.100.11', { line: false }), run('L3', '198.51.100.12', { line: false })]);
check('4a old callers get JSON, never lines', legacy.every((r) => !r.ndjson));
check('4b two served, the third told "busy" (503) after the short wait, as in P33', legacy.filter((r) => r.body.ok).length === 2 && legacy.some((r) => r.status === 503 && /busy/.test(r.body.error)), JSON.stringify(legacy.map((r) => [r.status, r.body.ok || r.body.error])));

// 5. the service's log: no IP, no client key, no text
const all = log.join('');
check('5 the service log holds no IP, no client key', !/198\.51\.100|[0-9a-f]{64}/.test(all), all.slice(0, 300));

svc.kill();
console.log(`\n${passes} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);

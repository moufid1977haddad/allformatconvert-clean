// P33 (05/10) — the pdf-tools endpoints /v1/ocr-page and /v1/ocr-page-staged, run locally with the real Poppler and
// the real Tesseract of this machine (UB-Mannheim build on Windows; Debian's in the container). Starts the service on
// a free port with a test key, checks the answers, the bounds and that no temp dir is left behind.
//   TESSDATA_PREFIX=<dir with eng, fra, ara, chi_sim> node scripts/p33/ocr-service.test.mjs
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const KIT = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
const PDF = path.join(KIT, 'kit-iphone-p21', 'pdf-avec-images.pdf');
const LOCKED = path.join(ROOT, 'scripts', 'converter-tests', 'fixtures', 'encrypted-user-password.pdf');
const which = (b) => execFileSync(process.platform === 'win32' ? 'where' : 'which', [b]).toString().split(/\r?\n/)[0].trim();
const TESSERACT = process.env.TESSERACT_BIN || (process.platform === 'win32' ? 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe' : 'tesseract');
const OUT = path.join(os.tmpdir(), 'p33-ocr-service');
fs.mkdirSync(OUT, { recursive: true });
const KEY = 'p33-local-test-key';

let failures = 0, passes = 0;
const check = (name, ok, extra = '') => { if (ok) passes++; else failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

function start(port, env = {}) {
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: path.join(ROOT, 'services', 'pdf-tools'),
    env: { ...process.env, PORT: String(port), API_KEYS: JSON.stringify({ [KEY]: { name: 'p33-test' } }), PDFTOPPM_BIN: which('pdftoppm'), PDFINFO_BIN: which('pdfinfo'), TESSERACT_BIN: TESSERACT, MEDIA_SERVICE_URL: '', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const lines = [];
  child.stdout.on('data', (d) => lines.push(...d.toString().split(/\r?\n/).filter(Boolean)));
  child.stderr.on('data', (d) => lines.push(...d.toString().split(/\r?\n/).filter(Boolean)));
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = async () => {
      try { const r = await fetch(`http://127.0.0.1:${port}/v1/ocr-page`, { method: 'POST' }); if (r.status) return resolve({ child, lines }); } catch { /* not yet */ }
      if (Date.now() - t0 > 15000) return reject(new Error('service did not start: ' + lines.join('\n')));
      setTimeout(poll, 200);
    };
    poll();
  });
}

async function ocr(port, fields, file = PDF, key = KEY) {
  const form = new FormData();
  if (file) form.append('file', new Blob([fs.readFileSync(file)], { type: 'application/pdf' }), path.basename(file));
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  const t0 = Date.now();
  const res = await fetch(`http://127.0.0.1:${port}/v1/ocr-page`, { method: 'POST', headers: key ? { 'X-API-Key': key } : {}, body: form });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { res, json, ms: Date.now() - t0 };
}
const layerText = (b64, name) => {
  const f = path.join(OUT, name);
  fs.writeFileSync(f, Buffer.from(b64, 'base64'));
  return execFileSync(which('pdftotext'), [f, '-']).toString();
};

const leftovers = () => fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('pdftools-req-')).length;
const settle = () => new Promise((r) => setTimeout(r, 1500));

const before = leftovers();
const A = await start(3591);
try {
  const h = await (await fetch('http://127.0.0.1:3591/health')).json();
  check(`/health reports tesseract and the installed models (${(h.ocrLanguages || []).join(', ')})`, h.binaries?.tesseract?.ok && Array.isArray(h.ocrLanguages) && h.ocrLanguages.includes('eng'), JSON.stringify(h.binaries?.tesseract));
  // the owner's iPhone case: pdf-avec-images.pdf, English
  for (const pg of [1, 2, 3]) {
    const r = await ocr(3591, { page: pg, lang: 'eng' });
    const ok = r.res.status === 200 && r.json?.ok && new RegExp(`photo-${pg}\\.jpg`).test(r.json.text) && new RegExp(`Page ${pg}`).test(r.json.text);
    check(`kit page ${pg}, English: text read (${JSON.stringify((r.json?.text || '').split('\n')[0])}…) in ${r.ms} ms`, ok, JSON.stringify(r.json)?.slice(0, 300));
    if (r.json?.pdf) {
      const b = Buffer.from(r.json.pdf, 'base64');
      const t = layerText(r.json.pdf, `layer-${pg}.pdf`);
      check(`… page ${pg}: a text-only PDF (${b.length} B) whose text is searchable`, b.subarray(0, 5).toString() === '%PDF-' && new RegExp(`photo-${pg}`).test(t), t.slice(0, 80));
      check(`… page ${pg}: 300 dpi, 3 pages, not reduced`, r.json.dpi === 300 && r.json.pages === 3 && r.json.reduced === false);
    }
  }
  let r = await ocr(3591, { page: 2, lang: 'eng+fra' });
  check('two languages (eng+fra)', r.res.status === 200 && /photo-2/.test(r.json?.text), r.json?.error);
  r = await ocr(3591, { page: 2, lang: 'fra+ara+chi_sim' });
  check('three languages', r.res.status === 200, r.json?.error);
  r = await ocr(3591, { page: 2, lang: 'eng+fra+ara+chi_sim' });
  check('four languages → 400', r.res.status === 400 && /one to 3/.test(r.json?.error), r.json?.error);
  r = await ocr(3591, { page: 2, lang: 'deu' });
  check('a model not installed here → 422 with its name, never English instead', r.res.status === 422 && /no model for deu/.test(r.json?.error), r.json?.error);
  r = await ocr(3591, { page: 2, lang: 'eng+eng' }); check('same language twice → 400', r.res.status === 400);
  r = await ocr(3591, { page: 2, lang: 'eng;rm -rf /' }); check('lang with shell text → 400', r.res.status === 400);
  r = await ocr(3591, { page: 2, lang: '../eng' }); check('lang with a path → 400', r.res.status === 400);
  r = await ocr(3591, { page: 2, lang: '' }); check('no language → 400', r.res.status === 400);
  r = await ocr(3591, { page: 4, lang: 'eng' });
  check('page beyond the end → 400 with the page count', r.res.status === 400 && /3 pages/.test(r.json?.error), r.json?.error);
  r = await ocr(3591, { page: '1;rm -rf /', lang: 'eng' }); check('page with shell text → 400', r.res.status === 400);
  r = await ocr(3591, { page: 1, lang: 'eng', dpi: 2000 }); check('dpi 2000 → 400', r.res.status === 400);
  r = await ocr(3591, { page: 1, lang: 'eng' }, LOCKED);
  check('password PDF → 422 with the Unlock sentence', r.res.status === 422 && /password/i.test(r.json?.error), r.json?.error);
  const notPdf = path.join(OUT, 'not-a-pdf.pdf');
  fs.writeFileSync(notPdf, 'hello, I am not a PDF');
  r = await ocr(3591, { page: 1, lang: 'eng' }, notPdf); check('not a PDF → 422', r.res.status === 422, r.json?.error);
  r = await ocr(3591, { page: 1, lang: 'eng' }, null); check('no file → 400', r.res.status === 400);
  r = await ocr(3591, { page: 1, lang: 'eng' }, PDF, null); check('no key → 401', r.res.status === 401);
  r = await ocr(3591, { page: 1, lang: 'eng' }, PDF, 'wrong'); check('wrong key → 401', r.res.status === 401);
  const s = await fetch('http://127.0.0.1:3591/v1/ocr-page-staged', { method: 'POST', headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ jid: 'a'.repeat(32), ticket: 'x', page: 1, lang: 'eng' }) });
  check('staged without MEDIA_SERVICE_URL → 503', s.status === 503);
  const par = await Promise.all([1, 2, 3, 1].map((pg) => ocr(3591, { page: pg, lang: 'eng' })));
  check('4 parallel recognitions all succeed (2 at a time)', par.every((x) => x.res.status === 200), par.map((x) => `${x.ms} ms`).join(', '));
  check('one metric line per request, no file name and no recognized text in logs', A.lines.some((l) => l.includes('"/v1/ocr-page"')) && !A.lines.some((l) => /pdf-avec-images|photo-\d|PDF avec/.test(l)), A.lines.filter((l) => /photo|PDF avec/.test(l)).join(' | '));
  // the render endpoint of P32 is untouched
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(PDF)], { type: 'application/pdf' }), 'x.pdf');
  for (const [k, v] of Object.entries({ page: 1, dpi: 150, format: 'jpg', quality: 92 })) form.append(k, String(v));
  const rr = await fetch('http://127.0.0.1:3591/v1/render-page', { method: 'POST', headers: { 'X-API-Key': KEY }, body: form });
  check('/v1/render-page (P32) unchanged: 200 image/jpeg', rr.status === 200 && rr.headers.get('content-type') === 'image/jpeg');
  await settle();
} finally { A.child.kill(); }

// a page larger than OCR_MAX_PIXELS at 300 dpi is recognized lower, and said
const B = await start(3592, { OCR_MAX_PIXELS: '2000000' });
try {
  const r = await ocr(3592, { page: 2, lang: 'eng' });
  check('pixel cap → lower density, reduced: true', r.res.status === 200 && r.json.reduced === true && r.json.dpi < 300, `dpi=${r.json?.dpi}`);
  await settle();
} finally { B.child.kill(); }

// busy: one at a time, queue of 1 ms → the second parallel request is told to retry
const C = await start(3593, { OCR_CONCURRENCY: '1', OCR_QUEUE_MS: '1' });
try {
  const [x, y] = await Promise.all([ocr(3593, { page: 1, lang: 'eng' }), ocr(3593, { page: 2, lang: 'eng' })]);
  check('busy → one 200 and one 503 with a sentence', [x.res.status, y.res.status].sort().join() === '200,503' && /busy/.test(((x.res.status === 503 ? x : y).json || {}).error || ''), `${x.res.status} ${y.res.status}`);
  await settle();
} finally { C.child.kill(); }

// timeout: the service gives up, kills Tesseract and answers 504 (or closes) — the temp dir still goes
const D = await start(3594, { OCR_TIMEOUT_MS: '400' });
try {
  const r = await ocr(3594, { page: 1, lang: 'eng' }).catch((e) => ({ res: { status: 'closed' }, json: null, err: e.message }));
  check('timeout → 504 or connection closed, never a result', r.res.status === 504 || r.res.status === 'closed', String(r.res.status));
  await settle();
} finally { D.child.kill(); }

check('no request temp dir left behind', leftovers() <= before, `${before} → ${leftovers()}`);
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);

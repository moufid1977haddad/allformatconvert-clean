// P32 (04/10) — the pdf-tools endpoints /v1/render-page and /v1/render-page-staged, run locally with the real Poppler
// (pdftoppm / pdfinfo of this machine; Debian's in the container). Starts the service on a free port with a test key,
// checks the answers, the bounds and that no temp dir is left behind.
//   node scripts/p32/render-service.test.mjs
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
const KEY = 'p32-local-test-key';

let failures = 0, passes = 0;
const check = (name, ok, extra = '') => { if (ok) passes++; else failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`); };

function start(port, env = {}) {
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: path.join(ROOT, 'services', 'pdf-tools'),
    env: { ...process.env, PORT: String(port), API_KEYS: JSON.stringify({ [KEY]: { name: 'p32-test' } }), PDFTOPPM_BIN: which('pdftoppm'), PDFINFO_BIN: which('pdfinfo'), MEDIA_SERVICE_URL: '', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const lines = [];
  child.stdout.on('data', (d) => lines.push(...d.toString().split(/\r?\n/).filter(Boolean)));
  child.stderr.on('data', (d) => lines.push(...d.toString().split(/\r?\n/).filter(Boolean)));
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = async () => {
      try { const r = await fetch(`http://127.0.0.1:${port}/v1/render-page`, { method: 'POST' }); if (r.status) return resolve({ child, lines }); } catch { /* not yet */ }
      if (Date.now() - t0 > 15000) return reject(new Error('service did not start: ' + lines.join('\n')));
      setTimeout(poll, 200);
    };
    poll();
  });
}

async function render(port, fields, file = PDF, key = KEY) {
  const form = new FormData();
  if (file) form.append('file', new Blob([fs.readFileSync(file)], { type: 'application/pdf' }), path.basename(file));
  for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
  const t0 = Date.now();
  const res = await fetch(`http://127.0.0.1:${port}/v1/render-page`, { method: 'POST', headers: key ? { 'X-API-Key': key } : {}, body: form });
  const buf = Buffer.from(await res.arrayBuffer());
  return { res, buf, ms: Date.now() - t0, json: (res.headers.get('content-type') || '').includes('json') ? JSON.parse(buf.toString()) : null };
}

// image size from the bytes (JPEG SOF / PNG IHDR / TIFF tags 256-257)
function dims(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: 'png' };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i < buf.length;) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), type: 'jpg' };
      i += 2 + len;
    }
  }
  if ((buf[0] === 0x49 && buf[1] === 0x49) || (buf[0] === 0x4d && buf[1] === 0x4d)) {
    const le = buf[0] === 0x49, u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o)), u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
    const ifd = u32(4), n = u16(ifd), out = { type: 'tiff' };
    for (let k = 0; k < n; k++) { const e = ifd + 2 + k * 12, tag = u16(e), typ = u16(e + 2), val = typ === 3 ? u16(e + 8) : u32(e + 8); if (tag === 256) out.w = val; if (tag === 257) out.h = val; }
    return out;
  }
  return null;
}

const leftovers = () => fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('pdftools-req-')).length;
// cleanupDir is asynchronous (fs.rm callback): give it time BEFORE the service is stopped
const settle = () => new Promise((r) => setTimeout(r, 1500));

const before = leftovers();
const A = await start(3491);
try {
  // the owner's iPhone case: page 1 of pdf-avec-images.pdf, JPG, 150 dpi, quality 92
  let r = await render(3491, { page: 1, dpi: 150, format: 'jpg', quality: 92 });
  let d = dims(r.buf);
  check('kit PDF page 1 JPG 150 dpi', r.res.status === 200 && r.res.headers.get('content-type') === 'image/jpeg' && d?.w === 1241 && d?.h === 1754, `${r.res.status} ${d?.w}×${d?.h} ${r.buf.length} B ${r.ms} ms`);
  check('headers: dpi, pages, not reduced', r.res.headers.get('x-render-dpi') === '150' && r.res.headers.get('x-render-pages') === '3' && !r.res.headers.get('x-render-reduced'));
  fs.mkdirSync(path.join(os.tmpdir(), 'p32-render'), { recursive: true });
  fs.writeFileSync(path.join(os.tmpdir(), 'p32-render', 'kit-page1-150.jpg'), r.buf);
  for (const pg of [2, 3]) {
    r = await render(3491, { page: pg, dpi: 150, format: 'jpg', quality: 92 });
    check(`kit PDF page ${pg} JPG`, r.res.status === 200 && dims(r.buf)?.type === 'jpg', `${r.buf.length} B ${r.ms} ms`);
  }
  r = await render(3491, { page: 1, dpi: 300, format: 'png' }); d = dims(r.buf);
  check('PNG 300 dpi', r.res.status === 200 && d?.type === 'png' && d.w === 2481 && d.h === 3508, `${d?.w}×${d?.h} ${r.buf.length} B reduced=${r.res.headers.get('x-render-reduced')}`);
  r = await render(3491, { page: 2, dpi: 72, format: 'tiff' }); d = dims(r.buf);
  check('TIFF 72 dpi', r.res.status === 200 && d?.type === 'tiff' && d.w === 596 && d.h === 842, `${d?.w}×${d?.h}`);
  const q80 = await render(3491, { page: 1, dpi: 150, format: 'jpg', quality: 80 });
  const q92 = await render(3491, { page: 1, dpi: 150, format: 'jpg', quality: 92 });
  check('quality is applied (80 < 92 in bytes)', q80.buf.length < q92.buf.length, `${q80.buf.length} < ${q92.buf.length}`);
  r = await render(3491, { page: 1, dpi: 150, format: 'jpg', maxPixels: 1000000 }); d = dims(r.buf);
  check('maxPixels lowers the density and says so', r.res.status === 200 && d.w * d.h <= 1000000 && r.res.headers.get('x-render-reduced') === 'page' && Number(r.res.headers.get('x-render-dpi')) < 150, `${d.w}×${d.h} dpi=${r.res.headers.get('x-render-dpi')}`);
  // refusals
  r = await render(3491, { page: 4, dpi: 150, format: 'jpg' });
  check('page beyond the end → 400 with the page count', r.res.status === 400 && /3 pages/.test(r.json?.error), r.json?.error);
  r = await render(3491, { page: 0, dpi: 150, format: 'jpg' }); check('page 0 → 400', r.res.status === 400);
  r = await render(3491, { page: 1, dpi: 2000, format: 'jpg' }); check('dpi 2000 → 400', r.res.status === 400);
  r = await render(3491, { page: 1, dpi: 150, format: 'gif' }); check('format gif → 400', r.res.status === 400);
  r = await render(3491, { page: 1, dpi: 150, format: 'jpg', quality: 0 }); check('quality 0 → 400', r.res.status === 400);
  r = await render(3491, { page: '1;rm -rf /', dpi: 150, format: 'jpg' }); check('page with shell text → 400', r.res.status === 400);
  r = await render(3491, { page: 1, dpi: 150, format: 'jpg' }, LOCKED);
  check('password PDF → 422 with the Unlock sentence', r.res.status === 422 && /password/i.test(r.json?.error), r.json?.error);
  const notPdf = path.join(os.tmpdir(), 'p32-render', 'not-a-pdf.pdf');
  fs.writeFileSync(notPdf, 'hello, I am not a PDF');
  r = await render(3491, { page: 1, dpi: 150, format: 'jpg' }, notPdf);
  check('not a PDF → 422', r.res.status === 422, r.json?.error);
  r = await render(3491, { page: 1, dpi: 150, format: 'jpg' }, null); check('no file → 400', r.res.status === 400);
  r = await render(3491, { page: 1, dpi: 150, format: 'jpg' }, PDF, null); check('no key → 401', r.res.status === 401);
  r = await render(3491, { page: 1, dpi: 150, format: 'jpg' }, PDF, 'wrong'); check('wrong key → 401', r.res.status === 401);
  // staged path without MEDIA_SERVICE_URL: refused loudly, never a silent fallback
  const s = await fetch('http://127.0.0.1:3491/v1/render-page-staged', { method: 'POST', headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ jid: 'a'.repeat(32), ticket: 'x', page: 1, dpi: 150, format: 'jpg' }) });
  check('staged without MEDIA_SERVICE_URL → 503', s.status === 503);
  // concurrency: 2 at a time by default — 4 parallel requests all succeed (queue)
  const par = await Promise.all([1, 2, 3, 1].map((pg) => render(3491, { page: pg, dpi: 300, format: 'jpg' })));
  check('4 parallel renders all succeed (2 at a time)', par.every((x) => x.res.status === 200), par.map((x) => `${x.ms} ms`).join(', '));
  check('one metric line per request, no file name in logs', A.lines.some((l) => l.includes('"/v1/render-page"')) && !A.lines.some((l) => l.includes('pdf-avec-images')));
  await settle();
} finally { A.child.kill(); }

// image too large to send back → drawn again lower, and said
const B = await start(3492, { MAX_RENDER_OUTPUT_BYTES: '150000' });
try {
  const r = await render(3492, { page: 1, dpi: 300, format: 'jpg', quality: 92 });
  const d = dims(r.buf);
  check('output over the answer ceiling → lower density, X-Render-Reduced: output', r.res.status === 200 && r.buf.length <= 150000 && r.res.headers.get('x-render-reduced') === 'output' && Number(r.res.headers.get('x-render-dpi')) < 300, `${r.buf.length} B dpi=${r.res.headers.get('x-render-dpi')} ${d?.w}×${d?.h}`);
  await settle();
} finally { B.child.kill(); }

// busy: one render at a time, queue of 1 ms → the second parallel request is told to retry
const C = await start(3493, { RENDER_CONCURRENCY: '1', RENDER_QUEUE_MS: '1' });
try {
  const [x, y] = await Promise.all([render(3493, { page: 1, dpi: 300, format: 'png' }), render(3493, { page: 2, dpi: 300, format: 'png' })]);
  check('busy → one 200 and one 503 with a sentence', [x.res.status, y.res.status].sort().join() === '200,503' && /busy/.test((x.json || y.json)?.error || ''), `${x.res.status} ${y.res.status}`);
  await settle();
} finally { C.child.kill(); }

check('no request temp dir left behind', leftovers() <= before, `${before} → ${leftovers()}`);
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);

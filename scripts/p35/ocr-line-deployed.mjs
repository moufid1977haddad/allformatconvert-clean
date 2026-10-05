// P35 (06/10, D1) — the OCR line through a REAL deployment (preview via scripts/browser-tests/vercel-preview-proxy.mjs,
// or www): three pages sent at once from this one connection (one visitor) to /api/pdf-ocr asking for the line. The
// service runs one page per visitor at a time: the two others must be told their place, then all three get their text.
// Costs 3 pages of this connection's hourly OCR allowance; no paid provider.
//   node scripts/p35/ocr-line-deployed.mjs <origin>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv[2]).origin;
const PDF = fs.readFileSync(path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `— ${info}`); };

async function one(page) {
  const form = new FormData();
  form.append('file', new Blob([PDF], { type: 'application/pdf' }), 'document.pdf');
  form.append('page', String(page)); form.append('lang', 'eng'); form.append('dpi', '300');
  const t0 = Date.now();
  const res = await fetch(`${origin}/api/pdf-ocr`, { method: 'POST', body: form, headers: { Accept: 'application/x-ndjson, application/json' } });
  const ev = { page, status: res.status, type: res.headers.get('content-type'), places: [], started: false, body: null };
  if ((ev.type || '').startsWith('application/x-ndjson')) {
    for (const line of (await res.text()).split('\n').filter(Boolean)) {
      const m = JSON.parse(line);
      if (m.queued) ev.places.push(m.position); else if (m.started) ev.started = true; else ev.body = m;
    }
  } else ev.body = await res.json();
  ev.ms = Date.now() - t0;
  return ev;
}
const runs = await Promise.all([1, 2, 3].map(one));
for (const r of runs) console.log(`  page ${r.page}: ${r.status} ${r.type} places [${r.places}] started ${r.started} ${r.ms} ms ${r.body && r.body.ok ? JSON.stringify(r.body.text.slice(0, 40)) : JSON.stringify(r.body)}`);
check('all three pages recognized (no failure)', runs.every((r) => r.body && r.body.ok && /photo-\d\.jpg/.test(r.body.text)), JSON.stringify(runs.map((r) => r.body && (r.body.ok || r.body.error))));
check('one started at once, the two others waited in line and were told their place (one visitor = one page at a time)', runs.filter((r) => r.places.length).length === 2 && runs.filter((r) => !r.places.length).length === 1, JSON.stringify(runs.map((r) => r.places)));
check('the waiting answers came as JSON lines through the deployment', runs.filter((r) => r.places.length).every((r) => (r.type || '').startsWith('application/x-ndjson') && r.started));
console.log(`\n${passes} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);

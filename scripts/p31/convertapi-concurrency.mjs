// P31 (03/10) — what visitors see when two .docx reach Word to PDF at the same moment, on a ConvertAPI plan that runs
// ONE conversion at a time ("Developer": "1 Concurrent conversion", convertapi.com/pricing). Run by the controller on
// www, once before and once after the P31 deploy; never by a bench (P30 rule: real paid calls only with a budget).
//
//   node scripts/p31/convertapi-concurrency.mjs --label=before            # prints the plan, sends nothing
//   node scripts/p31/convertapi-concurrency.mjs --label=before --go       # 2 real requests in parallel
//   options: --origin=https://www.onlineconvertools.com  --files=a.docx,b.docx  --rounds=1  --no-fallback
//
// Each request is sent exactly as the Word to PDF page sends it (POST /api/convert-to-pdf, field "file",
// engineFallback=allowed unless --no-fallback). Each is recorded BEFORE it is sent in docs/audit/depenses-fournisseurs.jsonl
// (scripts/p30/paid-ledger.mjs reservePaid) under the budget "p31-convertapi": 10 conversions (0.01 $ each, the ledger's
// unit since P29) for the whole P31 addendum, refused beyond. Given back (refundPaid) only when ConvertAPI certainly did
// not count it: the PDF came from our LibreOffice backup (X-Engine-Fallback), or the site answered 503 "busy/unavailable"
// or refused before ConvertAPI (400/413/429). ConvertAPI counts a request it processed "whether or not the conversion
// succeeds" (convertapi.com/terms), so any other failure is kept as spent.
//
// Output: one line per request (status, what the visitor reads, duration, engine) and docs/audit/p31-concurrency-<label>.json.
// Reading: "before" is expected to show one ConvertAPI PDF and, for the other request, either a backup PDF
// (engine=libreoffice) or a 503 — the 1-conversion limit hitting a visitor. "after": both PDFs from ConvertAPI
// (engine=convertapi), the second one a few seconds slower (it waited its turn); the Vercel log of the route shows
// "[convertapi] busy (HTTP 503 ...): try 2 in 3 s" then "[convertapi] queued N s, then converted".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reservePaid, refundPaid, spent } from '../p30/paid-ledger.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHANTIER = 'p31-convertapi';
const USD_PER_CONVERSION = 0.01;
const BUDGET_CONVERSIONS = 10;
const BUDGET_USD = BUDGET_CONVERSIONS * USD_PER_CONVERSION;

const opt = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const flag = (k) => process.argv.includes(`--${k}`);
const label = opt('label');
if (!label || !/^[a-z0-9-]+$/.test(label)) { console.error('--label=<before|after|...> is required'); process.exit(2); }
const origin = new URL(opt('origin') || 'https://www.onlineconvertools.com').origin;
const files = (opt('files') || 'scripts/audit/fixtures/files/sample.docx,docs/audit/fixtures-fidelite/fidelite-01.docx')
  .split(',').map((f) => path.resolve(ROOT, f));
const rounds = Math.max(1, Number(opt('rounds') || 1));
const fallback = !flag('no-fallback');
const go = flag('go');

for (const f of files) if (!fs.existsSync(f) || !f.endsWith('.docx')) { console.error(`not a .docx file: ${f}`); process.exit(2); }
if (files.length !== 2) { console.error('exactly 2 files: the two "visitors"'); process.exit(2); }
const already = Math.round(spent(CHANTIER, 'convertapi') / USD_PER_CONVERSION);
const planned = 2 * rounds;
console.log(`origin=${origin} label=${label} rounds=${rounds} requests=${planned} engineFallback=${fallback ? 'allowed' : 'not sent'}`);
console.log(`budget ${CHANTIER}: ${already}/${BUDGET_CONVERSIONS} conversions already recorded; this run reserves up to ${planned}`);
if (!go) { console.log('dry run: nothing sent. Add --go to send.'); process.exit(0); }
if (already + planned > BUDGET_CONVERSIONS) { console.error('refused: the run would exceed the budget'); process.exit(3); }

async function visitor(file, n, t0) {
  const name = path.basename(file);
  const what = `word-to-pdf ${name} on ${origin} (P31 concurrency ${label}, round ${n})`;
  reservePaid({ chantier: CHANTIER, budgetUsd: BUDGET_USD, provider: 'convertapi', usd: USD_PER_CONVERSION, what });
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(file)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), name);
  if (fallback) fd.append('engineFallback', 'allowed');
  const start = Date.now();
  let r;
  try {
    r = await fetch(`${origin}/api/convert-to-pdf`, { method: 'POST', body: fd, headers: { Referer: `${origin}/tools/pdf-tools/word-to-pdf` }, signal: AbortSignal.timeout(290_000) });
  } catch (e) {
    // No answer: we cannot know whether ConvertAPI processed it, so it stays recorded as spent.
    return { file: name, round: n, startedAtMs: start - t0, ms: Date.now() - start, status: null, error: String(e?.name || e) };
  }
  const body = Buffer.from(await r.arrayBuffer());
  const isPdf = body.subarray(0, 5).toString() === '%PDF-';
  const engineFallback = r.headers.get('x-engine-fallback');
  const info = {
    file: name, round: n, startedAtMs: start - t0, ms: Date.now() - start, status: r.status,
    engine: isPdf ? (engineFallback || 'convertapi') : null, pdfBytes: isPdf ? body.length : null,
    message: isPdf ? null : (() => { try { return JSON.parse(body.toString('utf8')).error; } catch { return body.toString('utf8').slice(0, 300); } })(),
  };
  const notCounted = (isPdf && engineFallback) || [400, 413, 429, 503].includes(r.status);
  if (notCounted) refundPaid({ chantier: CHANTIER, provider: 'convertapi', usd: USD_PER_CONVERSION, what: `${what} (HTTP ${r.status}${engineFallback ? ', backup engine' : ''})` });
  info.ledger = notCounted ? 'refunded (not counted by ConvertAPI)' : 'kept (counted by ConvertAPI, or unknown)';
  return info;
}

const results = [];
for (let n = 1; n <= rounds; n++) {
  const t0 = Date.now();
  const pair = await Promise.all(files.map((f) => visitor(f, n, t0)));
  for (const r of pair) {
    results.push(r);
    console.log(`${r.status === 200 && r.engine ? 'PDF ' : 'FAIL'} ${r.file} status=${r.status} ms=${r.ms} engine=${r.engine ?? '-'} ${r.message ? `message="${r.message}"` : ''} [${r.ledger ?? 'kept'}]`);
  }
}
const out = path.join(ROOT, 'docs', 'audit', `p31-concurrency-${label}.json`);
fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), origin, label, engineFallback: fallback, results }, null, 1) + '\n');
const viaConvertApi = results.filter((r) => r.engine === 'convertapi').length;
console.log(`\n${viaConvertApi}/${results.length} PDFs made by ConvertAPI; ${results.filter((r) => r.engine === 'libreoffice').length} by the backup; ${results.filter((r) => !r.engine).length} failures. Saved ${path.relative(ROOT, out)}`);
console.log(`budget ${CHANTIER}: ${Math.round(spent(CHANTIER, 'convertapi') / USD_PER_CONVERSION)}/${BUDGET_CONVERSIONS} conversions recorded`);

// P29 (04/10): the two real paid conversions the owner allowed (0.02 $ at ConvertAPI, 1 credit = 0.01 $ each): a .docx
// with equations, sent to Word to PDF on www exactly as the page sends it (POST /api/convert-to-pdf, field "file"). In
// production .docx goes to ConvertAPI; the PDF is saved for a visual comparison with Word's own PDF.
//   node scripts/p29/docx-equations-www.mjs <origin> <out-dir> <file.docx>...
// Never sends a file twice once it may have been billed: an existing <out-dir>/<name>.pdf, or a .json without a recorded
// non-2xx answer (ConvertAPI bills 2xx only; a crash mid-request leaves only "sending"), stops that file.
import fs from 'node:fs';
import path from 'node:path';
import { reservePaid, refundPaid } from '../p30/paid-ledger.mjs';

// P30: every real send is recorded in the paid ledger first (--chantier=P30 --budget=0.05), refused past the budget.
const opt = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const chantier = opt('chantier'), budget = Number(opt('budget'));
if (!chantier || !(budget > 0)) { console.error('--chantier=<name> --budget=<usd> are required (P30 paid-call rule)'); process.exit(2); }
const [originArg, out, ...files] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!originArg || !out || !files.length) { console.error('usage: docx-equations-www.mjs <origin> <out-dir> <file.docx>...'); process.exit(2); }
const origin = new URL(originArg).origin;
fs.mkdirSync(out, { recursive: true });

for (const f of files) {
  const base = path.basename(f, '.docx');
  const pdf = path.join(out, `${base}.pdf`), meta = path.join(out, `${base}.json`);
  const prev = fs.existsSync(meta) ? JSON.parse(fs.readFileSync(meta, 'utf8')) : null;
  if (fs.existsSync(pdf) || (prev && !(prev.status >= 300))) { console.log(`SKIP ${base}: already sent (${meta})`); continue; }
  if (prev) fs.renameSync(meta, meta.replace(/\.json$/, `.unbilled-${prev.status}.json`));
  reservePaid({ chantier, budgetUsd: budget, provider: 'convertapi', usd: 0.01, what: `word-to-pdf ${path.basename(f)} on ${origin}` });
  fs.writeFileSync(meta, JSON.stringify({ sending: new Date().toISOString() }));
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(f)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), path.basename(f));
  const t = Date.now();
  const r = await fetch(`${origin}/api/convert-to-pdf`, { method: 'POST', body: fd, headers: { Referer: `${origin}/tools/pdf-tools/word-to-pdf` }, signal: AbortSignal.timeout(280_000) });
  const body = Buffer.from(await r.arrayBuffer());
  const isPdf = body.subarray(0, 5).toString() === '%PDF-';
  const info = { status: r.status, bytes: body.length, ms: Date.now() - t, isPdf, engineFallback: r.headers.get('x-engine-fallback'), producer: isPdf ? /\/Producer\s*\(([^)]*)\)/.exec(body.toString('latin1'))?.[1] ?? null : null };
  if (!isPdf || info.engineFallback) refundPaid({ chantier, provider: 'convertapi', usd: 0.01, what: `word-to-pdf ${path.basename(f)} (HTTP ${r.status}${info.engineFallback ? ', backup engine' : ''})` });
  if (isPdf) fs.writeFileSync(pdf, body); else info.error = body.toString('utf8').slice(0, 300);
  fs.writeFileSync(meta, JSON.stringify(info, null, 1));
  console.log(`${isPdf ? 'PASS' : 'FAIL'} ${base}`, JSON.stringify(info));
}

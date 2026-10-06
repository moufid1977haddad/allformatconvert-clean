// P37 (06/10) — sixth review of PDF Redact (docs/audit/p37/relecture-redact.md, "Relecture n° 6"), through the Node
// replay of the page (scripts/p35/harness.mjs; --harness / --impl to run an older copy):
//   C1 /SMask /None in an ExtGState no longer makes every redaction fail: the trap PDF (scripts/p37/make-smask-none.mjs)
//      and the 6 real PDFs of the review (a word each file holds) are redacted, no exception;
//   L5 « ں » folds to « ن » (Chrome's fallback font: p27-chrome-calibri « مرحبا بالعالم » with « Ελλάδας » is gone from
//      the file); pages part of whose text cannot be read are reported (wb-ok-content, a broken ToUnicode);
//   column join: « ريال » on wiki-ar-oman is no longer refused (two cells side by side, or two invisible words read
//      together by PDF.js on a redacted page), and the wrapped-phrase refusals of round 5 still hold (redact-review2).
//   node scripts/p37/redact-review6.test.mjs [--harness=<harness.mjs>] [--impl=<pdfRedact.js>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const { redact } = await import(pathToFileURL(path.resolve(arg('harness', path.join(ROOT, 'scripts/p35/harness.mjs')))).href);
const R = await import(pathToFileURL(path.resolve(arg('impl', path.join(ROOT, 'app/lib/pdfRedact.js')))).href);
const CORPUS = path.join(ROOT, 'scripts/audit/results/arabe-corpus/pdfs');
const P27 = path.join(ROOT, 'scripts/p27/pdfa-corpus');
const SMASK = path.join(os.tmpdir(), 'p33-review-redact', 'r6', 'smask-none.pdf');
const N = (s) => s.normalize('NFKC').replace(/[ً-ٰٟـ‎‏‪-‮⁦-⁩\s]/g, '').replace(/ں/g, 'ن');
const text = (bytes) => { const f = path.join(os.tmpdir(), `p37-review6-${process.pid}.pdf`); fs.writeFileSync(f, bytes); const t = execFileSync('pdftotext', ['-enc', 'UTF-8', f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); fs.rmSync(f); return t; };
let fails = 0;
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? ` — ${info}` : ''}`); };
const run = async (file, terms) => { try { return await redact(file, terms); } catch (e) { return { status: 'ERROR', reason: e.message }; } };

// C1
if (!fs.existsSync(SMASK)) execFileSync(process.execPath, [path.join(ROOT, 'scripts/p37/make-smask-none.mjs'), SMASK], { stdio: 'ignore' });
{
  const r = await run(SMASK, ['ZORGLUB-77']);
  check('C1 /SMask /None (trap PDF): redacted, no exception', r.status === 'ok' && !N(text(r.bytes)).includes('ZORGLUB-77'), `status ${r.status}${r.reason ? ` (${r.reason.slice(0, 90)})` : ''}`);
}
for (const name of ['emro-rc67', 'emro-rc72', 'lb-abl-annual', 'ma-bo-6279', 'ma-bo-7116', 'wb-ok-content']) {
  const file = path.join(CORPUS, `${name}.pdf`);
  if (!fs.existsSync(file)) { check(`C1 ${name}`, false, 'missing'); continue; }
  const words = execFileSync('pdftotext', ['-enc', 'UTF-8', '-l', '3', file, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().match(/[A-Za-z]{5,}|\d{4}/g) || ['2014'];
  const r = await run(file, [words[0]]);
  check(`C1 ${name} [${words[0]}]: no exception`, r.status !== 'ERROR', `status ${r.status}${r.reason ? ` (${r.reason.slice(0, 90)})` : ''}`);
}

// L5
check('L5 « ں » folds to « ن »', !!R.norm && R.norm('ں') === R.norm('ن'));
{
  const r = await run(path.join(P27, 'p27-chrome-calibri-tagged.pdf'), ['Ελλάδας', 'مرحبا بالعالم']);
  check('L5 p27-chrome-calibri « Ελλάδας » + « مرحبا بالعالم »: never delivered with the Arabic phrase', r.status === 'REFUSED' || (r.status === 'ok' && !N(text(r.bytes)).includes(N('مرحبا بالعالم'))), `status ${r.status}`);
  const w = await run(path.join(CORPUS, 'wb-ok-content.pdf'), ['zzqqxx']);
  check('L5 wb-ok-content: pages part of whose text cannot be read are reported', Array.isArray(w.unreadable) && w.unreadable.includes(1), `unreadable pages ${JSON.stringify(w.unreadable || null)}`);
  const c = await run(path.join(CORPUS, 'ae-mof-sod.pdf'), ['zzqqxx']);
  check('L5 a PDF whose text reads well reports no page', Array.isArray(c.unreadable) && c.unreadable.length === 0, `unreadable pages ${JSON.stringify(c.unreadable || null)}`);
}

// column join / layer
{
  const r = await run(path.join(CORPUS, 'wiki-ar-oman.pdf'), ['ريال']);
  check('« ريال » on wiki-ar-oman: redacted, not refused', r.status === 'ok' && !N(text(r.bytes)).includes(N('ريال')), `status ${r.status}${r.reason ? ` (${r.reason})` : ''}${r.layerless ? `, pages without selectable text ${JSON.stringify(r.layerless)}` : ''}`);
}
console.log(`\n${fails ? `${fails} FAIL` : 'all PASS'}`);
process.exit(fails ? 1 : 0);

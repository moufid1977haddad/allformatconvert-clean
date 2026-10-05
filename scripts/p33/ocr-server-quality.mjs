// P33 (05/10) — quality of the server fallback on the same "7 pt scan" as the browser bench (scripts/browser-tests/
// pdf-audit-2.mjs, pdf-ocr: browser CER 0.8 %): the 4 lines set in Helvetica 7 pt, drawn by pdftoppm at 300 dpi
// (a picture, no text layer left), sent to a running pdf-tools /v1/ocr-page. Prints the character error rate.
//   node scripts/p33/ocr-server-quality.mjs <pdf-tools url> <key> [lang]
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [url, key, lang = 'eng'] = process.argv.slice(2);
const LINES = ['The quick brown fox jumps over the lazy dog near the river bank.', 'Invoice number 48213 was paid on 12 March 2024 by transfer.', 'Please return the signed contract before the end of the month.', 'Small print matters: every clause of this agreement is binding.'];
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p33-ocrq-'));
const v = await PDFDocument.create();
const f = await v.embedFont(StandardFonts.Helvetica);
const pg = v.addPage([595.28, 841.89]);
LINES.forEach((l, i) => pg.drawText(l, { x: 60, y: 745 - i * 11, size: 7, font: f }));
fs.writeFileSync(path.join(dir, 'vector.pdf'), await v.save());
execFileSync('pdftoppm', ['-r', '300', '-gray', '-png', '-singlefile', path.join(dir, 'vector.pdf'), path.join(dir, 'scan')]);
const s = await PDFDocument.create();
const im = await s.embedPng(fs.readFileSync(path.join(dir, 'scan.png')));
s.addPage([595.28, 841.89]).drawImage(im, { x: 0, y: 0, width: 595.28, height: 841.89 });
const scan = await s.save();
const form = new FormData();
form.append('file', new Blob([scan], { type: 'application/pdf' }), 'scan.pdf');
form.append('page', '1');
form.append('lang', lang);
const t0 = Date.now();
const j = await (await fetch(`${url.replace(/\/+$/, '')}/v1/ocr-page`, { method: 'POST', headers: { 'X-API-Key': key }, body: form })).json();
const want = LINES.join(' ').replace(/\s+/g, ' ');
const got = (j.text || '').replace(/\s+/g, ' ').trim();
console.log(`server OCR (${lang}, ${j.dpi} dpi) in ${Date.now() - t0} ms: CER ${((lev(want, got) / want.length) * 100).toFixed(1)} %`);
console.log(got.slice(0, 300));
fs.rmSync(dir, { recursive: true, force: true });

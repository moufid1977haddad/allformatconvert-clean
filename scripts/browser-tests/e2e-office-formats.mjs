// P21 phase 3 (02/10): every Office format added to Word / Excel / PowerPoint to PDF, converted for real by the
// route (/api/convert-to-pdf → our LibreOffice server, Gotenberg). The PDF is read back with PDF.js: real PDF, at least
// one page, and for the files written by scripts/p21/office-fixtures.py the test sentence is in the text.
// Our own conversion service only (no paid provider: .docx, the only ConvertAPI format, is not in this list).
// Usage: node scripts/browser-tests/e2e-office-formats.mjs <origin, e.g. the preview relay http://localhost:3200>
import fs from 'node:fs';
import path from 'node:path';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const origin = new URL(process.argv[2] || 'http://localhost:3200').origin;
const dir = path.join('docs', 'audit', 'fixtures-p21-office');
const SENT = 'quick brown fox';
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? info : info); };

for (const f of fs.readdirSync(dir).filter((x) => /\.[a-z]+$/.test(x) && !x.endsWith('.md')).sort()) {
  const buf = fs.readFileSync(path.join(dir, f));
  const fd = new FormData();
  fd.append('file', new Blob([buf]), f);
  const t0 = Date.now();
  let res, body;
  try {
    res = await fetch(`${origin}/api/convert-to-pdf`, { method: 'POST', body: fd, headers: { 'x-p21-test': '1' } });
    body = Buffer.from(await res.arrayBuffer());
  } catch (e) { check(`${f}: converted`, false, String(e)); continue; }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (res.status !== 200 || body.subarray(0, 5).toString() !== '%PDF-') { check(`${f}: converted to a PDF`, false, `HTTP ${res.status} ${body.subarray(0, 200).toString()}`); continue; }
  const pdf = await getDocument({ data: new Uint8Array(body) }).promise;
  let text = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) text += (await (await pdf.getPage(i)).getTextContent()).items.map((x) => x.str).join(' ');
  const ours = /^(text|sheet|slides)\.(odt|ott|ods|ots|odp|otp|rtf)$/.test(f);
  // A page with no text must still hold the document's drawing (a blank page is a false success: Works .wps gave
  // one, 5 operators, and was removed); a spreadsheet cell may clip the sentence, so its start is enough there.
  const ops = (await (await pdf.getPage(1)).getOperatorList()).fnArray.length;
  const sentence = /^sheet\./.test(f) ? 'P21 format' : SENT;
  check(`${f}: real PDF, ${pdf.numPages} page(s), ${ops} drawing operators${ours ? ', test sentence present' : ''}`, pdf.numPages >= 1 && (!ours || text.includes(sentence)) && (text.trim().length > 0 || ops > 100), `${secs} s, ${body.length} bytes, text: ${text.slice(0, 80)}`);
}
console.log(fails ? `${fails} FAIL, ${passes} pass` : `ALL PASS: ${passes} formats`);
process.exit(fails ? 1 : 0);

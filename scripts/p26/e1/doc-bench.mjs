// P26 E1: every DOCX of <dir> through /v1/docx-to-doc of a pdf-tools service; each .doc is reopened by LibreOffice
// (here, headless: .doc -> plain text) and its text compared word for word with the DOCX's own text.
//   node scripts/p26/e1/doc-bench.mjs <service-url> <api-key-env-name> <dir> <soffice>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [url, keyEnv, dir, soffice] = process.argv.slice(2);
const key = process.env[keyEnv];
if (!key) { console.error(`set ${keyEnv}`); process.exit(2); }
const out = path.join(dir, 'out'); fs.mkdirSync(out, { recursive: true });
// "Reopened by LibreOffice" = LibreOffice opens the file and prints it to PDF; the printed text (pdftotext, which
// also sees text in frames and shapes, unlike a .txt export) and page count are compared for DOCX and .doc.
const toText = (file) => {
  const d = fs.mkdtempSync(path.join(out, 'pdf-'));
  execFileSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', d, file], { stdio: 'ignore', timeout: 180000 });
  const f = fs.readdirSync(d).find((x) => x.endsWith('.pdf'));
  if (!f) return null;
  const pages = /Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [path.join(d, f)], { encoding: 'utf8' }))?.[1];
  return `PAGES${pages} ` + execFileSync('pdftotext', [path.join(d, f), '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
};
const words = (t) => (t || '').replace(/﻿/g, '').split(/\s+/).filter(Boolean);
let pass = 0, fail = 0;
for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.docx')).sort()) {
  const src = path.join(dir, name);
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(src)]), name);
  const t0 = Date.now();
  const send = () => fetch(`${url}/v1/docx-to-doc`, { method: 'POST', headers: { 'X-API-Key': key, Connection: 'close' }, body: fd });
  const r = await send().catch(() => send());
  const buf = Buffer.from(await r.arrayBuffer());
  const ms = Date.now() - t0;
  if (r.status !== 200) { fail++; console.log(`FAIL ${name} -> ${r.status} ${buf.toString('utf8').slice(0, 120)}`); continue; }
  const docPath = path.join(out, name.replace(/\.docx$/, '.doc'));
  fs.writeFileSync(docPath, buf);
  const ole = buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  const a = words(toText(src)), b = words(toText(docPath));
  const same = a.length > 0 && a.join(' ') === b.join(' ');
  const ok = ole && same;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} -> .doc ${buf.length} bytes ${ms} ms | Word 97 container ${ole} | reopened by LibreOffice: ${b.length} words, ${same ? 'same text as the DOCX' : `DIFFERENT (docx ${a.length} words)`}`);
}
// a file that is not a DOCX is refused, with a sentence
const bad = new FormData(); bad.append('file', new Blob([Buffer.from('%PDF-1.4 not a docx')]), 'x.docx');
const rb = await fetch(`${url}/v1/docx-to-doc`, { method: 'POST', headers: { 'X-API-Key': key }, body: bad });
const jb = await rb.json().catch(() => ({}));
const okb = rb.status === 400 && /not a DOCX/.test(jb.error || '');
okb ? pass++ : fail++;
console.log(`${okb ? 'PASS' : 'FAIL'} non-DOCX refused -> ${rb.status} ${jb.error}`);
console.log(`doc-bench: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

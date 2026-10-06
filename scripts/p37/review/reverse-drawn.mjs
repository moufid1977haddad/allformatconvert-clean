// P37 review (pre-existing class): "SECRET" drawn glyph by glyph from right to left (TJ offsets), so it reads SECRET on
// the page and in pdftotext, but PDF.js reads the drawing order. Page 1 also holds "Dupont" (the other term).
//   node scripts/p37/review/reverse-drawn.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const lib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdf-lib/cjs/index.js')).href).then((m) => m.default || m);
const { redact } = await import(pathToFileURL(path.join(ROOT, 'scripts/p35/harness.mjs')).href);
const d = await lib.PDFDocument.create(); const f = await d.embedFont('Helvetica');
const p = d.addPage([612, 792]);
// widths (Helvetica, 1/1000): S 667 E 667 C 722 R 722 E 667 T 611; draw T first at the right end, then go left
const w = { S: 667, E: 667, C: 722, R: 722, T: 611 };
const word = 'SECRET'; const xs = []; let x = 0; for (const ch of word) { xs.push(x); x += w[ch]; }
let tj = '['; let pen = 0;
for (let i = word.length - 1; i >= 0; i--) { const off = -(xs[i] - pen); tj += `${-off * 1} (${word[i]}) `; pen = xs[i] + w[word[i]]; }
tj += '] TJ';
const body = `BT /F1 14 Tf 72 500 Td (Client : Dupont, code ) Tj ET BT /F1 14 Tf 250 500 Td ${tj} ET`;
p.node.set(lib.PDFName.of('Resources'), d.context.obj({ Font: { F1: f.ref } }));
p.node.set(lib.PDFName.of('Contents'), d.context.register(d.context.stream(body)));
const file = path.join(os.tmpdir(), 'p37-review-redact', 'reverse-drawn.pdf');
fs.writeFileSync(file, await d.save());
console.log('pdftotext original:', execFileSync('pdftotext', [file, '-']).toString().trim());
const r = await redact(file, ['Dupont', 'SECRET']);
console.log('status', r.status, 'layer', JSON.stringify(r.layer), 'boxes', r.quads[1].length);
const out = file.replace('.pdf', '.out.pdf'); fs.writeFileSync(out, r.bytes);
execFileSync('pdftoppm', ['-r', '72', '-png', '-singlefile', out, out.replace('.pdf', '')]);
console.log('pdftotext out:', execFileSync('pdftotext', [out, '-']).toString().trim());

// P37 sixth review (C1) — a PDF whose second page uses an ExtGState with /SMask /None (the ordinary value Word, InDesign
// and many tools write). PDF Redact's sanitizeForCopy read /SMask as a dictionary and threw ("Expected instance of
// PDFDict, but got instance of PDFName") on every such file, whatever the term. Page 1 holds ZORGLUB-77.
//   node scripts/p37/make-smask-none.mjs [out.pdf, default %TEMP%\p33-review-redact\r6\smask-none.pdf]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib';

const out = process.argv[2] || path.join(os.tmpdir(), 'p33-review-redact', 'r6', 'smask-none.pdf');
fs.mkdirSync(path.dirname(out), { recursive: true });
const d = await PDFDocument.create();
const font = await d.embedFont(StandardFonts.Helvetica);
const p1 = d.addPage([595, 842]);
p1.drawText('Client reference ZORGLUB-77 is closed.', { x: 50, y: 760, size: 14, font });
const p2 = d.addPage([595, 842]);
const gs = d.context.register(d.context.obj({ Type: 'ExtGState', SMask: 'None', ca: 1, CA: 1 }));
p2.node.set(PDFName.of('Resources'), d.context.obj({ Font: { F1: font.ref }, ExtGState: { GS1: gs } }));
p2.node.set(PDFName.of('Contents'), d.context.register(d.context.stream('q /GS1 gs BT /F1 14 Tf 50 760 Td (A page with a soft mask set to None.) Tj ET Q')));
fs.writeFileSync(out, await d.save());
console.log('written', out);

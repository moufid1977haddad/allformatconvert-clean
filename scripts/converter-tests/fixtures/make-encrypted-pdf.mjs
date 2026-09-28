// Builds fixtures/plain.pdf with pdf-lib (text "Hello encrypted world"), then
// fixtures/encrypted-*.pdf with pypdf: empty user password (opens without a
// password, like most bank statements) + owner password, RC4-128 and AES-256;
// and encrypted-user-password.pdf, which needs "open-me" to open.
// Run: node scripts/converter-tests/fixtures/make-encrypted-pdf.mjs
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 2; i++) doc.addPage([400, 300]).drawText(`Hello encrypted world page ${i}`, { x: 40, y: 150, size: 18, font });
writeFileSync(join(dir, 'plain.pdf'), await doc.save());
const py = `
import pypdf, sys
for alg in ['RC4-128', 'AES-256']:
    r = pypdf.PdfReader(sys.argv[1]); w = pypdf.PdfWriter()
    for p in r.pages: w.add_page(p)
    w.encrypt(user_password='', owner_password='owner', algorithm=alg)
    w.write(sys.argv[2] + '/encrypted-' + alg.lower() + '.pdf')
r = pypdf.PdfReader(sys.argv[1]); w = pypdf.PdfWriter()
for p in r.pages: w.add_page(p)
w.encrypt(user_password='open-me', owner_password='owner', algorithm='AES-128')
w.write(sys.argv[2] + '/encrypted-user-password.pdf')
`;
execFileSync('python', ['-c', py, join(dir, 'plain.pdf'), dir], { stdio: 'inherit' });
console.log('written in', dir);

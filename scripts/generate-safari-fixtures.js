// Generates the small fixtures used by claude/tests-safari-proprietaire.md.
// Run: node scripts/generate-safari-fixtures.js   (output: docs/audit/fixtures-safari/)
// PDFs and PNG are byte-stable across runs (verified); the ZIP's content is
// stable but its bytes are not (verified: hash differs between two runs).
// Only small files: photos/videos/audio are deliberately NOT generated -- the
// owner records them on the real iPhone, which is also the realistic input.
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const JSZip = require('jszip');
const QRCode = require('qrcode');

const OUT = path.join(__dirname, '..', 'docs', 'audit', 'fixtures-safari');
fs.mkdirSync(OUT, { recursive: true });

async function makePdf(file, pages, label) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= pages; i++) {
    const page = pdf.addPage([595, 842]);
    page.drawText(`${label}`, { x: 60, y: 760, size: 28, font, color: rgb(0.1, 0.2, 0.6) });
    page.drawText(`Page ${i} / ${pages}`, { x: 60, y: 700, size: 40, font });
  }
  // Fixed dates so the output is byte-stable across runs.
  const fixed = new Date('2026-09-19T00:00:00Z');
  pdf.setCreationDate(fixed);
  pdf.setModificationDate(fixed);
  fs.writeFileSync(path.join(OUT, file), await pdf.save());
}

(async () => {
  await makePdf('safari-A-3pages.pdf', 3, 'FICHIER A');
  await makePdf('safari-B-3pages.pdf', 3, 'FICHIER B');
  await makePdf('safari-30pages.pdf', 30, 'FICHIER 30 PAGES');

  const zip = new JSZip();
  const d = new Date('2026-09-19T00:00:00Z');
  zip.file('un.txt', 'Premier fichier de test Safari.\n', { date: d });
  zip.file('deux.txt', 'Deuxieme fichier de test Safari.\n', { date: d });
  zip.file('dossier/trois.txt', 'Troisieme fichier, dans un dossier.\n', { date: d });
  fs.writeFileSync(path.join(OUT, 'safari-test.zip'), await zip.generateAsync({ type: 'nodebuffer' }));

  await QRCode.toFile(path.join(OUT, 'safari-qr.png'), 'SAFARI-QR-OK-2026', { width: 512, margin: 2 });

  console.log(fs.readdirSync(OUT).map(f => `${f} ${fs.statSync(path.join(OUT, f)).size} o`).join('\n'));
})();

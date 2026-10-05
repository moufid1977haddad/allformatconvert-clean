// P35 (05/10) — a PDF whose geometry the text layer must follow: page 1 with a MediaBox that does not start at 0,0
// ([100 200 712 992]), page 2 the same plus /Rotate 90 and a run of text turned 30°, page 3 with a CropBox inside the
// MediaBox. Each page holds the term SECRET-42 among ordinary words on several lines.
//   node scripts/p35/make-geometry-fixture.mjs <out.pdf>
import fs from 'node:fs';
import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib';

const d = await PDFDocument.create();
const font = await d.embedFont(StandardFonts.Helvetica);
const fontRes = () => d.context.obj({ Font: { F1: font.ref } });
const page = (box, content, extra = {}) => {
  const p = d.addPage([10, 10]);
  p.node.set(PDFName.of('MediaBox'), d.context.obj(box));
  for (const [k, v] of Object.entries(extra)) p.node.set(PDFName.of(k), d.context.obj(v));
  p.node.set(PDFName.of('Resources'), fontRes());
  p.node.set(PDFName.of('Contents'), d.context.register(d.context.stream(content)));
};
const lines = (x, y) => [
  `BT /F1 14 Tf ${x} ${y} Td (Alpha bravo charlie delta echo) Tj ET`,
  `BT /F1 14 Tf ${x} ${y - 60} Td (Foxtrot golf SECRET-42 hotel india juliet) Tj ET`,
  `BT /F1 14 Tf ${x} ${y - 120} Td (Kilo lima mike november oscar) Tj ET`,
].join('\n');
page([100, 200, 712, 992], lines(150, 900));
page([100, 200, 712, 992], `${lines(150, 900)}\nBT /F1 14 Tf 0.866 0.5 -0.5 0.866 200 400 Tm (Papa quebec romeo sierra) Tj ET`, { Rotate: 90 });
page([0, 0, 612, 792], lines(80, 700), { CropBox: [40, 40, 560, 760] });
fs.writeFileSync(process.argv[2], await d.save());
console.log('written', process.argv[2]);

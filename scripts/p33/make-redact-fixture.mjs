// P33 (05/10) — a harder PDF for PDF Redact's truth bench (scripts/p33/redact-truth.mjs): 3 pages, standard fonts.
//   page 1: "Client: Jane Doe-Martin" with "Doe-Martin" in bold (split runs), an e-mail address, a link to
//           https://example.com/jane, and the phrase "account 4111 1111" split over two lines;
//   page 2: a form text field whose value is "Jane Doe-Martin" and a comment (Text annotation) "call Jane Doe-Martin";
//   page 3: nothing to redact, a link (must be kept) and the word "Martin" alone (must NOT be removed: not the phrase);
//   page 4: "Write to us", a link to mailto:jane.doe@example.org (the address is in no text, only in the link).
//   node scripts/p33/make-redact-fixture.mjs <out.pdf>
import { PDFDocument, StandardFonts, PDFName, PDFString, rgb } from 'pdf-lib';
import fs from 'node:fs';

const out = process.argv[2];
const d = await PDFDocument.create();
const f = await d.embedFont(StandardFonts.Helvetica);
const fb = await d.embedFont(StandardFonts.HelveticaBold);
const link = (page, x, y, w, h, url) => {
  const a = d.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [x, y, x + w, y + h], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) } });
  const ref = d.context.register(a);
  page.node.set(PDFName.of('Annots'), d.context.obj([...(page.node.Annots()?.asArray() || []), ref]));
};

const p1 = d.addPage([595, 842]);
p1.drawText('Client: Jane ', { x: 50, y: 760, size: 14, font: f });
p1.drawText('Doe-Martin', { x: 50 + f.widthOfTextAtSize('Client: Jane ', 14), y: 760, size: 14, font: fb });
p1.drawText('E-mail: jane.doe@example.org', { x: 50, y: 730, size: 12, font: f });
p1.drawText('Profile: https://example.com/jane', { x: 50, y: 700, size: 12, font: f, color: rgb(0, 0, 0.8) });
link(p1, 50, 696, 220, 16, 'https://example.com/jane');
p1.drawText('Payments go to account', { x: 50, y: 670, size: 12, font: f });
p1.drawText('4111 1111 at the bank.', { x: 50, y: 654, size: 12, font: f });
p1.drawText('This line stays readable.', { x: 50, y: 620, size: 12, font: f });

const p2 = d.addPage([595, 842]);
p2.drawText('Form page', { x: 50, y: 780, size: 14, font: f });
const form = d.getForm();
const tf = form.createTextField('client');
tf.setText('Jane Doe-Martin');
tf.addToPage(p2, { x: 50, y: 700, width: 250, height: 24, font: f });
const note = d.context.register(d.context.obj({ Type: 'Annot', Subtype: 'Text', Rect: [400, 700, 420, 720], Contents: PDFString.of('call Jane Doe-Martin'), Open: false }));
p2.node.set(PDFName.of('Annots'), d.context.obj([...(p2.node.Annots()?.asArray() || []), note]));

const p3 = d.addPage([595, 842]);
p3.drawText('Other page: Martin is a common name.', { x: 50, y: 760, size: 12, font: f });
p3.drawText('Docs: https://example.com/docs', { x: 50, y: 730, size: 12, font: f });
link(p3, 50, 726, 200, 16, 'https://example.com/docs');

// page 4: the address only in a link's target (the text says "Write to us"), as a mailto: link
const p4 = d.addPage([595, 842]);
p4.drawText('Write to us', { x: 50, y: 760, size: 12, font: f, color: rgb(0, 0, 0.8) });
link(p4, 50, 756, 80, 16, 'mailto:jane.doe@example.org');

fs.writeFileSync(out, await d.save());
console.log('written', out);

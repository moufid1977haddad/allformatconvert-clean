// P24 review (03/10): a JPEG with EXIF orientation 3/6/8 on a chosen page size (A4) is embedded as it is (same bytes)
// and turned upright on the page. Upright is proved from the drawing matrix: where the stored picture's top edge lands.
// Run: npx esbuild app/lib/pdfImages.js --bundle --format=esm --platform=node --external:sharp --outfile=<tmp>/pdfImages.mjs
//      node scripts/p24/pdf-images-exif.test.mjs file:///<tmp>/pdfImages.mjs
import sharp from 'sharp';
import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
const mod = await import(process.argv[2]);
// where the stored top edge must land once displayed upright (EXIF meaning)
const TOP_GOES = { 1: 'top', 3: 'bottom', 6: 'right', 8: 'left' };
let ok = true;
for (const exif of [1, 3, 6, 8]) {
  const jpg = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#3366cc' } }).jpeg({ quality: 90 }).withMetadata({ orientation: exif }).toBuffer();
  const doc = await PDFDocument.create();
  await mod.addImagePage(doc, new File([jpg], 'p.jpg', { type: 'image/jpeg' }), { size: 'a4', orientation: 'auto', marginMm: 10 });
  const back = await PDFDocument.load(await doc.save());
  const page = back.getPage(0); const { width: PW, height: PH } = page.getSize();
  let same = false;
  for (const [, obj] of back.context.enumerateIndirectObjects()) if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) same = Buffer.compare(Buffer.from(obj.contents), jpg) === 0;
  // the content stream: "a b c d e f cm" right before the image's "Do"
  const contents = page.node.Contents(); const streams = contents.asArray ? contents.asArray().map((r) => back.context.lookup(r)) : [contents];
  const ops = streams.map((st) => Buffer.from(decodePDFRawStream(st).decode()).toString('latin1')).join('\n');
  const mats = [...ops.matchAll(/(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) cm/g)].map((m) => m.slice(1).map(Number));
  // compose every cm in order (pdf-lib writes translate, rotate, scale as separate cm operators)
  let M = [1, 0, 0, 1, 0, 0];
  for (const [a, b, c, d, e, f] of mats) M = [a * M[0] + b * M[2], a * M[1] + b * M[3], c * M[0] + d * M[2], c * M[1] + d * M[3], e * M[0] + f * M[2] + M[4], e * M[1] + f * M[3] + M[5]];
  const at = (u, v) => [M[0] * u + M[2] * v + M[4], M[1] * u + M[3] * v + M[5]];
  const [tx, ty] = at(0.5, 1); // middle of the stored top edge (image space: v = 1 is the top row)
  const corners = [at(0, 0), at(1, 0), at(0, 1), at(1, 1)];
  const inside = corners.every(([x, y]) => x >= -0.5 && x <= PW + 0.5 && y >= -0.5 && y <= PH + 0.5);
  const cx = (Math.min(...corners.map((p) => p[0])) + Math.max(...corners.map((p) => p[0]))) / 2, cy = (Math.min(...corners.map((p) => p[1])) + Math.max(...corners.map((p) => p[1]))) / 2;
  const lands = Math.abs(tx - cx) > Math.abs(ty - cy) ? (tx > cx ? 'right' : 'left') : (ty > cy ? 'top' : 'bottom');
  const portrait = exif === 6 || exif === 8;
  const pass = same && inside && lands === TOP_GOES[exif] && (portrait ? PW < PH : PW > PH);
  ok &&= pass;
  console.log(`${pass ? 'PASS' : 'FAIL'} EXIF ${exif}: page ${PW.toFixed(0)}×${PH.toFixed(0)}, JPEG unchanged ${same}, picture inside the page ${inside}, stored top edge lands ${lands} (want ${TOP_GOES[exif]})`);
}
console.log(ok ? 'ALL PASS' : 'FAILURES');
process.exit(ok ? 0 : 1);

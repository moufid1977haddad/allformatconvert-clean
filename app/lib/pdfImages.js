// One image -> one PDF page, the way it is seen on screen (29/09).
//
// JPG to PDF and Image to PDF embedded JPEG bytes as they are, and pdf-lib
// ignores the EXIF orientation tag: every portrait photo taken with a phone
// (stored landscape + "rotate 90°") came out lying on its side in the PDF,
// without a word. Files that were neither JPEG nor PNG were skipped silently,
// giving a PDF with fewer pages than images selected.
//
// Now: orientation 3, 6 and 8 (rotations, by far the most common) are applied
// by rotating the image on the page -- the JPEG is embedded untouched, no
// re-encoding; the mirrored orientations (2, 4, 5, 7) and every other format
// the browser can display (WebP, GIF, BMP, AVIF, HEIC in Safari…) are drawn
// upright on a canvas first. Anything the browser cannot decode is reported.
import { degrees } from 'pdf-lib';

const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8;
const isPng = (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;

async function uprightPng(file) {
  // createImageBitmap applies the EXIF orientation by default (imageOrientation: 'from-image').
  const bmp = await createImageBitmap(file);
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext('2d').drawImage(bmp, 0, 0);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  if (!blob) throw new Error('could not be encoded');
  return new Uint8Array(await blob.arrayBuffer());
}

// Adds a page to pdfDoc; throws Error(`${file.name}: …`) when the file can't be used.
export async function addImagePage(pdfDoc, file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    if (isJpeg(bytes)) {
      let orientation = 1;
      try {
        const exifr = (await import('exifr')).default;
        orientation = (await exifr.orientation(bytes)) || 1;
      } catch { orientation = 1; } // no readable EXIF: stored as displayed
      if ([2, 4, 5, 7].includes(orientation)) {
        const png = await pdfDoc.embedPng(await uprightPng(file));
        pdfDoc.addPage([png.width, png.height]).drawImage(png, { x: 0, y: 0, width: png.width, height: png.height });
        return;
      }
      const img = await pdfDoc.embedJpg(bytes);
      const { width: W, height: H } = img;
      if (orientation === 6) pdfDoc.addPage([H, W]).drawImage(img, { x: 0, y: W, width: W, height: H, rotate: degrees(-90) });
      else if (orientation === 8) pdfDoc.addPage([H, W]).drawImage(img, { x: H, y: 0, width: W, height: H, rotate: degrees(90) });
      else if (orientation === 3) pdfDoc.addPage([W, H]).drawImage(img, { x: W, y: H, width: W, height: H, rotate: degrees(180) });
      else pdfDoc.addPage([W, H]).drawImage(img, { x: 0, y: 0, width: W, height: H });
      return;
    }
    const png = await pdfDoc.embedPng(isPng(bytes) ? bytes : await uprightPng(file));
    pdfDoc.addPage([png.width, png.height]).drawImage(png, { x: 0, y: 0, width: png.width, height: png.height });
  } catch (e) {
    throw new Error(`${file.name}: this image could not be read (${e.message}).`);
  }
}

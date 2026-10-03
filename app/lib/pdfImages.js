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
// pdf-lib is loaded when an image page is added, not with the tool page (30/09/2026, Lighthouse).
import { imageDims, decodeToRaster, hasAlpha, encodePngRGBA, encodeJpegWasm } from './bigImage';
import { checkedBlob } from './mediaSupport';
import { imageHeaderSize } from './fileChecks';
import { isMobileDevice } from './isMobileDevice';

const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8;
const isPng = (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;

// Upright pixels of an image the browser decodes, re-encoded for the PDF: JPEG when opaque (a photo -- a PNG of a
// 24 MP HEIC photo weighs ~50 MB), PNG when it has transparency. 30/09 (owner's iPhone): one canvas the size of the
// photo failed past 16.7 MP on iOS (24/48 MP HEIC from Files); decoded in bands there (lib/bigImage.js).
export async function uprightImage(file) {
  const dims = await imageDims(file);
  const raster = await decodeToRaster(file, dims);
  const rgba = raster.rgba();
  if (hasAlpha(rgba)) return { kind: 'png', bytes: new Uint8Array(await (await encodePngRGBA(rgba, raster.width, raster.height)).arrayBuffer()) };
  let blob = null;
  // checkedBlob tries convertToBlob FIRST: Firefox's OffscreenCanvas still has an old toBlob() that returns a promise
  // and never calls a callback — testing `canvas.toBlob ?` first made JPG to PDF and Image to PDF wait forever on any
  // WebP, GIF, BMP or AVIF in Firefox (found by the P21 format bench, 02/10, also on www).
  if (raster.canvas) blob = await checkedBlob(raster.canvas, 'image/jpeg', 0.92).catch(() => null);
  if (!blob || blob.type !== 'image/jpeg') blob = await encodeJpegWasm(rgba, raster.width, raster.height, 92);
  return { kind: 'jpg', bytes: new Uint8Array(await blob.arrayBuffer()) };
}
async function embedUpright(pdfDoc, file) {
  const u = await uprightImage(file);
  return u.kind === 'png' ? pdfDoc.embedPng(u.bytes) : pdfDoc.embedJpg(u.bytes);
}

// P21 (02/10), format coverage: iLovePDF's and Smallpdf's JPG to PDF take BMP, GIF and TIFF too; an iPhone photo can
// be HEIC. Those the browser cannot draw are first turned into a PNG with the site's own decoders: HEIC by heic2any
// (only where the browser has no HEIC decoder: Chrome, Firefox), TIFF by the TIFF to PNG worker (every bit depth,
// stopped after 20 s of silence like the TIFF tools).
const isHeicName = (f) => /^image\/hei[cf]/.test(f.type) || /\.(heic|heif)$/i.test(f.name);
const isTiffBytes = (b) => (b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a) || (b[0] === 0x4d && b[1] === 0x4d && b[3] === 0x2a);
async function decodableImage(file, bytes) {
  if (isTiffBytes(bytes)) {
    const worker = new Worker(new URL('../tools/image-tools/tiff-to-png/tiffToPng.worker.js', import.meta.url), { type: 'module' });
    // P24 review (03/10): every page of a multi-page TIFF (fax, scan) becomes a PDF page; only the first one did, silently
    const decodePage = (page) => new Promise((resolve, reject) => {
      let t = setTimeout(() => reject(new Error('this TIFF variant could not be decoded in time')), 20000);
      worker.onmessage = ({ data }) => {
        if (data.type === 'decoded') { clearTimeout(t); t = setTimeout(() => reject(new Error('encoding took too long')), 120000); }
        else if (data.type === 'done') { clearTimeout(t); resolve(data); }
        else if (data.type === 'error') { clearTimeout(t); reject(new Error(data.notTiff ? 'not a real TIFF file' : 'this TIFF could not be decoded')); }
      };
      worker.onerror = () => { clearTimeout(t); reject(new Error('this TIFF could not be decoded')); };
      const buf = bytes.slice().buffer;
      worker.postMessage({ buffer: buf, page }, [buf]);
    });
    try {
      const base = file.name.replace(/\.[^.]+$/, '');
      const first = await decodePage(0);
      const out = new File([first.blob], base + '.png', { type: 'image/png' });
      out.morePages = [];
      for (let k = 1; k < (first.pageCount || 1); k++) out.morePages.push(new File([(await decodePage(k)).blob], `${base}-p${k + 1}.png`, { type: 'image/png' }));
      return out;
    } finally { worker.terminate(); }
  }
  if (isHeicName(file) && !(await imageDims(file))) {
    const heic2any = (await import('heic2any')).default;
    const out = await heic2any({ blob: file, toType: 'image/png' });
    return new File([Array.isArray(out) ? out[0] : out], file.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' });
  }
  return null;
}

// P23 (02/10): one pixel = one point, except that a PDF page is at most 14 400 points (200 inches) on a side — the
// limit of Adobe Acrobat and of the PDF specification without UserUnit. A 30 000 px image (or an iPhone panorama of
// 16 000 px and more) made a 30 000-point page that Acrobat does not open correctly; the page is now scaled to fit,
// the image itself keeps every pixel. Measured by scripts/p23/jpg-to-pdf-giant.mjs.
export const MAX_PAGE_POINTS = 14400;
export const pageScale = (w, h) => Math.min(1, MAX_PAGE_POINTS / Math.max(w, h));
function fullPage(pdfDoc, img, layout) {
  if (layout && layout.size && layout.size !== 'fit') return placedPage(pdfDoc, img, layout);
  const k = pageScale(img.width, img.height), w = img.width * k, h = img.height * k;
  pdfDoc.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h });
}

// P24 (03/10): a page size (A4, Letter), an orientation and a margin, as iLovePDF and PDF24 offer. The picture is
// scaled to fit inside the margins, never cropped or stretched, and centred; a small picture is not enlarged.
export const PAGE_SIZES_PT = { a4: [595.28, 841.89], letter: [612, 792], legal: [612, 1008], a5: [419.53, 595.28] };
// `exif` is a JPEG's EXIF orientation 3, 6 or 8: the picture is embedded as it is and turned on the page (P24 review:
// it was redrawn, a silent re-encoding of every portrait phone photo, against the FAQ's "put in the PDF as they are").
function placedPage(pdfDoc, img, { size, orientation = 'auto', marginMm = 0 }, exif = 1, degrees = null) {
  const turned = exif === 6 || exif === 8;
  const dw0 = turned ? img.height : img.width, dh0 = turned ? img.width : img.height; // as displayed
  let [pw, ph] = PAGE_SIZES_PT[size] || PAGE_SIZES_PT.a4;
  const landscape = orientation === 'landscape' || (orientation === 'auto' && dw0 > dh0);
  if (landscape) [pw, ph] = [ph, pw];
  const m = (Number(marginMm) || 0) * 72 / 25.4;
  const aw = Math.max(1, pw - 2 * m), ah = Math.max(1, ph - 2 * m);
  const k = Math.min(1, aw / dw0, ah / dh0);
  const w = dw0 * k, h = dh0 * k, bx = (pw - w) / 2, by = (ph - h) / 2; // the displayed box
  const iw = img.width * k, ih = img.height * k; // the stored picture's drawn size
  const page = pdfDoc.addPage([pw, ph]);
  if (exif === 6) page.drawImage(img, { x: bx, y: by + h, width: iw, height: ih, rotate: degrees(-90) });
  else if (exif === 8) page.drawImage(img, { x: bx + w, y: by, width: iw, height: ih, rotate: degrees(90) });
  else if (exif === 3) page.drawImage(img, { x: bx + w, y: by + h, width: iw, height: ih, rotate: degrees(180) });
  else page.drawImage(img, { x: bx, y: by, width: iw, height: ih });
}

// P23 (02/10): a picture that is not embedded as is (PNG, decoded by pdf-lib; WebP, GIF, BMP, HEIC, mirrored JPEG,
// drawn upright) is decoded whole in this tab. A 30 000 × 30 000 PNG froze WebKit (Safari's engine) and took minutes in
// Firefox: its size is read from the header first — at most a canvas's largest area, 268 MP, on every device (a lower
// phone bound was not measured here; a 63 MP iPhone panorama converted from HEIC must pass). A JPEG photo is embedded
// without being decoded: no bound for it.
// P27 (phase 7), measured (scripts/p27/phone-bound-memory.mjs, Image to PDF, PNG pictures, peak of the tab in Chromium):
// 24 MP 0.51 GB, 48 MP 0.70 GB, 100 MP 1.65 GB, 200 MP 3.0 GB (done, on a computer). A phone browser reloads a tab
// around 1.5 GB: 90 MP on a phone (a 63 MP panorama passes, a 108 / 200 MP Android picture does not), 268 on a computer.
// JPEG photos are not decoded: no bound for them on any device.
export const PHONE_MAX_DECODED_MP = 90;
export const MAX_DECODED_MP_COMPUTER = 268;
const MAX_DECODED_MP = () => (isMobileDevice() ? PHONE_MAX_DECODED_MP : MAX_DECODED_MP_COMPUTER);
async function assertDecodable(original, file) {
  const size = await imageHeaderSize(file).catch(() => null);
  const mp = size ? (size.width * size.height) / 1e6 : 0;
  if (mp > MAX_DECODED_MP()) throw new SizeError(`${original.name}: this image is ${size.width.toLocaleString('en-US')} × ${size.height.toLocaleString('en-US')} pixels (${Math.round(mp)} megapixels), more than a browser can turn into a PDF page (${MAX_DECODED_MP()} megapixels at most${isMobileDevice() ? ` on a phone, ${MAX_DECODED_MP_COMPUTER} on a computer` : ''}). Use a smaller version of the image, or a JPEG.`);
}
class SizeError extends Error {}

// Adds a page to pdfDoc; throws Error(`${file.name}: …`) when the file can't be used.
export async function addImagePage(pdfDoc, original, layout = null) {
  const placed = !!(layout && layout.size && layout.size !== 'fit');
  const { degrees } = await import('pdf-lib');
  let file = original;
  let bytes = new Uint8Array(await file.arrayBuffer());
  if (isTiffBytes(bytes)) await assertDecodable(original, original);
  try {
    const converted = await decodableImage(file, bytes);
    if (converted) { file = converted; bytes = new Uint8Array(await file.arrayBuffer()); }
  } catch (e) {
    throw new Error(`${original.name}: this image could not be read (${e.message}).`);
  }
  try {
    if (isJpeg(bytes)) {
      let orientation = 1;
      try {
        const exifr = (await import('exifr')).default;
        orientation = (await exifr.orientation(bytes)) || 1;
      } catch { orientation = 1; } // no readable EXIF: stored as displayed
      if ([2, 4, 5, 7].includes(orientation)) { // mirrored: drawn upright first
        await assertDecodable(original, file);
        fullPage(pdfDoc, await embedUpright(pdfDoc, file), layout);
        return;
      }
      const img = await pdfDoc.embedJpg(bytes);
      if (placed) { placedPage(pdfDoc, img, layout, [3, 6, 8].includes(orientation) ? orientation : 1, degrees); return; }
      const { width: W0, height: H0 } = img;
      const k = pageScale(W0, H0), W = W0 * k, H = H0 * k;
      if (orientation === 6) pdfDoc.addPage([H, W]).drawImage(img, { x: 0, y: W, width: W, height: H, rotate: degrees(-90) });
      else if (orientation === 8) pdfDoc.addPage([H, W]).drawImage(img, { x: H, y: 0, width: W, height: H, rotate: degrees(90) });
      else if (orientation === 3) pdfDoc.addPage([W, H]).drawImage(img, { x: W, y: H, width: W, height: H, rotate: degrees(180) });
      else pdfDoc.addPage([W, H]).drawImage(img, { x: 0, y: 0, width: W, height: H });
      return;
    }
    await assertDecodable(original, file);
    const png = isPng(bytes) ? await pdfDoc.embedPng(bytes) : await embedUpright(pdfDoc, file);
    fullPage(pdfDoc, png, layout);
    for (const more of file.morePages || []) fullPage(pdfDoc, await pdfDoc.embedPng(new Uint8Array(await more.arrayBuffer())), layout);
  } catch (e) {
    if (e instanceof SizeError) throw e;
    // P23: a 900 MP PNG ran the browser out of memory ("Array buffer allocation failed") and was reported as unreadable
    if (e instanceof RangeError || /allocation|out of memory|array length/i.test(String(e?.message))) {
      const size = await imageHeaderSize(original).catch(() => null);
      throw new Error(`${original.name}: this image is too large for this browser's memory${size ? ` (${size.width.toLocaleString('en-US')} × ${size.height.toLocaleString('en-US')} pixels, ${Math.round(size.width * size.height / 1e6)} megapixels)` : ''}. Use a smaller version of the image.`);
    }
    throw new Error(`${original.name}: this image could not be read (${e.message}).`);
  }
}

// Photoshop files for Image Converter (P21, 02/10, format coverage).
//
// Market: iLoveIMG's "Convert to JPG" takes "PNG, GIF, TIF, PSD, SVG, WEBP, HEIC or RAW"; CloudConvert and Convertio
// convert PSD too. Browsers decode none of it, so until P21 a PSD was refused at the file picker.
// PSD / PSB: the flattened image Photoshop stores in the file (ag-psd, MIT). A file saved with "Maximize
// compatibility" turned off has none; the visitor is told how to save it. Returned as a lossless PNG, which the
// converter then encodes like any other image.
// Camera RAW is NOT handled here yet: the LibRaw WebAssembly build on npm needs cross-origin isolation (shared
// memory threads) and hangs the Turbopack build; see the plan, "Décisions du propriétaire — P21".
import { encodePngRGBA } from './bigImage';

export const PSD_EXTENSIONS = ['psd', 'psb'];
export const SPECIAL_ACCEPT = [...PSD_EXTENSIONS, 'svg'].map((e) => '.' + e).join(',');
const extOf = (name) => (/\.([a-z0-9]+)$/i.exec(name || '') || [])[1]?.toLowerCase() || '';
export const isPsdFile = (f) => PSD_EXTENSIONS.includes(extOf(f.name));
// SVG too (iLoveIMG takes it): a worker cannot decode an SVG (createImageBitmap refuses it there), the page can.
export const isSvgFile = (f) => f.type === 'image/svg+xml' || extOf(f.name) === 'svg';
export const isSpecialImage = (f) => isPsdFile(f) || isSvgFile(f);

// Drawn at its own size (width/height of the file, else its viewBox); a drawing with no size at all at 1024 px wide.
async function decodeSvg(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('this SVG could not be drawn (it may be damaged)')); i.src = url; });
    let w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) { w = 1024; h = 1024; }
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
    return { rgba: ctx.getImageData(0, 0, w, h).data, width: w, height: h, note: `drawn at ${w}×${h} px` };
  } finally { URL.revokeObjectURL(url); }
}

async function decodePsd(file) {
  const { readPsd } = await import('ag-psd');
  const psd = readPsd(new Uint8Array(await file.arrayBuffer()), { skipLayerImageData: true, skipThumbnail: true, useImageData: true });
  const d = psd.imageData;
  // Saved without "Maximize compatibility", Photoshop still writes a flattened image, but an empty one (one colour)
  // while the layers hold the picture: converting it would hand back a blank image as if it were the file.
  const layered = (psd.children || []).some((l) => (l.right - l.left) * (l.bottom - l.top) > 0);
  const uniform = !!d && d.data.length >= 4 && d.data.every((v, i) => v === d.data[i & 3]);
  if (!d || !d.width || !d.height || (layered && uniform)) {
    throw new Error('this PSD holds no flattened image (it was saved with "Maximize compatibility" turned off). In Photoshop, turn it on in Preferences › File Handling and save again, or export a PNG');
  }
  const rgba = d.data instanceof Uint8ClampedArray ? d.data : new Uint8ClampedArray(d.data.buffer, d.data.byteOffset, d.data.length);
  return { rgba, width: d.width, height: d.height, note: 'the flattened image of the PSD (all visible layers)' };
}

/** A PSD or SVG file → { blob: PNG, note, width, height }. Throws an Error whose message can be shown to the visitor. */
export async function decodeSpecialImage(file) {
  const r = isSvgFile(file) ? await decodeSvg(file) : await decodePsd(file);
  return { blob: await encodePngRGBA(r.rgba, r.width, r.height), note: r.note, width: r.width, height: r.height };
}

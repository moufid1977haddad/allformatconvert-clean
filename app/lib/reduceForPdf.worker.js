// P33 (05/10): "Reduce to 48 MP then convert to PDF" (JPG to PDF, Image to PDF), on a phone. A picture over the phone
// bound (lib/reduceImage.js PHONE_MAX_PIXELS) is read band by band by the browser's own decoder and reduced by area
// average (reduceToRGBA, the same code as Image Compressor's "Reduce to 48 MP then compress"), then encoded once for
// the PDF -- JPEG (MozJPEG, quality 92, 4:2:0) when opaque, PNG when it has transparency, as for any picture drawn
// upright (lib/pdfImages.js uprightImage). Done in a worker: the encoder's WebAssembly memory goes away with it when
// the page terminates it, instead of staying with the page for the rest of the visit. Also used at full size (to =
// dims) for a picture under the bound that one canvas cannot hold on the phone (pdfImages.js embedUpright).
import { reduceToRGBA } from './reduceImage.js';
import { hasAlpha, encodePngRGBA, encodeJpegWasm } from './bigImage.js';

self.onmessage = async ({ data }) => {
  const { file, dims, to, png = false } = data; // png: the source is a PNG, kept PNG (lossless)
  try {
    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
      throw new Error('this browser cannot process images in the background (it needs Safari 16.4 or later, or a current Chrome, Edge or Firefox)');
    }
    const rgba = await reduceToRGBA(file, dims, to.width, to.height, { onProgress: (pct) => self.postMessage({ type: 'progress', pct: Math.round(pct * 0.8) }) });
    const alpha = png || hasAlpha(rgba);
    const blob = alpha
      ? await encodePngRGBA(rgba, to.width, to.height)
      : await encodeJpegWasm(rgba, to.width, to.height, 92, '#ffffff', { chroma420: true });
    self.postMessage({ type: 'progress', pct: 99 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    self.postMessage({ type: 'done', kind: alpha ? 'png' : 'jpg', bytes }, [bytes.buffer]);
  } catch (e) {
    self.postMessage({ type: 'error', message: (e && e.message) || String(e) });
  }
};

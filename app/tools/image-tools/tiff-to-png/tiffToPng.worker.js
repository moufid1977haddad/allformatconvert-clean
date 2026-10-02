import { CANVAS_MAX_PIXELS, encodePngRGBA } from '../../../lib/bigImage';
import { decodeTiff } from '../../../lib/tiffDecode';
import { sniffFormat } from '../../../lib/detectFileFormat';

self.onmessage = async (e) => {
  const { buffer, page = 0 } = e.data;
  try {
    // Check the real header bytes before attempting any decode -- an
    // extension is just what the file is named, never proof of what it
    // contains (see docs/audit/RAPPORT-tiff-paint.md). Feeding non-TIFF
    // bytes to UTIF2 doesn't throw: decodeImage() silently leaves
    // width/height unset, which used to reach `new OffscreenCanvas()` as
    // undefined and crash with a raw, unreadable browser TypeError.
    const detected = sniffFormat(new Uint8Array(buffer, 0, Math.min(32, buffer.byteLength)));
    if (!detected || detected.format !== 'tiff') {
      const err = new Error('Header bytes do not match the TIFF format' + (detected ? ` (detected: ${detected.format})` : ' (unrecognized)'));
      err.notTiff = true;
      err.detectedFormat = detected ? detected.format : null;
      err.detectedLabel = detected ? detected.label : null;
      throw err;
    }

    const decoded = await decodeTiff(buffer, { page });
    // Defense in depth: even a file that starts with a valid TIFF magic
    // number can fail to yield usable dimensions (a malformed or
    // truncated IFD). Never let undefined/NaN reach OffscreenCanvas.
    if (!decoded || !Number.isFinite(decoded.width) || !Number.isFinite(decoded.height) || decoded.width <= 0 || decoded.height <= 0) {
      throw new Error('Decoded TIFF has no usable width/height');
    }
    // 30/09: one canvas the size of the image fails on iPhone past 16.7 MP; there the PNG is written from the pixels
    // over the browser's own deflate (lib/bigImage.js).
    const { width: w, height: h } = decoded;
    // The decode is over: the 20 s silence watchdog (meant for a stuck decoder) must not cut a long encode.
    self.postMessage({ type: 'decoded', pixels: w * h });
    const rgba = new Uint8ClampedArray(decoded.rgba);
    let blob;
    // No OffscreenCanvas in this worker (some WebKit builds): the PNG is written from the pixels, as past 16.7 MP.
    if (typeof OffscreenCanvas !== 'undefined' && w * h <= CANVAS_MAX_PIXELS) {
      const canvas = new OffscreenCanvas(w, h);
      canvas.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0);
      blob = await canvas.convertToBlob({ type: 'image/png' });
    } else blob = await encodePngRGBA(rgba, w, h);
    self.postMessage({ type: 'done', blob, pageCount: decoded.pageCount, page: decoded.page, hasIcc: decoded.hasIcc }); // P24: pages and colour profile reported
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err?.message || String(err),
      knownLimitation: !!err?.knownLimitation,
      notTiff: !!err?.notTiff,
      detectedFormat: err?.detectedFormat || null,
      detectedLabel: err?.detectedLabel || null,
    });
  }
};

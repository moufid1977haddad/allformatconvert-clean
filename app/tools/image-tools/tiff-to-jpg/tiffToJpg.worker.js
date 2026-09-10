import { decodeTiff } from '../../../lib/tiffDecode';
import { sniffFormat } from '../../../lib/detectFileFormat';

self.onmessage = async (e) => {
  const { buffer, quality } = e.data;
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

    const decoded = await decodeTiff(buffer);
    // Defense in depth: even a file that starts with a valid TIFF magic
    // number can fail to yield usable dimensions (a malformed or
    // truncated IFD). Never let undefined/NaN reach OffscreenCanvas.
    if (!decoded || !Number.isFinite(decoded.width) || !Number.isFinite(decoded.height) || decoded.width <= 0 || decoded.height <= 0) {
      throw new Error('Decoded TIFF has no usable width/height');
    }
    const canvas = new OffscreenCanvas(decoded.width, decoded.height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(decoded.rgba), decoded.width, decoded.height), 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 });
    self.postMessage({ type: 'done', blob });
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

import { decodeTiff } from '../../../lib/tiffDecode';

self.onmessage = async (e) => {
  const { buffer } = e.data;
  try {
    const decoded = await decodeTiff(buffer);
    const canvas = new OffscreenCanvas(decoded.width, decoded.height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(decoded.rgba), decoded.width, decoded.height), 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    self.postMessage({ type: 'done', blob });
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err), knownLimitation: !!err?.knownLimitation });
  }
};

// P24 (03/10): reads every code in a picture with zxing-cpp (Apache-2.0, compiled to WebAssembly by zxing-wasm, MIT) —
// QR, Micro QR, Data Matrix, Aztec, PDF417, EAN-13/8, UPC-A/E, Code 128/39/93, ITF, Codabar… — as zxing.org does.
// jsQR (QR only, one code) stays the fallback and the camera's live decoder. The .wasm is served from /wasm, never from
// zxing-wasm's default CDN (same as Barcode Generator's read-back).
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';

prepareZXingModule({ overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? '/wasm/zxing_reader.wasm' : prefix + path) } });

self.onmessage = async ({ data }) => {
  const { id, image } = data; // ImageData
  try {
    const r = await readBarcodes(image, { formats: [], tryHarder: true, tryRotate: true, tryInvert: true, maxNumberOfSymbols: 20 });
    self.postMessage({ id, ok: true, codes: r.filter((x) => x.isValid && x.text !== '').map((x) => ({ text: x.text, format: x.format })) });
  } catch (e) {
    self.postMessage({ id, ok: false, error: String(e?.message || e) });
  }
};

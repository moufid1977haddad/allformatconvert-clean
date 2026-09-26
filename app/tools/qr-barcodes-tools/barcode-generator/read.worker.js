// Reads a generated barcode back with zxing-cpp (Apache-2.0, compiled to WebAssembly by zxing-wasm, MIT), a decoder
// independent of the engine that drew it (bwip-js). The .wasm is served from /wasm (public/wasm/zxing-LICENSE.txt),
// never from zxing-wasm's default CDN.
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';

prepareZXingModule({ overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? '/wasm/zxing_reader.wasm' : prefix + path) } });

self.onmessage = async ({ data }) => {
  const { id, image, format } = data; // image: ImageData
  try {
    const r = await readBarcodes(image, { formats: [format], tryHarder: true, tryRotate: true, maxNumberOfSymbols: 1 });
    const hit = r.find((x) => x.isValid) || r[0];
    self.postMessage({ id, ok: true, text: hit ? hit.text : null, format: hit?.format || null });
  } catch (e) {
    self.postMessage({ id, ok: false, error: String(e?.message || e) });
  }
};

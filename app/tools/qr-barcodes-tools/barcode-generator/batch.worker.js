// "Many (ZIP)": each code drawn (bwip-js on an OffscreenCanvas), read back (zxing-cpp) and encoded here, several
// Workers side by side. The page falls back to doing it itself where OffscreenCanvas is missing.
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import { byId } from './symbologies';
import { renderCanvas, cleanError, onWhite, READ_OPTIONS, readError, fileBytes } from './render';

prepareZXingModule({ overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? '/wasm/zxing_reader.wasm' : prefix + path) } });

const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : null;
self.onmessage = async ({ data }) => {
  const { id, bcid, value, ui, format } = data;
  if (!canvas) { self.postMessage({ id, fatal: 'no OffscreenCanvas' }); return; }
  const sym = byId(bcid);
  try {
    try { await renderCanvas(sym, value, ui, canvas); } catch (e) { throw new Error(cleanError(e)); }
    let skipped = true;
    if (sym.zxing) {
      const image = onWhite(canvas);
      const r = await readBarcodes(image, READ_OPTIONS(sym.zxing));
      const err = readError(sym, value, ui, (r.find((x) => x.isValid) || r[0])?.text ?? null);
      if (err) throw new Error(err);
      skipped = false;
    }
    const bytes = await fileBytes(sym, value, ui, canvas, format);
    self.postMessage({ id, bytes, skipped }, [bytes.buffer]);
  } catch (e) { self.postMessage({ id, error: e.message || String(e) }); }
};

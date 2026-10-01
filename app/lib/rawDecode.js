// Camera RAW files (P22, 02/10): CR2, CR3, NEF, ARW, DNG, ORF, RW2, RAF, PEF, SRW...
//
// Market: iLoveIMG's "Convert to JPG" takes RAW; CloudConvert and Convertio convert CR2, CR3, NEF, ARW, DNG, ORF,
// RW2, RAF and more. No browser decodes them. Engine: LibRaw 0.22.2 (the RAW library of rawpy, digiKam, Shotwell
// and many others), compiled by us to single-threaded WebAssembly (scripts/libraw-wasm/; CDDL-1.0, sources offered at
// /wasm/libraw-LICENSE.txt). Single-threaded on purpose: the npm build uses threads, which need cross-origin isolation
// and hang the Turbopack build (measured, plan D3). The 0.9 MB module (0.35 MB gzipped) is fetched on the first RAW.
//
// Development: the camera's white balance, the camera's colour matrix, sRGB primaries and tone curve, AHD demosaic,
// orientation from the file, full resolution. Runs in the converter's worker; returns plain RGBA memory, so a photo
// over Safari's 16.7 MP canvas limit is never put on one canvas (app/lib/bigImage.js takes it from there).

import { extOf } from './rawFormats';

let modulePromise = null;
function loadLibRaw() {
  if (!modulePromise) {
    modulePromise = (async () => {
      const [{ default: factory }, res] = await Promise.all([import('./libraw/libraw.mjs'), fetch('/wasm/libraw.wasm')]);
      if (!res.ok) throw new Error('the RAW decoder could not be loaded (check the connection and try again)');
      return factory({ wasmBinary: await res.arrayBuffer() });
    })().catch((e) => { modulePromise = null; throw e; });
  }
  return modulePromise;
}

// LibRaw error codes (libraw/libraw_const.h) -> what the visitor is told.
function explain(code, name) {
  if (code === -2) return `"${name}" is not a camera RAW file this tool can read: its camera or its compression is not supported by LibRaw`;
  if (code === -100007 || code === -100013) return `"${name}" needs more memory than this device gave the page. Close other tabs and try again, or convert it on a computer`;
  if (code === -100012) return `"${name}" is too large for the RAW decoder`;
  return `"${name}" looks damaged or incomplete: its RAW data could not be read`;
}

// Canon CR3 is an ISO-BMFF container: its top-level boxes declare their sizes. Measured 02/10: a CR3 cut by 1% loses
// the camera metadata at the end of its 'mdat' box and LibRaw develops the whole picture with other colours, without
// any error. So a box that runs past the end of the file means the file is incomplete. (TIFF-based RAW files are
// checked inside the decoder: scripts/libraw-wasm/glue.cpp.)
function isoBmffCutShort(bytes) {
  if (bytes.length < 12 || String.fromCharCode(...bytes.subarray(4, 8)) !== 'ftyp') return false;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 0;
  while (pos + 8 <= bytes.length) {
    let size = v.getUint32(pos);
    if (size === 1) {
      if (pos + 16 > bytes.length) return true;
      size = v.getUint32(pos + 8) * 2 ** 32 + v.getUint32(pos + 12);
    } else if (size === 0) return false; // runs to the end of the file by definition
    if (size < 8) return true;
    if (pos + size > bytes.length) return true;
    pos += size;
  }
  return pos !== bytes.length;
}

/**
 * Decodes a camera RAW file's bytes. checkSize(width, height) runs once the header is read, before any decoding,
 * and may throw (pixel limit). onLong(megapixels) runs just before the long, silent decode.
 * Returns { rgba: Uint8ClampedArray, width, height, camera }. Throws an Error whose message can be shown as is.
 */
export async function decodeRaw(bytes, name, { checkSize = () => {}, onLong = () => {} } = {}) {
  // Measured 02/10 on real files: LibRaw's Foveon development gives wrong colours (green leaves brown, red tulips pink,
  // next to the camera's own JPEG). A wrong-coloured photo is not given as a result.
  if (extOf(name) === 'x3f') throw new Error(`"${name}" is a Sigma X3F (Foveon sensor) file: this tool cannot develop it with correct colours. Export a TIFF or JPG from Sigma Photo Pro, then convert that`);
  if (isoBmffCutShort(bytes)) throw new Error(explain(-100008, name));
  const m = await loadLibRaw();
  let ptr = 0;
  try {
    ptr = m._malloc(bytes.length);
    if (!ptr) throw new Error(explain(-100007, name));
    m.HEAPU8.set(bytes, ptr);
    let r = m._lr_open(ptr, bytes.length);
    if (r !== 0) throw new Error(explain(r, name));
    const info = () => new Int32Array(m.HEAP32.buffer, m._lr_info(), 8);
    const [w0, h0, rawW, rawH] = info();
    if (!(w0 > 0 && h0 > 0)) throw new Error(explain(-100008, name));
    checkSize(w0, h0);
    onLong((rawW * rawH) / 1e6);
    r = m._lr_process();
    if (r !== 0) throw new Error(explain(r, name));
    const [width, height, , , , colors] = info();
    const px = m._lr_pixels();
    if (!px || !(width > 0 && height > 0)) throw new Error(explain(-100008, name));
    const n = width * height;
    const src = m.HEAPU8.subarray(px, px + n * colors);
    const rgba = new Uint8ClampedArray(n * 4);
    if (colors === 3) {
      for (let i = 0, j = 0; i < n; i++, j += 3) { const k = i * 4; rgba[k] = src[j]; rgba[k + 1] = src[j + 1]; rgba[k + 2] = src[j + 2]; rgba[k + 3] = 255; }
    } else {
      for (let i = 0; i < n; i++) { const k = i * 4; rgba[k] = rgba[k + 1] = rgba[k + 2] = src[i]; rgba[k + 3] = 255; }
    }
    const camera = m.UTF8ToString(m._lr_make_model()).trim();
    return { rgba, width, height, camera };
  } catch (e) {
    // A WebAssembly trap or an uncaught C++ exception (an allocation that failed) leaves the module unusable: a fresh
    // one is loaded for the next file.
    if (e instanceof WebAssembly.RuntimeError || (typeof WebAssembly.Exception === 'function' && e instanceof WebAssembly.Exception)) {
      modulePromise = null;
      throw new Error(explain(-100007, name));
    }
    if (e instanceof RangeError) throw new Error(explain(-100007, name)); // the page's own memory (the RGBA copy)
    throw e;
  } finally {
    try { m._lr_close(); if (ptr) m._free(ptr); } catch { /* module aborted: dropped above */ }
    // WebAssembly memory never shrinks: after a big file (a 46 MP RAW grows it to ~650 MB) the module is let go, so the
    // browser can take that memory back while the result is encoded -- it matters on iPhone and iPad. The next RAW
    // loads it again (the file is in the HTTP cache).
    if (m.HEAPU8.buffer.byteLength > 256 * 1024 * 1024) modulePromise = null;
  }
}

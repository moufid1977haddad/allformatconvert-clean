// AVIF encoding in a worker, shared (P21, 02/10): Image Compressor now keeps an AVIF as AVIF, as TinyPNG does (it was
// turned into a JPG). Same encoder and settings as Image Converter's: libavif in WebAssembly (@jsquash/avif 2.1.1,
// Apache-2.0; libavif + libaom BSD-2-Clause), single-threaded build (no SharedArrayBuffer on this site), wasm fetched
// from /wasm/avif_enc.wasm the first time it is needed.
let avifModulePromise = null;
function loadAvif() {
  if (!avifModulePromise) {
    avifModulePromise = (async () => {
      const [{ default: factory }, res] = await Promise.all([
        import('@jsquash/avif/codec/enc/avif_enc.js'),
        fetch('/wasm/avif_enc.wasm'),
      ]);
      if (!res.ok) throw new Error('AVIF encoder could not be loaded.');
      return factory({ wasmBinary: await res.arrayBuffer() });
    })().catch((e) => { avifModulePromise = null; throw e; });
  }
  return avifModulePromise;
}

/** RGBA pixels → a checked AVIF Blob (quality 0-100). */
export async function encodeAvif(rgba, width, height, quality) {
  const mod = await loadAvif();
  const bytes = mod.encode(new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength), width, height, {
    quality, qualityAlpha: -1, denoiseLevel: 0, tileRowsLog2: 0, tileColsLog2: 0, speed: 8,
    subsample: 1, chromaDeltaQ: false, sharpness: 0, tune: 0, enableSharpYUV: false, bitDepth: 8, lossless: false,
  });
  // Never trust an encoder's return value: a real AVIF file starts with an ISO-BMFF "ftyp" box naming avif/avis.
  const head = bytes ? String.fromCharCode(...bytes.slice(4, 12)) : '';
  if (!bytes || bytes.length < 100 || !/^ftyp(avif|avis)$/.test(head)) throw new Error('The AVIF encoder produced no valid file.');
  return new Blob([bytes], { type: 'image/avif' });
}

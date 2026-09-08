// Decodes a TIFF ArrayBuffer with the utif2 decoder and returns
// {width, height, rgba}. Shared by tiff-to-jpg, tiff-to-png and
// image-converter's Web Workers so this decode path -- and its guard
// against UTIF2's PlanarConfiguration=2 corruption bug -- lives in exactly
// one place instead of being duplicated (and patched separately) in three.
export async function decodeTiff(buffer) {
  const UTIF = (await import('utif2')).default;
  const ifds = UTIF.decode(buffer);
  if (!ifds.length) throw new Error('No image data found in this TIFF file');
  // UTIF.js only decodes chunky (interleaved) TIFFs correctly -- for a
  // planar one (PlanarConfiguration=2, color planes stored separately) it
  // still "succeeds" but silently produces corrupted, striped pixel data,
  // so this must be caught before decodeImage rather than left to ship a
  // garbled result.
  if (ifds[0].t284 && ifds[0].t284[0] === 2) {
    const err = new Error('This TIFF uses planar color storage (separate color-plane layout), which this decoder cannot read correctly. Re-save it with chunky/interleaved color storage first.');
    err.knownLimitation = true;
    throw err;
  }
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  return { width: ifds[0].width, height: ifds[0].height, rgba };
}

// UTIF2 can loop indefinitely while decoding certain non-standard
// big-endian LZW-compressed TIFFs (confirmed with the real libtiff
// test-suite file quad-lzw.tif: still running past a 15s hard kill under
// Node, and previously froze a browser tab that had to be force-closed).
// No cheap way to detect this ahead of time was found, so the caller must
// race decodeTiff() against this timeout and terminate the Worker if it
// fires -- decodeTiff runs synchronously once started and cannot be
// interrupted from the inside.
//
// Value chosen from real measurements (utif2 4.1.0, this exact decode
// path -- UTIF.decode + UTIF.decodeImage + UTIF.toRGBA8 -- run in Node
// against real files, libtiff test-suite unless noted):
//   ladoga.tif                (158x118,    74 KB, Deflate)        ~13ms
//   cramps.tif                (800x607,   734 KB, uncompressed)   ~15ms
//   pc260001.tif              (640x480,   614 KB, uncompressed)   ~16ms
//   dscf0013.tif              (640x480,   307 KB, uncompressed)   ~20ms
//   fax2d.tif                 (1728x1082, 234 KB, bi-level G3)    ~63ms
//   real photo, learningcontainer.com (~23.5MP, 17.5MB, uncompressed) ~748ms
// The largest real, valid file measured (23.5 megapixels) decodes in well
// under one second. 20s leaves more than 25x margin over that measurement
// while still failing well before a visitor gives up and force-closes the
// tab.
export const TIFF_DECODE_TIMEOUT_MS = 20000;

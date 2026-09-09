// UTIF2's toRGBA8 only correctly renders grayscale/RGB samples at 1 or 8
// bits per sample, plus a hardcoded 16-bit path that assumes the file's
// sample values span the *full* 0-65535 range (it always keeps just the
// high byte of each 16-bit value). Every other real, valid bit depth --
// 2, 4, 6, 10, 12, 14, 24, 32, all present in libtiff's own depth/
// conformance test files -- either has no matching branch at all (renders
// a solid black image with no error) or gets bit-reinterpreted as the
// wrong type (a real 32-bit *integer* RGB TIFF gets its bytes blindly
// read as IEEE-754 float, producing plausible-looking but meaningless
// pixels). And even the "supported" 16-bit path silently produces a
// near-black image for real 16-bit scanner/sensor/scientific TIFFs that
// don't use the full nominal range -- ladoga.tif (real libtiff test file,
// elevation data) only uses 1290-1681 out of 0-65535. All of these are
// the same class of defect: a valid decode, a wrong result, and no
// warning -- worst possible outcome for a tool whose only job is to show
// the user their image.
//
// This repacks any non-8-bit, non-1-bit, non-float grayscale or RGB
// image into a synthetic 16-bit-per-sample buffer, linearly stretched so
// the image's own actual minimum and maximum sample values map to 0 and
// 65535. UTIF2's existing 16-bit rendering path (correct for full-range
// data) then does the rest, without needing to touch UTIF2's own code.
// This is a no-op for images that already use close to their full
// nominal range (ordinary well-exposed 16-bit photos), so it can't
// regress those, and it never runs at all for 8-bit files (the vast
// majority of real-world TIFFs) since bps===8 returns immediately.
//
// Deliberately NOT applied to: 1-bit (exact 0/255 mapping already,
// nothing to stretch), 8-bit (native path, left untouched), palette
// images (interpretation 3 -- sample values are color-map indices, not
// intensities, so rescaling them would corrupt the lookup instead of
// fixing anything), and any declared floating-point sample format
// (already has dedicated handling in UTIF2, and no real float32 TIFF was
// available to validate a change against -- see tiffDecode.test notes
// in the fix report).
function normalizeHighBitDepth(ifd) {
  const bpsArr = ifd.t258;
  if (!bpsArr || !bpsArr.length) return;
  const bps = bpsArr[0];
  if (bps === 8 || bps === 1) return;

  const intp = ifd.t262 ? ifd.t262[0] : 2;
  if (intp !== 0 && intp !== 1 && intp !== 2) return; // WhiteIsZero / BlackIsZero / RGB only

  const sfmt = ifd.t339 ? ifd.t339[0] : 1; // 1=unsigned, 2=signed, 3=float
  if (sfmt === 3) return; // real float data -- leave to UTIF2's existing handling

  const w = ifd.width, h = ifd.height;
  const smpls = ifd.t277 ? ifd.t277[0] : bpsArr.length;
  const data = ifd.data;
  const bpl = Math.ceil((bps * smpls * w) / 8);
  const byteAligned = bps % 8 === 0;
  const bytesPerSample = bps / 8;
  // UTIF2's decodeImage() already normalizes 16-bit data to little-endian
  // regardless of the file's own byte order; it does NOT do this for
  // 24/32-bit samples, which keep the file's original order.
  const isLE = bps === 16 ? true : !!ifd.isLE;

  function readByteAligned(byteOffset) {
    let v = 0;
    if (isLE) { for (let k = bytesPerSample - 1; k >= 0; k--) v = v * 256 + data[byteOffset + k]; }
    else { for (let k = 0; k < bytesPerSample; k++) v = v * 256 + data[byteOffset + k]; }
    return v;
  }

  // Sub-byte sample widths (2/4/6/10/12/14-bit) are packed MSB-first as a
  // pure bitstream per the TIFF spec, independent of the file's byte
  // order -- matches UTIF2's own existing 1/2/4-bit unpacking.
  function readPacked(bitOffset) {
    let v = 0, bitsRead = 0, byteIndex = bitOffset >> 3, bitInByte = bitOffset & 7;
    while (bitsRead < bps) {
      const avail = 8 - bitInByte;
      const take = Math.min(avail, bps - bitsRead);
      const shift = avail - take;
      const mask = (1 << take) - 1;
      v = v * (1 << take) + ((data[byteIndex] >> shift) & mask);
      bitsRead += take;
      bitInByte += take;
      if (bitInByte === 8) { bitInByte = 0; byteIndex++; }
    }
    return v;
  }

  function toSigned(v) {
    if (sfmt !== 2) return v;
    const half = Math.pow(2, bps - 1);
    return v >= half ? v - Math.pow(2, bps) : v;
  }

  const total = w * h * smpls;
  const values = new Array(total);
  let min = Infinity, max = -Infinity;
  let vi = 0;
  for (let y = 0; y < h; y++) {
    const rowBitStart = y * bpl * 8;
    for (let x = 0; x < w * smpls; x++) {
      const bitOffset = rowBitStart + x * bps;
      const raw = byteAligned ? readByteAligned(bitOffset >> 3) : readPacked(bitOffset);
      const val = toSigned(raw);
      values[vi++] = val;
      if (val < min) min = val;
      if (val > max) max = val;
    }
  }

  const range = max - min;
  const scale = range > 0 ? 65535 / range : 0;
  const out = new Uint8Array(total * 2);
  for (let i = 0; i < total; i++) {
    const norm = range > 0 ? Math.round((values[i] - min) * scale) : 0;
    out[i * 2] = norm & 255;
    out[i * 2 + 1] = (norm >> 8) & 255;
  }

  ifd.data = out;
  ifd.t258 = new Array(bpsArr.length).fill(16);
}

// Decodes a TIFF ArrayBuffer with the utif2 decoder and returns
// {width, height, rgba}. Shared by tiff-to-jpg, tiff-to-png and
// image-converter's Web Workers so this decode path -- and its guards
// against UTIF2's known corruption/scaling bugs -- lives in exactly one
// place instead of being duplicated (and patched separately) in three.
// UTIF2's CMYK (PhotometricInterpretation=5) rendering path unconditionally
// reads `window.UDOC` (an optional external color-management library this
// project never loads) to decide how to convert CMYK to RGB. On the main
// thread `window` exists and `window.UDOC` is simply undefined/falsy, so it
// silently falls back to its own built-in conversion below -- but inside a
// Worker (this module's only caller now) there is no `window` global at
// all, so that line throws ReferenceError and a CMYK TIFF that used to
// decode fine now hard-crashes. Rather than shim a global (bundlers can
// rewrite/scope `window` references unpredictably -- tried, didn't
// reliably reach UTIF2's compiled code), this replicates UTIF2's own
// UDOC-less conversion formula directly, bypassing that code path entirely.
function cmykToRGBA8(ifd) {
  const w = ifd.width, h = ifd.height, area = w * h;
  const smpls = ifd.t277 ? ifd.t277[0] : 4;
  const data = ifd.data;
  const gotAlpha = smpls > 4 ? 1 : 0;
  const img = new Uint8Array(area * 4);
  for (let i = 0; i < area; i++) {
    const qi = i << 2, si = i * smpls;
    const C = 255 - data[si], M = 255 - data[si + 1], Y = 255 - data[si + 2], K = (255 - data[si + 3]) * (1 / 255);
    img[qi] = ~~(C * K + 0.5);
    img[qi + 1] = ~~(M * K + 0.5);
    img[qi + 2] = ~~(Y * K + 0.5);
    img[qi + 3] = 255 * (1 - gotAlpha) + data[si + 4] * gotAlpha;
  }
  return img;
}

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
  const intp = ifds[0].t262 ? ifds[0].t262[0] : 2;
  // UTIF2's CMYK rendering always reads one raw byte per sample with no
  // bit-depth awareness at all -- correct for 8-bit CMYK, but for 16-bit
  // CMYK it reads half the real samples at the wrong byte offsets and
  // "succeeds" with a visibly garbled image instead of erroring (confirmed
  // with the real libtiff depth/ test file flower-separated-contig-16.tif).
  // This must be rejected explicitly rather than left to silently ship
  // noise.
  if (intp === 5 && ifds[0].t258 && ifds[0].t258[0] !== 8) {
    const err = new Error('This TIFF uses CMYK color at ' + ifds[0].t258[0] + ' bits per channel, which this decoder can only read correctly at 8 bits per channel. Re-save it as 8-bit CMYK, or convert it to RGB first.');
    err.knownLimitation = true;
    throw err;
  }
  UTIF.decodeImage(buffer, ifds[0]);
  try { normalizeHighBitDepth(ifds[0]); } catch { /* fall back to UTIF2's native (pre-existing) handling for this bit depth if our repacking hits a layout it doesn't understand */ }
  const rgba = intp === 5 ? cmykToRGBA8(ifds[0]) : UTIF.toRGBA8(ifds[0]);
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

// Shared verbatim across tiff-to-jpg, tiff-to-png and image-converter so
// the three tools can never drift out of sync on wording.
export const TIFF_DECODE_TIMEOUT_MESSAGE = "This file is taking far longer than a normal TIFF to decode, which usually means it uses a TIFF variant this tool can't read correctly (this happens with some non-standard LZW-compressed TIFFs). Try re-saving the file with a different compression setting (Deflate/ZIP or uncompressed) in an image editor such as GIMP or IrfanView, or convert it with desktop software and re-upload the result.";

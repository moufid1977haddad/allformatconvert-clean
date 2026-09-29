// Measured directly in real Chrome (not Node -- there's no DOM/Canvas to
// proxy this with) using OffscreenCanvas.convertToBlob on a synthetic
// photo-like image: a gradient base plus mild per-pixel grain (real camera
// sensor noise, not full random static -- pure noise pathologically defeats
// WebP's compressor in a way no real photo does, which would make the cap
// unrealistically strict). Time is the binding constraint, not memory --
// canvas backing stores aren't reliably visible via performance.memory
// anyway.
//
// WebP encoding time explodes non-linearly past a threshold, unlike JPEG/
// PNG/AVIF which scale smoothly even at 48MP+ for the same content:
//   24MP: 3.3s   30MP: 5.5s   32.7MP: 4.6s   34MP: 9.2s   40MP: 18.1s
// (Chrome's WebP encoder appears to hit an internal tiling/method
// threshold somewhere around 32-36MP with grainy content.) 30MP is kept
// for real margin (63%) under a 15s real-browser budget -- these are
// direct browser measurements, no Node-to-Chrome scaling factor needed.
// Applied uniformly across output formats for one simple, safe cap rather
// than a per-format table; JPEG/PNG/AVIF have large margin to spare at
// this size (JPEG: 1.7s at 48MP; PNG: 3.2s at 48MP).
// Above this size WebP goes to libwebp in WebAssembly instead (app/lib/bigImage.js).
export const NATIVE_WEBP_MAX_PIXELS = 30_000_000;

// 30/09 (owner's iPhone): the old 12 MP phone cap refused every iPhone photo (4032 x 3024 = 12.19 MP). No
// competitor publishes a pixel cap -- they cap the file (Convertio 100 MB, CloudConvert/FreeConvert 1 GB) --
// so the cap is now set by what was measured to finish (scripts/browser-tests/big-image.mjs,
// docs/audit/RAPPORT-safari-iphone-30-09.md): past Safari's 16.7 MP canvas limit the image is decoded in
// bands and encoded in WebAssembly, never on one canvas.
export const MAX_MEGAPIXELS = 100;
// Phones: every iPhone photo, 48 MP (8064 x 6048 = 48.8 MP) included.
export const MOBILE_MAX_MEGAPIXELS = 50;

// Coarse defense-in-depth file-size backstop -- decode cost is driven by
// pixel count (checked above), not file bytes, but this catches a
// malformed or pathologically uncompressed file before it's even handed
// to the decoder.
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_FILE_SIZE_LABEL = '100 MB';
// Same on phones since 30/09: a 48 MP iPhone JPEG reaches 20-30 MB; decode cost is capped by pixels above.
export const MOBILE_MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;
export const MOBILE_MAX_FILE_SIZE_LABEL = MAX_FILE_SIZE_LABEL;

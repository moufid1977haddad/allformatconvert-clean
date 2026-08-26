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
export const MAX_MEGAPIXELS = 30;

// Mobile/tablet cap: no real-device data available (this project's
// measurement environment is desktop-only), so kept well under the
// desktop-safe tier to absorb a mobile CPU that could plausibly be
// several times slower at WASM/SIMD-heavy image encoding -- 12MP is also
// a typical default phone-camera resolution, not an unusual ceiling.
export const MOBILE_MAX_MEGAPIXELS = 12;

// Coarse defense-in-depth file-size backstop -- decode cost is driven by
// pixel count (checked above), not file bytes, but this catches a
// malformed or pathologically uncompressed file before it's even handed
// to the decoder.
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_FILE_SIZE_LABEL = '100 MB';
export const MOBILE_MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB
export const MOBILE_MAX_FILE_SIZE_LABEL = '30 MB';

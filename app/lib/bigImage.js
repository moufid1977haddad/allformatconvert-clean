// Full-resolution images larger than Safari on iPhone/iPad can put on one canvas.
//
// iOS Safari refuses any canvas over 16,777,216 pixels (4096 x 4096): the context comes back null or the
// drawing is silently blank. An iPhone photo is 12.2 MP (fits), but 24 MP (iPhone 15/16 default) and 48 MP
// photos do not. So above that size nothing here ever creates a canvas bigger than the cap:
//   decode  -- the browser's own decoder, one horizontal band at a time (createImageBitmap with a crop
//              rectangle: WebKit decodes the file natively and only allocates the band), copied into one
//              plain RGBA buffer (memory, not a canvas);
//   encode  -- WebAssembly encoders working on that buffer (MozJPEG, libwebp, libavif), and PNG written here
//              over the browser's own deflate (CompressionStream).
// Measured (scripts/browser-tests/big-image.mjs): Firefox and WebKit crop an EXIF-rotated photo in display
// coordinates, as the spec says; Chromium 151 returns the band mirrored vertically for a rotated JPEG. The
// band path is therefore used only where one canvas cannot hold the image (probed: a 4097 x 4097 canvas) and
// after a 1 KB rotated probe proves banding right in this browser. Desktop browsers keep one canvas and their
// own, faster, encoders.
//
// Runs in a Worker or on the page (OffscreenCanvas when there is one).

export const CANVAS_MAX_PIXELS = 16_777_216;

const newCanvas = (w, h) => {
  if (w * h > CANVAS_MAX_PIXELS) throw new Error('internal: canvas over the Safari limit');
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
};

// 8x4 JPEG, left half red, right half blue, EXIF orientation 6 -> shown 4x8, red on top.
const PROBE = '/9j/4QC8RXhpZgAASUkqAAgAAAAGABIBAwABAAAABgAAABoBBQABAAAAVgAAABsBBQABAAAAXgAAACgBAwABAAAAAgAAABMCAwABAAAAAQAAAGmHBAABAAAAZgAAAAAAAAA4YwAA6AMAADhjAADoAwAABgAAkAcABAAAADAyMTABkQcABAAAAAECAwAAoAcABAAAADAxMDABoAMAAQAAAP//AAACoAQAAQAAAAgAAAADoAQAAQAAAAQAAAAAAAAA/+IB8ElDQ19QUk9GSUxFAAEBAAAB4GxjbXMEIAAAbW50clJHQiBYWVogB+IAAwAUAAkADgAdYWNzcE1TRlQAAAAAc2F3c2N0cmwAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1oYW5keem/Vlo+AbaDI4VVRvdPqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKZGVzYwAAAPwAAAAkY3BydAAAASAAAAAid3RwdAAAAUQAAAAUY2hhZAAAAVgAAAAsclhZWgAAAYQAAAAUZ1hZWgAAAZgAAAAUYlhZWgAAAawAAAAUclRSQwAAAcAAAAAgZ1RSQwAAAcAAAAAgYlRSQwAAAcAAAAAgbWx1YwAAAAAAAAABAAAADGVuVVMAAAAIAAAAHABzAFIARwBCbWx1YwAAAAAAAAABAAAADGVuVVMAAAAGAAAAHABDAEMAMAAAWFlaIAAAAAAAAPbWAAEAAAAA0y1zZjMyAAAAAAABDD8AAAXd///zJgAAB5AAAP2S///7of///aIAAAPcAADAcVhZWiAAAAAAAABvoAAAOPIAAAOPWFlaIAAAAAAAAGKWAAC3iQAAGNpYWVogAAAAAAAAJKAAAA+FAAC2xHBhcmEAAAAAAAMAAAACZmkAAPKnAAANWQAAE9AAAApb/9sAQwABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB/9sAQwEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB/8AAEQgABAAIAwERAAIRAQMRAf/EABQAAQAAAAAAAAAAAAAAAAAAAAr/xAAYEAACAwAAAAAAAAAAAAAAAAAACEaGxv/EABQBAQAAAAAAAAAAAAAAAAAAAAn/xAAZEQACAwEAAAAAAAAAAAAAAAAACkiHx4j/2gAMAwEAAhEDEQA/ADRtVA7RnRUFl5sc3b2NQwzEO/sUP//Z';
let bandProbe = null;
export function bandDecodeWorks() {
  if (!bandProbe) {
    bandProbe = (async () => {
      try {
        const bytes = Uint8Array.from(atob(PROBE), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        const top = await createImageBitmap(blob, 0, 0, 4, 4);
        const c = newCanvas(4, 4), ctx = c.getContext('2d');
        ctx.drawImage(top, 0, 0); top.close();
        const d = ctx.getImageData(1, 1, 1, 1).data;
        return d[0] > 128 && d[2] < 128; // red: the crop is the top of the image as shown
      } catch { return false; }
    })();
  }
  return bandProbe;
}

// Decoded image. `canvas` is set only when the image fits one canvas; rgba() is always available.
export class Raster {
  constructor(width, height, canvas, data) { this.width = width; this.height = height; this.canvas = canvas; this.data = data; }
  get pixels() { return this.width * this.height; }
  rgba() {
    if (!this.data) this.data = this.canvas.getContext('2d').getImageData(0, 0, this.width, this.height).data;
    return this.data;
  }
  imageData() { return { data: this.rgba(), width: this.width, height: this.height }; }
}

export function rasterFromCanvas(canvas, width, height) { return new Raster(width, height, canvas, null); }
export function rasterFromRGBA(data, width, height) { return new Raster(width, height, null, data); }

// Displayed size (EXIF orientation applied) from an <img>, which only reads the header. Page only (DOM).
// null when this browser cannot open the file (e.g. HEIC outside Safari).
export function imageDims(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.naturalWidth > 0 ? { width: img.naturalWidth, height: img.naturalHeight } : null); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// Decodes `blob` at full resolution. dims = {width, height} as displayed (EXIF applied), measured on the page
// with <img> (header only); needed for the band path.
export async function decodeToRaster(blob, dims, { onProgress = () => {}, forceBands = false } = {}) {
  const big = dims && dims.width * dims.height > CANVAS_MAX_PIXELS;
  // Bands only where one canvas can't hold the image (iOS/iPadOS): elsewhere one canvas keeps the browser's own,
  // much faster, encoders. forceBands: set by the browser tests to run the iOS path in Firefox.
  const needBands = !!dims && (forceBands || (big && !(await canvasBeyondSafariCap())));
  if (needBands) {
    const { width: W, height: H } = dims;
    const bandH = Math.max(1, Math.min(H, forceBands && !big ? Math.ceil(H / 3) : Math.floor(CANVAS_MAX_PIXELS / W)));
    const crop = await bandDecodeWorks();
    // P16 (30/09): where the cropped decode is not right (Chromium: rotated JPEGs come back mirrored; any engine
    // whose probe fails), the photo was refused ("too-big-for-canvas") instead of being processed. It is now decoded
    // once as an ImageBitmap (not a canvas: no 16.7 MP limit) and copied band by band -- like forEachBand below.
    const full = crop ? null : await createImageBitmap(blob);
    if (full && (full.width !== W || full.height !== H)) { full.close(); throw new Error('decode-mismatch'); }
    const out = new Uint8ClampedArray(W * H * 4);
    const c = newCanvas(W, bandH), ctx = c.getContext('2d', { willReadFrequently: true });
    for (let y = 0; y < H; y += bandH) {
      const h = Math.min(bandH, H - y);
      ctx.clearRect(0, 0, W, bandH);
      if (crop) {
        const bmp = await createImageBitmap(blob, 0, y, W, h);
        if (bmp.width !== W || bmp.height !== h) { bmp.close(); throw new Error('decode-mismatch'); }
        ctx.drawImage(bmp, 0, 0); bmp.close();
      } else ctx.drawImage(full, 0, y, W, h, 0, 0, W, h);
      out.set(ctx.getImageData(0, 0, W, h).data, y * W * 4);
      onProgress((y + h) / H);
    }
    if (full) full.close();
    c.width = c.height = 1;
    return new Raster(W, H, null, out);
  }
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp;
  if (width * height > CANVAS_MAX_PIXELS && !(await canvasBeyondSafariCap())) {
    // dims unknown (the page could not read the header): the size is known now, decode by bands from this bitmap
    bmp.close();
    return decodeToRaster(blob, { width, height }, { onProgress });
  }
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width, height) : Object.assign(document.createElement('canvas'), { width, height });
  c.getContext('2d').drawImage(bmp, 0, 0);
  bmp.close();
  return new Raster(width, height, c, null);
}

// A canvas bigger than 16.7 MP works everywhere except iOS/iPadOS WebKit (and old Android WebViews). Probed once
// with a 4097 x 4097 canvas: on iOS its context is null or a pixel written to it reads back as 0.
let bigCanvasProbe = null;
export function canvasBeyondSafariCap() {
  // Browser tests set __forceSafariCanvasCap to run the iPhone path in Firefox/Chromium/WebKit.
  if (typeof self !== 'undefined' && self.__forceSafariCanvasCap === true) return Promise.resolve(false);
  if (!bigCanvasProbe) {
    bigCanvasProbe = (async () => {
      try {
        const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(4097, 4097) : Object.assign(document.createElement('canvas'), { width: 4097, height: 4097 });
        const ctx = c.getContext('2d');
        if (!ctx) return false;
        ctx.fillStyle = '#ff0000'; ctx.fillRect(4096, 4096, 1, 1);
        const ok = ctx.getImageData(4096, 4096, 1, 1).data[0] === 255;
        c.width = c.height = 1;
        return ok;
      } catch { return false; }
    })();
  }
  return bigCanvasProbe;
}

// Browser tests only (P16): the iPhone's canvas limit reproduced in a Worker, where the page's init script cannot
// reach -- set when the page passes `canvasCap: true` (its window.__forceSafariCanvasCap). As on iOS, a canvas over
// 16.7 MP gets no context, and drawing into or reading one that was enlarged past it fails. Same rules as the
// page-side copy in scripts/browser-tests/lib/ios-canvas-cap.mjs.
export function simulateIosCanvasCap() {
  self.__forceSafariCanvasCap = true;
  if (self.__iosCanvasCapInstalled) return;
  self.__iosCanvasCapInstalled = true;
  const over = (c) => c && c.width * c.height > CANVAS_MAX_PIXELS;
  const refuse = () => { self.__iosCanvasCapHits = (self.__iosCanvasCapHits || 0) + 1; };
  for (const C of [self.OffscreenCanvas, self.HTMLCanvasElement]) {
    if (!C) continue;
    const get = C.prototype.getContext;
    C.prototype.getContext = function (...a) { if (over(this)) { refuse(); return null; } return get.apply(this, a); };
  }
  for (const X of [self.OffscreenCanvasRenderingContext2D, self.CanvasRenderingContext2D]) {
    if (!X) continue;
    for (const m of ['drawImage', 'getImageData', 'putImageData']) {
      const f = X.prototype[m];
      X.prototype[m] = function (...a) { if (over(this.canvas)) { refuse(); throw new Error('Simulated iPhone canvas limit: canvas over 16,777,216 pixels'); } return f.apply(this, a); };
    }
  }
}

export function hasAlpha(rgba) { for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 255) return true; return false; }

export function flattenedOnWhite(rgba, bg = [255, 255, 255]) {
  if (!hasAlpha(rgba)) return rgba;
  const d = new Uint8ClampedArray(rgba);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    d[i] = d[i] * a + bg[0] * (1 - a); d[i + 1] = d[i + 1] * a + bg[1] * (1 - a); d[i + 2] = d[i + 2] * a + bg[2] * (1 - a); d[i + 3] = 255;
  }
  return d;
}
export const hexToRgb = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); const n = m ? parseInt(m[1], 16) : 0xffffff; return [n >> 16, (n >> 8) & 255, n & 255]; };

// ---- WebAssembly encoders (same builds and options as Image Compressor) -------------------------------------
const wasmCache = {};
function wasm(name) {
  if (!wasmCache[name]) {
    wasmCache[name] = fetch(`/wasm/${name}`).then((r) => {
      if (!r.ok) throw new Error('The image encoder could not be loaded. Check your connection and try again.');
      return r.arrayBuffer();
    }).catch((e) => { delete wasmCache[name]; throw e; });
  }
  return wasmCache[name];
}
let mozPromise = null, webpPromise = null;
const moz = () => (mozPromise ||= (async () => {
  const [{ default: factory }, bin] = await Promise.all([import('@jsquash/jpeg/codec/enc/mozjpeg_enc.js'), wasm('mozjpeg_enc.wasm')]);
  return factory({ wasmBinary: bin });
})().catch((e) => { mozPromise = null; throw e; }));
const webpMod = () => (webpPromise ||= (async () => {
  const [{ default: factory }, bin] = await Promise.all([import('@jsquash/webp/codec/enc/webp_enc.js'), wasm('webp_enc.wasm')]);
  return factory({ wasmBinary: bin });
})().catch((e) => { webpPromise = null; throw e; }));

const MOZ_OPTIONS = {
  baseline: false, arithmetic: false, progressive: true, optimize_coding: true, smoothing: 0, color_space: 3,
  quant_table: 3, trellis_multipass: false, trellis_opt_zero: false, trellis_opt_table: false, trellis_loops: 1,
  auto_subsample: true, chroma_subsample: 2, separate_chroma_quality: false, chroma_quality: 75,
};
const WEBP_OPTIONS = {
  target_size: 0, target_PSNR: 0, method: 4, sns_strength: 50, filter_strength: 60, filter_sharpness: 0, filter_type: 1,
  partitions: 0, segments: 4, pass: 1, show_compressed: 0, preprocessing: 0, autofilter: 0, partition_limit: 0,
  alpha_compression: 1, alpha_filtering: 1, alpha_quality: 100, lossless: 0, exact: 0, image_hint: 0,
  emulate_jpeg_size: 0, thread_level: 0, low_memory: 0, near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0,
};

// quality 0-100. Opaque output: transparency flattened onto white first.
// chroma420 (P32, 04/10): keep 4:2:0 colour sampling at any quality. By default (auto_subsample) MozJPEG switches to
// 4:4:4 from quality 90, and its memory goes from 3.9 to 5.4 times the RGBA size (measured: a 63 MP image needs
// 939 MB of WebAssembly memory at 4:2:0, 1,299 MB at 4:4:4) -- the difference between a phone keeping the page or not.
export async function encodeJpegWasm(rgba, width, height, quality, background = '#ffffff', { chroma420 = false } = {}) {
  const m = await moz();
  const out = m.encode(flattenedOnWhite(rgba, hexToRgb(background)), width, height, { ...MOZ_OPTIONS, quality, ...(chroma420 ? { auto_subsample: false, chroma_subsample: 2 } : {}) });
  if (!out || out.length < 4 || out[0] !== 0xff || out[1] !== 0xd8) throw new Error('The JPEG encoder produced no valid file.');
  return new Blob([out], { type: 'image/jpeg' });
}

// libwebp, the encoder Squoosh uses. WebP cannot exceed 16383 px on a side (format limit).
export const WEBP_MAX_SIDE = 16383;
export async function encodeWebpWasm(rgba, width, height, quality, { lossless = false } = {}) {
  if (width > WEBP_MAX_SIDE || height > WEBP_MAX_SIDE) throw new Error(`WebP cannot be wider or taller than ${WEBP_MAX_SIDE} pixels (a limit of the format). Choose JPG, PNG or AVIF for this image.`);
  const m = await webpMod();
  // lossless (P24): libwebp's own lossless mode, every pixel kept (exact: colours under transparent pixels kept too)
  const out = m.encode(rgba, width, height, lossless ? { ...WEBP_OPTIONS, lossless: 1, exact: 1, quality: 100, method: 4 } : { ...WEBP_OPTIONS, quality });
  if (!out || out.length < 12 || String.fromCharCode(...out.slice(8, 12)) !== 'WEBP') throw new Error('The WebP encoder produced no valid file.');
  return new Blob([out], { type: 'image/webp' });
}

// ---- PNG over CompressionStream ------------------------------------------------------------------------------
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(parts) { let c = 0xffffffff; for (const p of parts) for (let i = 0; i < p.length; i++) c = CRC_TABLE[(c ^ p[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const head = new Uint8Array(8), tail = new Uint8Array(4), t = new TextEncoder().encode(type);
  new DataView(head.buffer).setUint32(0, data.length); head.set(t, 4);
  new DataView(tail.buffer).setUint32(0, crc32([t, data]));
  return [head, data, tail];
}

// Lossless PNG, 8-bit RGB or RGBA, adaptive row filter (the "minimum sum of absolute differences" heuristic of
// libpng/zlib's own tools), written as rows arrive: only the compressed file is kept, never a second full copy of
// the pixels. Never needs a canvas.
export function createPngWriter(width, height, alpha) {
  if (typeof CompressionStream === 'undefined') throw new Error('This browser cannot write PNG files this large (it needs Safari 16.4 or later, or a current Chrome, Edge or Firefox).');
  const bpp = alpha ? 4 : 3, stride = width * bpp;
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  const idat = [];
  const reading = (async () => { const r = cs.readable.getReader(); for (;;) { const { value, done } = await r.read(); if (done) break; idat.push(value); } })();
  let prev = new Uint8Array(stride), cur = new Uint8Array(stride), written = 0;
  const cand = [new Uint8Array(stride + 1), new Uint8Array(stride + 1), new Uint8Array(stride + 1), new Uint8Array(stride + 1)];
  return {
    /** rgba: `rows` rows of RGBA pixels (width * rows * 4). */
    async writeRows(rgba, rows) {
      const batch = new Uint8Array(rows * (stride + 1));
      for (let r = 0; r < rows; r++) {
        let o = r * width * 4;
        if (alpha) cur.set(rgba.subarray(o, o + stride));
        else for (let x = 0, j = 0; x < width; x++, o += 4) { cur[j++] = rgba[o]; cur[j++] = rgba[o + 1]; cur[j++] = rgba[o + 2]; }
        // 0 None, 1 Sub, 2 Up, 4 Paeth
        const [n, s, u, p] = cand; n[0] = 0; s[0] = 1; u[0] = 2; p[0] = 4;
        let sn = 0, ss = 0, su = 0, sp = 0;
        for (let i = 0; i < stride; i++) {
          const x = cur[i], a = i >= bpp ? cur[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
          const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          const vs = (x - a) & 255, vu = (x - b) & 255, vp = (x - pr) & 255;
          n[i + 1] = x; s[i + 1] = vs; u[i + 1] = vu; p[i + 1] = vp;
          sn += x < 128 ? x : 256 - x; ss += vs < 128 ? vs : 256 - vs; su += vu < 128 ? vu : 256 - vu; sp += vp < 128 ? vp : 256 - vp;
        }
        batch.set(sn <= ss && sn <= su && sn <= sp ? n : ss <= su && ss <= sp ? s : su <= sp ? u : p, r * (stride + 1));
        [prev, cur] = [cur, prev];
      }
      written += rows;
      await writer.ready;
      writer.write(batch);
    },
    async finish() {
      if (written !== height) throw new Error('internal: PNG rows missing');
      await writer.close();
      await reading;
      const ihdr = new Uint8Array(13), v = new DataView(ihdr.buffer);
      v.setUint32(0, width); v.setUint32(4, height); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2;
      const parts = [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ...chunk('IHDR', ihdr)];
      for (const d of idat) parts.push(...chunk('IDAT', d));
      parts.push(...chunk('IEND', new Uint8Array(0)));
      return new Blob(parts, { type: 'image/png' });
    },
  };
}

export async function encodePngRGBA(rgba, width, height, onProgress = () => {}) {
  const w = createPngWriter(width, height, hasAlpha(rgba));
  const rows = Math.max(1, Math.floor((1 << 20) / (width * 4)));
  for (let y = 0; y < height; y += rows) {
    const h = Math.min(rows, height - y);
    await w.writeRows(rgba.subarray(y * width * 4, (y + h) * width * 4), h);
    onProgress((y + h) / height);
  }
  return w.finish();
}

// Area-average downscale of an RGBA buffer (for small derived images: icons, thumbnails). Premultiplied, so
// transparent pixels don't bleed their colour into the edges.
export function downscaleRGBA(src, sw, sh, dw, dh) {
  const out = new Uint8ClampedArray(dw * dh * 4);
  const acc = new Float64Array(dw * 4), cnt = new Float64Array(dw);
  const sx = sw / dw, sy = sh / dh;
  for (let y = 0; y < dh; y++) {
    acc.fill(0); cnt.fill(0);
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let yy = y0; yy < y1 && yy < sh; yy++) {
      for (let x = 0; x < dw; x++) {
        const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
        for (let xx = x0; xx < x1 && xx < sw; xx++) {
          const i = (yy * sw + xx) * 4, a = src[i + 3];
          acc[x * 4] += src[i] * a; acc[x * 4 + 1] += src[i + 1] * a; acc[x * 4 + 2] += src[i + 2] * a; acc[x * 4 + 3] += a; cnt[x]++;
        }
      }
    }
    for (let x = 0; x < dw; x++) {
      const a = acc[x * 4 + 3], o = (y * dw + x) * 4;
      if (a > 0) { out[o] = acc[x * 4] / a; out[o + 1] = acc[x * 4 + 1] / a; out[o + 2] = acc[x * 4 + 2] / a; }
      out[o + 3] = a / cnt[x];
    }
  }
  return out;
}

/**
 * Reads `blob` at full resolution, band by band, into `fn(rgba, y, rows)` -- never more than maxBandPixels decoded
 * pixels at once in the page (iPhone: the photo is decoded natively for each band; nothing close to the 16.7 MP
 * canvas limit, and no full-size copy). rgba may be modified by fn (it is the band's own buffer).
 */
export async function forEachBand(blob, dims, maxBandPixels, fn) {
  const { width: W, height: H } = dims;
  const bandH = Math.max(1, Math.min(H, Math.floor(maxBandPixels / W)));
  const c = newCanvas(W, bandH), ctx = c.getContext('2d', { willReadFrequently: true });
  const crop = await bandDecodeWorks();
  // Chromium crops rotated photos wrongly (see top): it decodes once instead; it has no 16.7 MP limit anyway.
  const full = crop ? null : await createImageBitmap(blob);
  if (full && (full.width !== W || full.height !== H)) { full.close(); throw new Error('decode-mismatch'); }
  for (let y = 0; y < H; y += bandH) {
    const h = Math.min(bandH, H - y);
    ctx.clearRect(0, 0, W, bandH);
    if (crop) {
      const bmp = await createImageBitmap(blob, 0, y, W, h);
      if (bmp.width !== W || bmp.height !== h) { bmp.close(); throw new Error('decode-mismatch'); }
      ctx.drawImage(bmp, 0, 0); bmp.close();
    } else ctx.drawImage(full, 0, y, W, h, 0, 0, W, h);
    await fn(ctx.getImageData(0, 0, W, h).data, y, h);
  }
  if (full) full.close();
  c.width = c.height = 1;
}

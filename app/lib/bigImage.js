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
  if (dims && (forceBands || (big && !(await canvasBeyondSafariCap()))) && (await bandDecodeWorks())) {
    const { width: W, height: H } = dims;
    const bandH = Math.max(1, Math.min(H, forceBands && !big ? Math.ceil(H / 3) : Math.floor(CANVAS_MAX_PIXELS / W)));
    const out = new Uint8ClampedArray(W * H * 4);
    const c = newCanvas(W, bandH), ctx = c.getContext('2d', { willReadFrequently: true });
    for (let y = 0; y < H; y += bandH) {
      const h = Math.min(bandH, H - y);
      const bmp = await createImageBitmap(blob, 0, y, W, h);
      if (bmp.width !== W || bmp.height !== h) { bmp.close(); throw new Error('decode-mismatch'); }
      ctx.clearRect(0, 0, W, bandH);
      ctx.drawImage(bmp, 0, 0); bmp.close();
      out.set(ctx.getImageData(0, 0, W, h).data, y * W * 4);
      onProgress((y + h) / H);
    }
    c.width = c.height = 1;
    return new Raster(W, H, null, out);
  }
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp;
  if (width * height > CANVAS_MAX_PIXELS && !(await canvasBeyondSafariCap())) {
    bmp.close();
    throw new Error('too-big-for-canvas');
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

export function hasAlpha(rgba) { for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 255) return true; return false; }

export function flattenedOnWhite(rgba) {
  if (!hasAlpha(rgba)) return rgba;
  const d = new Uint8ClampedArray(rgba);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    d[i] = d[i] * a + 255 * (1 - a); d[i + 1] = d[i + 1] * a + 255 * (1 - a); d[i + 2] = d[i + 2] * a + 255 * (1 - a); d[i + 3] = 255;
  }
  return d;
}

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
export async function encodeJpegWasm(rgba, width, height, quality) {
  const m = await moz();
  const out = m.encode(flattenedOnWhite(rgba), width, height, { ...MOZ_OPTIONS, quality });
  if (!out || out.length < 4 || out[0] !== 0xff || out[1] !== 0xd8) throw new Error('The JPEG encoder produced no valid file.');
  return new Blob([out], { type: 'image/jpeg' });
}

// libwebp, the encoder Squoosh uses. WebP cannot exceed 16383 px on a side (format limit).
export const WEBP_MAX_SIDE = 16383;
export async function encodeWebpWasm(rgba, width, height, quality) {
  if (width > WEBP_MAX_SIDE || height > WEBP_MAX_SIDE) throw new Error(`WebP cannot be wider or taller than ${WEBP_MAX_SIDE} pixels (a limit of the format). Choose JPG, PNG or AVIF for this image.`);
  const m = await webpMod();
  const out = m.encode(rgba, width, height, { ...WEBP_OPTIONS, quality });
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
// libpng/zlib's own tools). Never needs a canvas.
export async function encodePngRGBA(rgba, width, height, onProgress = () => {}) {
  if (typeof CompressionStream === 'undefined') throw new Error('This browser cannot write PNG files this large (it needs Safari 16.4 or later, or a current Chrome, Edge or Firefox).');
  const alpha = hasAlpha(rgba), bpp = alpha ? 4 : 3, stride = width * bpp;
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  const idat = [];
  const reading = (async () => { const r = cs.readable.getReader(); for (;;) { const { value, done } = await r.read(); if (done) break; idat.push(value); } })();
  let prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  const cand = [new Uint8Array(stride + 1), new Uint8Array(stride + 1), new Uint8Array(stride + 1), new Uint8Array(stride + 1)];
  const ROWS = Math.max(1, Math.floor(1 << 20) / (stride + 1) | 0);
  let batch = new Uint8Array(ROWS * (stride + 1)), fill = 0;
  for (let y = 0; y < height; y++) {
    let o = y * width * 4;
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
    const best = sn <= ss && sn <= su && sn <= sp ? n : ss <= su && ss <= sp ? s : su <= sp ? u : p;
    batch.set(best, fill); fill += stride + 1;
    if (fill + stride + 1 > batch.length || y === height - 1) {
      await writer.ready;
      writer.write(batch.subarray(0, fill));
      batch = new Uint8Array(ROWS * (stride + 1)); fill = 0;
      onProgress((y + 1) / height);
    }
    [prev, cur] = [cur, prev];
  }
  await writer.close();
  await reading;
  const ihdr = new Uint8Array(13), v = new DataView(ihdr.buffer);
  v.setUint32(0, width); v.setUint32(4, height); ihdr[8] = 8; ihdr[9] = alpha ? 6 : 2;
  const parts = [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ...chunk('IHDR', ihdr)];
  for (const d of idat) parts.push(...chunk('IDAT', d));
  parts.push(...chunk('IEND', new Uint8Array(0)));
  return new Blob(parts, { type: 'image/png' });
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

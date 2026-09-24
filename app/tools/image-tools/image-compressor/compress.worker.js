// Image compression, entirely in the visitor's browser (the image never leaves the device).
//
// The means were read from the reference site's own output files (docs/audit/RAPPORT-ecarts-marche.md §3b):
// iLoveIMG's JPEGs are MozJPEG (progressive, optimised scans, the same Robidoux table for luma and chroma);
// its PNGs stay PNG with transparency, reduced to a small colour palette. So:
//   JPEG -> MozJPEG with trellis quantisation (@jsquash/jpeg, Apache-2.0; mozjpeg is BSD/IJG)
//   PNG  -> smallest palette (Wu quantiser, image-q, MIT) that keeps the quality target, then OxiPNG
//           (@jsquash/oxipng, Apache-2.0); at 100 % quality, OxiPNG alone (lossless)
//   WebP -> libwebp (@jsquash/webp, Apache-2.0)
//   anything else the browser can open -> MozJPEG on white (the page says so before compressing)
// libimagequant (pngquant) was NOT used: it is GPL-3.0 (its MIT "-wasm" wrapper does not change that).
import * as iq from 'image-q';
import UPNG from 'upng-js';
import { sniffFormat } from '../../../lib/detectFileFormat';

const wasmCache = {};
function wasm(name) {
  if (!wasmCache[name]) {
    wasmCache[name] = fetch(`/wasm/${name}`).then((r) => {
      if (!r.ok) throw new Error('The compression engine could not be loaded. Check your connection and try again.');
      return r.arrayBuffer();
    }).catch((e) => { delete wasmCache[name]; throw e; });
  }
  return wasmCache[name];
}

let mozPromise = null;
const moz = () => (mozPromise ||= (async () => {
  const [{ default: factory }, bin] = await Promise.all([import('@jsquash/jpeg/codec/enc/mozjpeg_enc.js'), wasm('mozjpeg_enc.wasm')]);
  return factory({ wasmBinary: bin });
})().catch((e) => { mozPromise = null; throw e; }));

let webpPromise = null;
const webp = () => (webpPromise ||= (async () => {
  const [{ default: factory }, bin] = await Promise.all([import('@jsquash/webp/codec/enc/webp_enc.js'), wasm('webp_enc.wasm')]);
  return factory({ wasmBinary: bin });
})().catch((e) => { webpPromise = null; throw e; }));

let oxiPromise = null;
const oxi = () => (oxiPromise ||= (async () => {
  const [mod, bin] = await Promise.all([import('@jsquash/oxipng/codec/pkg/squoosh_oxipng.js'), wasm('squoosh_oxipng_bg.wasm')]);
  await mod.default(await WebAssembly.compile(bin));
  return mod;
})().catch((e) => { oxiPromise = null; throw e; }));

const MOZ_OPTIONS = {
  baseline: false, arithmetic: false, progressive: true, optimize_coding: true, smoothing: 0, color_space: 3,
  quant_table: 3, trellis_multipass: true, trellis_opt_zero: true, trellis_opt_table: true, trellis_loops: 1,
  auto_subsample: true, chroma_subsample: 2, separate_chroma_quality: false, chroma_quality: 75,
};
const WEBP_OPTIONS = {
  target_size: 0, target_PSNR: 0, method: 4, sns_strength: 50, filter_strength: 60, filter_sharpness: 0, filter_type: 1,
  partitions: 0, segments: 4, pass: 1, show_compressed: 0, preprocessing: 0, autofilter: 0, partition_limit: 0,
  alpha_compression: 1, alpha_filtering: 1, alpha_quality: 100, lossless: 0, exact: 0, image_hint: 0,
  emulate_jpeg_size: 0, thread_level: 0, low_memory: 0, near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0,
};

// PNG quality target (PSNR over white, dB) from the same 10-100 slider as JPEG. 78 (the page default) gives
// 43.3 dB -- iLoveIMG's own measured points on the audit images were 43.36 and 43.47 dB.
const pngTargetDb = (quality) => 32 + quality * 0.145;
// Fine steps where the size/quality trade-off is decided (measured on the audit PNG: 36 colours 43.13 dB,
// 40 colours 43.40 dB, 48 colours 43.79 dB). Searched by bisection (quality grows with the palette size).
const PALETTE_SIZES = [16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 128, 160, 192, 256];
const SAMPLE_PIXELS = 262_144; // palette built on a ~0.25 MP sample: measured same PSNR as the full image, 3x faster

async function decode(blob) {
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap === 'undefined') {
    throw new Error('This browser cannot process images in the background (it needs Safari 16.4 or later, or a current Chrome, Edge or Firefox).');
  }
  let bmp;
  try {
    // from-image: a phone photo's EXIF orientation is applied, as every viewer shows it
    bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Could not open this image. The file may be damaged or in a format your browser cannot read.');
  }
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return ctx.getImageData(0, 0, c.width, c.height);
}

function onWhite(img) {
  const d = new Uint8ClampedArray(img.data);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3] / 255;
    d[i] = d[i] * a + 255 * (1 - a); d[i + 1] = d[i + 1] * a + 255 * (1 - a); d[i + 2] = d[i + 2] * a + 255 * (1 - a); d[i + 3] = 255;
  }
  return { data: d, width: img.width, height: img.height };
}

async function encodeJpeg(img, quality) {
  const m = await moz();
  const out = m.encode(img.data, img.width, img.height, { ...MOZ_OPTIONS, quality });
  if (!out || out.length < 4 || out[0] !== 0xff || out[1] !== 0xd8) throw new Error('The JPEG encoder produced no valid file.');
  return new Blob([out], { type: 'image/jpeg' });
}

async function encodeWebp(img, quality) {
  const m = await webp();
  const out = m.encode(img.data, img.width, img.height, { ...WEBP_OPTIONS, quality });
  if (!out || String.fromCharCode(...out.slice(8, 12)) !== 'WEBP') throw new Error('The WebP encoder produced no valid file.');
  return new Blob([out], { type: 'image/webp' });
}

function sample(img) {
  const { data, width: W, height: H } = img;
  const step = Math.max(1, Math.sqrt((W * H) / SAMPLE_PIXELS));
  const sw = Math.max(1, Math.floor(W / step)), sh = Math.max(1, Math.floor(H / step));
  const out = new Uint8Array(sw * sh * 4);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const s = (Math.floor(y * step) * W + Math.floor(x * step)) * 4;
    out[(y * sw + x) * 4] = data[s]; out[(y * sw + x) * 4 + 1] = data[s + 1]; out[(y * sw + x) * 4 + 2] = data[s + 2]; out[(y * sw + x) * 4 + 3] = data[s + 3];
  }
  return iq.utils.PointContainer.fromUint8Array(out, sw, sh);
}

// Maps every pixel to its nearest palette entry (cached per distinct colour) and measures the error as seen
// on a white page, alpha included.
function mapToPalette(img, P) {
  const { data } = img; const N = img.width * img.height;
  const u32 = new Uint32Array(data.buffer, data.byteOffset, N);
  const cache = new Map(); const out = new Uint8Array(N * 4); let se = 0;
  for (let i = 0; i < N; i++) {
    let e = cache.get(u32[i]);
    if (e === undefined) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
      let bd = Infinity, best = 0;
      for (let j = 0; j < P.length; j++) {
        const p = P[j];
        const d = 0.2126 * (r - p[0]) ** 2 + 0.7152 * (g - p[1]) ** 2 + 0.0722 * (b - p[2]) ** 2 + (a - p[3]) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      const p = P[best], aa = a / 255, pa = p[3] / 255;
      let err = 0;
      for (let c = 0; c < 3; c++) err += (data[i * 4 + c] * aa + 255 * (1 - aa) - (p[c] * pa + 255 * (1 - pa))) ** 2;
      e = [best, err];
      cache.set(u32[i], e);
    }
    const p = P[e[0]];
    out[i * 4] = p[0]; out[i * 4 + 1] = p[1]; out[i * 4 + 2] = p[2]; out[i * 4 + 3] = p[3];
    se += e[1];
  }
  const mse = se / (N * 3);
  return { rgba: out, db: mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse) };
}

async function encodePng(img, quality, progress) {
  const o = await oxi();
  const target = pngTargetDb(quality);
  let rgba = null, colours = 0;
  if (quality < 100) {
    const pc = sample(img);
    const tryPalette = (n) => mapToPalette(img, iq.buildPaletteSync([pc], { colors: n, paletteQuantization: 'wuquant', colorDistanceFormula: 'euclidean-bt709' })
      .getPointContainer().getPointArray().map((p) => [p.r, p.g, p.b, p.a]));
    // Smallest palette meeting the target: bisection over PALETTE_SIZES (about 5 tries instead of 17).
    let lo = 0, hi = PALETTE_SIZES.length - 1, step = 0;
    const top = tryPalette(PALETTE_SIZES[hi]);
    if (top.db >= target) {
      let best = { m: top, n: PALETTE_SIZES[hi] };
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        progress(15 + Math.min(55, ++step * 11));
        const m = tryPalette(PALETTE_SIZES[mid]);
        if (m.db >= target) { best = { m, n: PALETTE_SIZES[mid] }; hi = mid; } else { lo = mid + 1; }
      }
      rgba = best.m.rgba; colours = best.n;
    }
  }
  progress(75);
  // No palette meets the target (a photo-like PNG): lossless repack only, never a visibly worse image.
  const png = rgba
    ? UPNG.encode([rgba.buffer], img.width, img.height, colours)
    : UPNG.encode([img.data.buffer.slice(img.data.byteOffset, img.data.byteOffset + img.data.byteLength)], img.width, img.height, 0);
  const out = o.optimise(new Uint8Array(png), 2, false, true);
  if (!out || out[1] !== 0x50 || out[2] !== 0x4e || out[3] !== 0x47) throw new Error('The PNG encoder produced no valid file.');
  return { blob: new Blob([out], { type: 'image/png' }), colours };
}

// SVG -- the means read from iLoveIMG's own output on Tux.svg (docs/audit/RAPPORT-licence-et-ameliorations.md §3b):
// SVGO's default preset (ids renamed a, g, h…, numbers shortened, groups collapsed, one line, still vector).
// SVGO 4.1 default preset on the same file: 35,969 bytes; iLoveIMG: 35,973. SVGO (MIT) runs here, in the
// browser; the page then checks that the result DRAWS the same as the original before offering it
// (iLoveIMG does not check), which is why a cautious variant is sent along.
// Markup text with an <svg> element near the top. Not a strict prolog grammar: Illustrator exports put a long
// DOCTYPE with an internal entity subset first (the Wikipedia logo: several KB of <!ENTITY …>).
const looksLikeSvg = (text) => /^﻿?\s*</.test(text) && !text.includes('\u0000') && /<svg[\s>]/i.test(text);
const CAUTIOUS_SVG = {
  multipass: false,
  floatPrecision: 5,
  plugins: [{
    name: 'preset-default',
    params: { overrides: { mergePaths: false, convertShapeToPath: false, convertPathData: false, inlineStyles: false, minifyStyles: false, collapseGroups: false, convertTransform: false } },
  }],
};

async function compressSvg(file, progress) {
  const text = await file.text();
  if (!looksLikeSvg(text)) throw new Error('This file does not look like an SVG image.');
  const { optimize } = await import('svgo/browser');
  progress(20);
  const run = (cfg) => { try { return optimize(text, cfg).data; } catch { return null; } };
  // One pass and several passes: neither always wins (Tux: 35,969 vs 35,983 bytes; a map: 47,598 vs 46,706).
  const best = [run({ multipass: false }), run({ multipass: true })].filter(Boolean).sort((a, b) => a.length - b.length)[0];
  progress(70);
  const cautious = run(CAUTIOUS_SVG);
  if (!best && !cautious) throw new Error('Could not read this SVG. The file may be damaged.');
  const blob = (s) => new Blob([s], { type: 'image/svg+xml' });
  return { candidates: [best && { blob: blob(best), cautious: false }, cautious && { blob: blob(cautious), cautious: true }].filter(Boolean) };
}

self.onmessage = async (e) => {
  const { id, file, quality } = e.data;
  const progress = (pct) => self.postMessage({ id, type: 'progress', pct });
  try {
    if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '') || looksLikeSvg(await file.slice(0, 65536).text())) {
      const r = await compressSvg(file, progress);
      progress(100);
      self.postMessage({ id, type: 'svg', candidates: r.candidates });
      return;
    }
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    const format = sniffFormat(head)?.format;
    progress(5);
    const img = await decode(file);
    let out, note = '';
    if (format === 'png') {
      const r = await encodePng(img, quality, progress);
      out = r.blob;
      note = r.colours ? `${r.colours}-colour palette, transparency kept` : 'lossless (no palette kept the quality)';
    } else {
      // An already well-compressed JPEG/WebP can come out larger at the chosen quality. Like the reference
      // site (which picked ~q69 on such a file and ~q78 on a fresh photo), step the quality down -- at most
      // twice, never below 50 -- and SAY so, rather than refusing or handing back a larger file.
      const encodeAt = format === 'webp' ? (q) => encodeWebp(img, q) : (q) => encodeJpeg(format === 'jpg' ? img : onWhite(img), q);
      let q = quality;
      out = await encodeAt(q);
      while (out.size >= file.size && q - 8 >= 50 && q > quality - 16) {
        q -= 8;
        progress(50);
        out = await encodeAt(q);
      }
      const notes = [];
      if (q !== quality && out.size < file.size) notes.push(`quality lowered to ${q}% — at ${quality}% it would not have been smaller`);
      if (format !== 'jpg' && format !== 'webp') notes.push('converted to JPG');
      note = notes.join(' · ');
    }
    progress(100);
    self.postMessage({ id, type: 'done', blob: out, note });
  } catch (err) {
    self.postMessage({ id, type: 'error', message: err?.message || String(err) });
  }
};

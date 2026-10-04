// Measures the WebAssembly heap (linear memory byteLength) that MozJPEG reaches while encoding the images of the two
// iPhone paths, with the exact builds and options of the site. One fresh module per measure (= a fresh worker).
// P32 point 2 (04/10). Usage: node --max-old-space-size=8000 scripts/p32/mozjpeg-heap.mjs   (kit files in %TEMP%/p31-kit or P31_KIT)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.argv[2] || process.cwd();
globalThis.ImageData = class { constructor(data, width, height) { this.data = data; this.width = width; this.height = height; } };
const encMod = (await import(pathToFileURL(path.join(root, 'node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.js')).href)).default;
const decMod = (await import(pathToFileURL(path.join(root, 'node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.js')).href)).default;
const encBin = fs.readFileSync(path.join(root, 'public/wasm/mozjpeg_enc.wasm'));
const decBin = fs.readFileSync(path.join(root, 'node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'));

const COMPRESSOR = { baseline: false, arithmetic: false, progressive: true, optimize_coding: true, smoothing: 0, color_space: 3, quant_table: 3, trellis_multipass: true, trellis_opt_zero: true, trellis_opt_table: true, trellis_loops: 1, auto_subsample: true, chroma_subsample: 2, separate_chroma_quality: false, chroma_quality: 75 };
const BIGIMAGE = { ...COMPRESSOR, trellis_multipass: false, trellis_opt_zero: false, trellis_opt_table: false };

const kit = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
const decode = async (file) => { const m = await decMod({ wasmBinary: decBin }); const d = m.decode(fs.readFileSync(file), false); return { data: new Uint8ClampedArray(d.data), width: d.width, height: d.height }; };
const MB = (b) => (b / 1048576).toFixed(0);

function reducedSize(w, h, maxMp) {
  const s = Math.min(1, Math.sqrt((maxMp * 1e6) / (w * h)));
  let width = Math.max(1, Math.floor(w * s)), height = Math.max(1, Math.floor(h * s));
  while (width * height > maxMp * 1e6) { width--; height = Math.max(1, Math.floor(width * h / w)); }
  return { width, height };
}
// same area average as app/lib/reduceImage.js, on the whole raster
function reduce(img, ow, oh) {
  const { data: src, width: W, height: H } = img; const out = new Uint8ClampedArray(ow * oh * 4);
  const acc = new Float64Array(ow * 4), wsum = new Float64Array(ow), colOf = new Int32Array(W);
  for (let x = 0; x < W; x++) colOf[x] = Math.min(ow - 1, Math.floor(x * ow / W));
  let accRow = -1;
  const flush = () => { if (accRow < 0) return; for (let x = 0; x < ow; x++) { const o = (accRow * ow + x) * 4, a = acc[x * 4 + 3], n = wsum[x] || 1; if (a > 0) { out[o] = acc[x * 4] / a; out[o + 1] = acc[x * 4 + 1] / a; out[o + 2] = acc[x * 4 + 2] / a; } out[o + 3] = a / n; } acc.fill(0); wsum.fill(0); };
  for (let y = 0; y < H; y++) {
    const oy = Math.min(oh - 1, Math.floor(y * oh / H)); if (oy !== accRow) { flush(); accRow = oy; }
    for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, a = src[i + 3], c = colOf[x] * 4; acc[c] += src[i] * a; acc[c + 1] += src[i + 1] * a; acc[c + 2] += src[i + 2] * a; acc[c + 3] += a; wsum[colOf[x]]++; }
  }
  flush();
  return { data: out, width: ow, height: oh };
}

async function encodePeak(img, opts, quality, label) {
  const m = await encMod({ wasmBinary: encBin });
  const before = m.HEAP8.buffer.byteLength;
  const t = Date.now();
  const out = m.encode(img.data, img.width, img.height, { ...opts, quality });
  const after = m.HEAP8.buffer.byteLength;
  const raw = img.width * img.height * 4;
  console.log(`${label}: ${img.width}x${img.height} (${(img.width * img.height / 1e6).toFixed(2)} MP) raw RGBA ${MB(raw)} MB | wasm heap ${MB(before)} -> ${MB(after)} MB (${(after / raw).toFixed(2)}x raw) | out ${(out.length / 1e6).toFixed(2)} MB | ${Date.now() - t} ms`);
  return { raw, heap: after, out };
}

const photo = await decode(path.join(kit, 'kit-iphone-p19', 'photo-48mpx.jpg'));
const pano = await decode(path.join(kit, 'kit-iphone-p27', 'panorama-63mpx.jpg'));
const res = {};
res.p48 = await encodePeak(photo, COMPRESSOR, 78, '48 MP path, worker encode q78 (compressor options)');
const r50 = reducedSize(pano.width, pano.height, 50);
const red50 = reduce(pano, r50.width, r50.height);
res.oldPage = await encodePeak(red50, BIGIMAGE, 95, 'OLD pano, page: intermediate JPEG q95 (bigImage options)');
res.oldWorker = await encodePeak(red50, COMPRESSOR, 78, 'OLD pano, worker: encode q78 of the 50 MP reduced image');
for (const mp of [48, 48.5]) {
  const r = reducedSize(pano.width, pano.height, mp);
  res['n' + mp] = await encodePeak(reduce(pano, r.width, r.height), COMPRESSOR, 78, `NEW pano reduced to ${mp} MP, single worker encode q78`);
}
await encodePeak(pano, BIGIMAGE, 92, 'JPG/Image to PDF before P32: 63 MP decoded, encodeJpegWasm q92 (auto 4:4:4 from q90)');
await encodePeak(pano, { ...BIGIMAGE, auto_subsample: false, chroma_subsample: 2 }, 92, 'JPG/Image to PDF after P32: 63 MP decoded in bands, encodeJpegWasm q92 chroma420');

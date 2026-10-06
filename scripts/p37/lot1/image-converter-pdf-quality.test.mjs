// P37 lot 1, bug 4 -- Image Converter, PDF output: the "Quality" slider (10 % to 100 %) was ignored below 50 %.
// extraFormats.js clamped it with Math.max(0.5, quality / 100): 10 %, 20 %... 49 % all gave the 50 % JPEG.
// This runs the REAL encoder (encodeExtra('pdf', ...)) in Node on an opaque photo-like image, on the path without a
// canvas (MozJPEG in WebAssembly, /wasm/ served from public/wasm), and checks the JPEG inside the PDF is the one
// MozJPEG writes at the quality asked.
//   node scripts/p37/lot1/image-converter-pdf-quality.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import './ext-hook.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, ...rest) => {
  if (typeof url === 'string' && url.startsWith('/wasm/')) return new Response(fs.readFileSync(path.join(ROOT, 'public', url)));
  return realFetch(url, ...rest);
};
globalThis.self = globalThis;
const { encodeExtra } = await import(pathToFileURL(path.join(ROOT, 'app/tools/image-tools/image-converter/extraFormats.js')).href);
const { encodeJpegWasm } = await import(pathToFileURL(path.join(ROOT, 'app/lib/bigImage.js')).href);

// 320 x 240 opaque gradient with noise (a photo-like picture, so the quality changes the size)
const w = 320, h = 240, rgba = new Uint8ClampedArray(w * h * 4);
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let i = 0; i < w * h; i++) { const x = i % w, y = (i / w) | 0; rgba[i * 4] = (x * 255 / w + rnd() * 40) | 0; rgba[i * 4 + 1] = (y * 255 / h + rnd() * 40) | 0; rgba[i * 4 + 2] = (128 + rnd() * 60) | 0; rgba[i * 4 + 3] = 255; }
const raster = { width: w, height: h, canvas: null, rgba: () => rgba };

const jpegIn = (pdf) => { const s = pdf.indexOf(Buffer.from([0xff, 0xd8, 0xff])), e = pdf.lastIndexOf(Buffer.from([0xff, 0xd9])); return pdf.subarray(s, e + 2); };
let failed = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`); if (!ok) failed++; };
const sizes = {};
for (const q of [10, 20, 30, 49, 50, 80, 100]) {
  const { blob } = await encodeExtra('pdf', raster, q);
  const pdf = Buffer.from(await blob.arrayBuffer());
  const inside = jpegIn(pdf);
  const direct = Buffer.from(await (await encodeJpegWasm(new Uint8ClampedArray(rgba), w, h, q)).arrayBuffer());
  sizes[q] = pdf.length;
  check(`quality ${q} %: the JPEG in the PDF is MozJPEG's at ${q} %`, inside.equals(direct), `PDF ${pdf.length} bytes, JPEG inside ${inside.length} bytes, MozJPEG at ${q} %: ${direct.length} bytes`);
}
check('a lower quality gives a smaller PDF (10 < 20 < 30 < 49 < 50)', sizes[10] < sizes[20] && sizes[20] < sizes[30] && sizes[30] < sizes[49] && sizes[49] < sizes[50], JSON.stringify(sizes));
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS');
process.exitCode = failed ? 1 : 0;

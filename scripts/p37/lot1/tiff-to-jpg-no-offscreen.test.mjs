// P37 lot 1, bug 3 -- TIFF to JPG in a browser whose workers have no OffscreenCanvas (Safari before 16.4, Playwright
// WebKit on Windows). The worker used `new OffscreenCanvas` without testing for it: the conversion failed with
// "OffscreenCanvas is not defined", shown as "This TIFF file couldn't be read... corrupted". TIFF to PNG's worker
// already tests for it and writes the file from the pixels; TIFF to JPG now does the same (MozJPEG in WebAssembly).
// This runs the REAL worker module (tiffToJpg.worker.js) in Node, where there is no OffscreenCanvas, with the
// /wasm/ files served from public/wasm.
//   node scripts/p37/lot1/tiff-to-jpg-no-offscreen.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import './ext-hook.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
if (typeof globalThis.OffscreenCanvas !== 'undefined') throw new Error('this test needs a runtime without OffscreenCanvas');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, ...rest) => {
  if (typeof url === 'string' && url.startsWith('/wasm/')) return new Response(fs.readFileSync(path.join(ROOT, 'public', url)));
  return realFetch(url, ...rest);
};
const messages = [];
globalThis.self = globalThis;
globalThis.postMessage = (m) => messages.push(m);
await import(pathToFileURL(path.join(ROOT, 'app/tools/image-tools/tiff-to-jpg/tiffToJpg.worker.js')).href);

// a 64 x 48 RGBA TIFF, left quarter transparent (must come out on the chosen background)
const w = 64, h = 48, raw = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; raw[i] = 200; raw[i + 1] = 100; raw[i + 2] = 60; raw[i + 3] = x < w / 4 ? 0 : 255; }
const tif = await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).tiff({ compression: 'lzw' }).toBuffer();
const buffer = tif.buffer.slice(tif.byteOffset, tif.byteOffset + tif.length);
await self.onmessage({ data: { buffer, quality: 90, page: 0, background: '#00ff00' } });

let failed = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`); if (!ok) failed++; };
const last = messages[messages.length - 1];
console.log('worker messages:', messages.map((m) => m.type + (m.message ? ` "${m.message}"` : '')).join(', '));
check('the worker finishes without OffscreenCanvas', last?.type === 'done', last?.type === 'error' ? last.message : '');
if (last?.type === 'done') {
  const jpg = Buffer.from(await last.blob.arrayBuffer());
  const m = await sharp(jpg).metadata();
  const px = await sharp(jpg).extract({ left: 2, top: 20, width: 1, height: 1 }).raw().toBuffer();
  const px2 = await sharp(jpg).extract({ left: 50, top: 20, width: 1, height: 1 }).raw().toBuffer();
  check('a JPEG of the same size', m.format === 'jpeg' && m.width === w && m.height === h, `${m.format} ${m.width}x${m.height}, ${jpg.length} bytes`);
  check('transparent part on the chosen background (green)', px[0] < 30 && px[1] > 225 && px[2] < 30, `pixel (2,20) = ${[...px]}`);
  check('opaque part keeps its color (200,100,60)', Math.abs(px2[0] - 200) < 12 && Math.abs(px2[1] - 100) < 12 && Math.abs(px2[2] - 60) < 12, `pixel (50,20) = ${[...px2]}`);
}
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS');
process.exitCode = failed ? 1 : 0;

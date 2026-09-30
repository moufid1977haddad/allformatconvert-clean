// P17: the rewritten Gaussian blur (app/lib/canvasFilters.js) stays within one colour level of the P16 version
// (blur-reference-p16.mjs, a verbatim copy), and a band blurred with gaussianBlurSupport() extra rows gives exactly the
// rows of the whole image. Also times both at 12 MP (Node's V8; the browser bench measures Safari's engine).
// Run: node scripts/image-tests/blur-fast.mjs
import assert from 'node:assert/strict';
const NEW = await import(new URL('../../app/lib/canvasFilters.js', import.meta.url));
const OLD = await import(new URL('./blur-reference-p16.mjs', import.meta.url));
const img = (w, h, seed = 1) => {
  const d = new Uint8ClampedArray(w * h * 4);
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) >>> 16) & 255;
  for (let i = 0; i < d.length; i++) d[i] = (i % 4 === 3 && i % 7 === 0) ? 0 : rnd();
  return { width: w, height: h, data: d };
};
const copy = (m) => ({ width: m.width, height: m.height, data: new Uint8ClampedArray(m.data) });
let n = 0, maxDiff = 0;
for (const [w, h] of [[1, 1], [3, 50], [64, 5], [257, 131]]) {
  for (const sigma of [0.5, 1, 5, 12.5, 20]) {
    const a = img(w, h, w * 31 + h), b = copy(a);
    OLD.applyGaussianBlur(a, sigma); NEW.applyGaussianBlur(b, sigma);
    // integers at 1/255 of a level: within one level of the floating-point P16 blur (transparent pixels excepted:
    // their colour is meaningless -- both give 0 alpha)
    for (let i = 0; i < a.data.length; i += 4) {
      if (a.data[i + 3] === 0 && b.data[i + 3] === 0) continue;
      for (let c = 0; c < 4; c++) { const dd = Math.abs(a.data[i + c] - b.data[i + c]); if (dd > maxDiff) maxDiff = dd; }
    }
    n++;
  }
}
assert.ok(maxDiff <= 1, 'max difference ' + maxDiff);
console.log(`PASS within ${maxDiff} level of the P16 blur on ${n} image/sigma pairs`);
// bands: rows [y0, y1) of the whole image == the same rows of a band with `support` rows of margin
for (const sigma of [1, 5, 20]) {
  const W = 97, H = 300, full = img(W, H, 7), whole = copy(full); NEW.applyGaussianBlur(whole, sigma);
  const M = NEW.gaussianBlurSupport(sigma);
  for (const [y0, y1] of [[0, 40], [40, 170], [170, 300], [123, 124]]) {
    const top = Math.max(0, y0 - M), bot = Math.min(H, y1 + M);
    const band = { width: W, height: bot - top, data: full.data.slice(top * W * 4, bot * W * 4) };
    NEW.applyGaussianBlur(band, sigma);
    assert.deepEqual(band.data.subarray((y0 - top) * W * 4, (y1 - top) * W * 4), whole.data.subarray(y0 * W * 4, y1 * W * 4), `band ${y0}-${y1} sigma ${sigma}`);
  }
}
console.log('PASS a band with gaussianBlurSupport() rows of margin equals the whole-image rows (sigma 1, 5, 20)');
const big = img(4032, 3024, 3);
let t = performance.now(); NEW.applyGaussianBlur(copy(big), 5); const tn = performance.now() - t;
t = performance.now(); OLD.applyGaussianBlur(copy(big), 5); const to = performance.now() - t;
console.log(`12 MP, sigma 5 (Node): new ${(tn / 1000).toFixed(2)} s, P16 ${(to / 1000).toFixed(2)} s`);

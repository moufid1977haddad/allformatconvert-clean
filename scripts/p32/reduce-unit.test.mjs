// P32 point 2 (04/10): unit checks of the "Reduce to N MP" path that now runs inside Image Compressor's worker
// (app/lib/reduceImage.js reduceToRGBA over app/lib/bigImage.js forEachBand), in Node with a fake browser decoder:
//   1. the band-by-band area average equals the same average computed on the whole image (pixel for pixel);
//   2. the sizes announced for the owner's panorama (14000 × 4500): 48 MP -> 12220 × 3927, 50 MP -> 12472 × 4008;
//   3. accounting of what is alive at once: one full-size buffer (the reduced pixels) plus ONE band canvas and one band
//      bitmap / band read of at most 4 MP -- never the source at full size, never a second full-size copy.
// Usage: node scripts/p32/reduce-unit.test.mjs
import assert from 'node:assert/strict';

let live = 0, peakLive = 0, maxCanvas = 0;
const track = (bytes) => { live += bytes; peakLive = Math.max(peakLive, live); return bytes; };
const SRC = { W: 0, H: 0, data: null };
const pixel = (x, y) => { const i = (y * SRC.W + x) * 4; return SRC.data.subarray(i, i + 4); };

class FakeBitmap {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; this.bytes = track(w * h * 4); }
  close() { if (this.bytes) { live -= this.bytes; this.bytes = 0; } }
}
class FakeCtx {
  constructor(c) { this.canvas = c; this.buf = new Uint8ClampedArray(c.width * c.height * 4); }
  clearRect() { this.buf.fill(0); }
  drawImage(bmp, ...a) {
    if (a.length !== 2) throw new Error('only drawImage(bmp, 0, 0) expected on the crop path');
    for (let y = 0; y < bmp.height; y++) for (let x = 0; x < bmp.width; x++) this.buf.set(bmp.probe ? bmp.probe(x, y) : pixel(bmp.x + x, bmp.y + y), (y * this.canvas.width + x) * 4);
  }
  getImageData(x0, y0, w, h) {
    // a fresh copy per call, like the browser (garbage after the band is used: counted as freed when the next band comes)
    const out = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) out.set(this.buf.subarray(((y0 + y) * this.canvas.width + x0) * 4, ((y0 + y) * this.canvas.width + x0 + w) * 4), y * w * 4);
    return { data: out };
  }
}
globalThis.OffscreenCanvas = class {
  constructor(w, h) { this._w = w; this._h = h; this.bytes = track(w * h * 4); maxCanvas = Math.max(maxCanvas, w * h); }
  get width() { return this._w; } set width(v) { live -= this.bytes; this._w = v; this.bytes = track(this._w * this._h * 4); }
  get height() { return this._h; } set height(v) { live -= this.bytes; this._h = v; this.bytes = track(this._w * this._h * 4); }
  getContext() { return (this.ctx ||= new FakeCtx(this)); }
};
// the band probe of bigImage.js decodes a 1 KB rotated JPEG cropped 4 × 4: answer "red on top" (crop works, as WebKit)
globalThis.createImageBitmap = async (blob, x, y, w, h) => {
  if (blob.size < 4000) { const b = new FakeBitmap(0, 0, 4, 4); b.probe = () => [255, 0, 0, 255]; return b; }
  if (x === undefined) throw new Error('a whole-image decode was asked: the source would be held at full size');
  return new FakeBitmap(x, y, w, h);
};

const { reduceToRGBA, reducedSize } = await import('../../app/lib/reduceImage.js');

// whole-image reference: the same premultiplied area average, rows and columns mapped by floor(i * out / in)
function reference(W, H, ow, oh) {
  const out = new Uint8ClampedArray(ow * oh * 4);
  const acc = new Float64Array(ow * oh * 4), n = new Float64Array(ow * oh);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const oy = Math.min(oh - 1, Math.floor(y * (oh / H))), ox = Math.min(ow - 1, Math.floor(x * (ow / W))), o = oy * ow + ox, p = pixel(x, y), a = p[3];
    acc[o * 4] += p[0] * a; acc[o * 4 + 1] += p[1] * a; acc[o * 4 + 2] += p[2] * a; acc[o * 4 + 3] += a; n[o]++;
  }
  for (let o = 0; o < ow * oh; o++) { const a = acc[o * 4 + 3]; if (a > 0) { out[o * 4] = acc[o * 4] / a; out[o * 4 + 1] = acc[o * 4 + 1] / a; out[o * 4 + 2] = acc[o * 4 + 2] / a; } out[o * 4 + 3] = a / (n[o] || 1); }
  return out;
}

let passes = 0;
const ok = (name, fn) => { fn(); passes++; console.log('PASS', name); };

// 1. exact equality on a 3000 × 1000 image with alpha and noise (bands of 4 MP / 3000 = 1333 rows: one band here, so
//    also a 9000 × 1000 one: 444-row bands, 3 bands, band edges that do not fall on output rows)
for (const [W, H, mp] of [[3000, 1000, 2.2], [9000, 1000, 6.5], [1401, 3001, 3.3]]) {
  SRC.W = W; SRC.H = H; SRC.data = new Uint8ClampedArray(W * H * 4);
  let s = 7; const r = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) & 255);
  for (let i = 0; i < SRC.data.length; i += 4) { SRC.data[i] = r(); SRC.data[i + 1] = (i / 4) % 251; SRC.data[i + 2] = r() >> 1; SRC.data[i + 3] = (i / 4) % 7 === 0 ? 0 : 255 - (r() & 63); }
  const { width: ow, height: oh } = reducedSize(W, H, mp);
  live = 0; peakLive = 0; maxCanvas = 0;
  const blob = new Blob([new Uint8Array(5000)], { type: 'image/jpeg' });
  const got = await reduceToRGBA(blob, { width: W, height: H }, ow, oh);
  const want = reference(W, H, ow, oh);
  ok(`${W} × ${H} -> ${ow} × ${oh}: band-by-band = whole-image area average (${ow * oh} pixels)`, () => {
    assert.equal(got.length, want.length);
    let diff = 0; for (let i = 0; i < got.length; i++) diff = Math.max(diff, Math.abs(got[i] - want[i]));
    assert.ok(diff <= 1, `max channel difference ${diff}`); // float summation order only
  });
  const band = Math.floor(4e6 / W) * W;
  ok(`${W} × ${H}: band canvas ${maxCanvas} px ≤ 4 MP, live band memory peak ${(peakLive / 1e6).toFixed(1)} MB ≤ 2 bands`, () => {
    assert.ok(maxCanvas <= 4e6);
    assert.ok(peakLive <= 2 * Math.min(band, W * H) * 4 + 64, `${peakLive}`);
  });
}

// 2. the owner's panorama
ok('panorama 14000 × 4500: 48 MP -> 12220 × 3927, 50 MP -> 12472 × 4008 (the P31 line)', () => {
  assert.deepEqual(reducedSize(14000, 4500, 48), { width: 12220, height: 3927 });
  assert.deepEqual(reducedSize(14000, 4500, 50), { width: 12472, height: 4008 });
  assert.ok(12220 * 3927 < 8064 * 6048, 'reduced panorama has fewer pixels than the 48 MP photo proven on the iPhone');
});

// 3. accounting for the real sizes (no pixels computed): what reduceToRGBA keeps alive at once
ok('accounting, panorama -> 48 MP: reduced pixels 192.0 MB + band canvas 16.0 MB + band bitmap 16.0 MB + band read 16.0 MB', () => {
  const W = 14000, H = 4500, r = reducedSize(W, H, 48), bandH = Math.floor(4e6 / W);
  const out = r.width * r.height * 4, band = W * bandH * 4;
  assert.equal(bandH, 285);
  console.log(`      reduced RGBA ${(out / 1e6).toFixed(1)} MB, one band ${(band / 1e6).toFixed(1)} MB (${bandH} rows), accumulators ${((r.width * 5 * 8 + W * 4) / 1e6).toFixed(2)} MB; source never decoded whole (fake decoder refuses it), ${Math.ceil(H / bandH)} bands`);
  assert.ok(out + 3 * band < 8064 * 6048 * 4 + 3 * 8064 * Math.floor(16777216 / 8064) * 4, 'below the 48 MP photo decode stage (full RGBA + 3 bands of 16.7 MP)');
});
console.log(`ALL PASS: ${passes} checks`);

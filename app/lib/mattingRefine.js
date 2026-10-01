// Edge refinement for Background Remover (P21, 02/10). Pure functions on typed arrays: the page runs them, and the
// bench (scripts/p21/bg-bench/bench.mjs) runs the very same code against a ground truth.
//
// Why: on the owner's iPhone (a mug on blue-violet plastic) the cut-out kept a blue line along the edge and a light
// halo inside the handle. The model's mask is computed at 1024 px and only stretched to the photo; every partly
// transparent edge pixel then keeps the ORIGINAL background's colour mixed in. The market's cut-outs (remove.bg
// "edge color corrections", Photoroom "color decontamination", Pixian) do two things after segmentation:
//   1. the mask follows the photo's real edges (here: a guided filter, He et al. 2013, with the photo as guide), and
//      a faint, uncertain alpha is not kept as a veil (here: a contrast curve on the alpha);
//   2. each edge pixel gets the SUBJECT's colour, not the mix (foreground estimation; here Forte's "approximate fast
//      foreground colour estimation" by blur fusion, ICIP 2021 — the method BiRefNet's own code uses):
//      F = F̄ + α (I − α F̄ − (1−α) B̄), with F̄ and B̄ local means of the subject and of the background.
// All of it runs in the browser on a reduced copy (≤ WORK_PIXELS, 1 MP: the model's mask is 1 MP; 2 MP measured no better on the bench); the full-resolution photo is then rebuilt band by
// band with the refined alpha and the local means stretched to full size (no canvas above 4 MP, as before).

export const WORK_PIXELS = 1_000_000;

/** Mean over a (2r+1)² window, edges handled by dividing by the real window size. `src`: one plane, w×h. */
export function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  if (r < 1) { out.set(src); return out; }
  // rows: a running sum; the divisor only changes within r of either end
  const invW = new Float32Array(w);
  for (let x = 0; x < w; x++) invW[x] = 1 / (Math.min(w - 1, x + r) - Math.max(0, x - r) + 1);
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let acc = 0;
    const first = Math.min(r, w - 1);
    for (let x = 0; x <= first; x++) acc += src[o + x];
    for (let x = 0; x < w; x++) {
      tmp[o + x] = acc * invW[x];
      if (x + r + 1 < w) acc += src[o + x + r + 1];
      if (x - r >= 0) acc -= src[o + x - r];
    }
  }
  // columns: one running sum per column, rows visited in order (memory read sequentially)
  const acc = new Float32Array(w);
  for (let y = 0; y <= Math.min(r, h - 1); y++) { const o = y * w; for (let x = 0; x < w; x++) acc[x] += tmp[o + x]; }
  for (let y = 0; y < h; y++) {
    const inv = 1 / (Math.min(h - 1, y + r) - Math.max(0, y - r) + 1), o = y * w;
    for (let x = 0; x < w; x++) out[o + x] = acc[x] * inv;
    const add = y + r + 1, sub = y - r;
    if (add < h) { const oa = add * w; for (let x = 0; x < w; x++) acc[x] += tmp[oa + x]; }
    if (sub >= 0) { const os = sub * w; for (let x = 0; x < w; x++) acc[x] -= tmp[os + x]; }
  }
  return out;
}

const mul = (a, b) => { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] * b[i]; return o; };

/** Grey guided filter: `p` (alpha, 0..1) filtered with guide `I` (luma, 0..1). */
export function guidedFilter(I, p, w, h, r, eps) {
  const mI = boxBlur(I, w, h, r), mp = boxBlur(p, w, h, r);
  const mIp = boxBlur(mul(I, p), w, h, r), mII = boxBlur(mul(I, I), w, h, r);
  const a = new Float32Array(w * h), b = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) {
    const cov = mIp[i] - mI[i] * mp[i], v = mII[i] - mI[i] * mI[i];
    a[i] = cov / (v + eps);
    b[i] = mp[i] - a[i] * mI[i];
  }
  const ma = boxBlur(a, w, h, r), mb = boxBlur(b, w, h, r);
  const q = new Float32Array(w * h);
  for (let i = 0; i < q.length; i++) q[i] = Math.min(1, Math.max(0, ma[i] * I[i] + mb[i]));
  return q;
}

/** Alpha below `lo` becomes 0, above `hi` 1, linear between (a faint veil is not kept; a near-solid edge is solid). */
export function alphaCurve(a, lo, hi) {
  const o = new Float32Array(a.length), k = 1 / (hi - lo);
  for (let i = 0; i < a.length; i++) o[i] = Math.min(1, Math.max(0, (a[i] - lo) * k));
  return o;
}

// One blur-fusion step: local means of the subject (weights α) and of the background (weights 1−α).
function fusion(img, F, B, a, w, h, r) {
  const n = w * h;
  const wa = boxBlur(a, w, h, r);
  const ia = new Float32Array(n); for (let i = 0; i < n; i++) ia[i] = 1 - a[i];
  const wb = boxBlur(ia, w, h, r);
  const Fm = [], Bm = [], Fo = [];
  for (let c = 0; c < 3; c++) {
    const fa = new Float32Array(n), bb = new Float32Array(n);
    for (let i = 0; i < n; i++) { fa[i] = F[c][i] * a[i]; bb[i] = B[c][i] * ia[i]; }
    const sf = boxBlur(fa, w, h, r), sb = boxBlur(bb, w, h, r);
    const fm = new Float32Array(n), bm = new Float32Array(n), fo = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      fm[i] = sf[i] / (wa[i] + 1e-5);
      bm[i] = sb[i] / (wb[i] + 1e-5);
      fo[i] = Math.min(1, Math.max(0, fm[i] + a[i] * (img[c][i] - a[i] * fm[i] - ia[i] * bm[i])));
    }
    Fm.push(fm); Bm.push(bm); Fo.push(fo);
  }
  return { F: Fo, Fmean: Fm, Bmean: Bm };
}

/**
 * Local subject and background colour means at working resolution (two blur-fusion passes, Forte 2021).
 * `img`: [R, G, B] planes 0..1; `a`: alpha 0..1. Radii are in working pixels.
 */
export function foregroundMeans(img, a, w, h, r1, r2) {
  const p1 = fusion(img, img, img, a, w, h, r1);
  const p2 = fusion(img, p1.F, p1.Bmean, a, w, h, r2);
  return { Fmean: p2.Fmean, Bmean: p2.Bmean };
}

export const DEFAULTS = { guided: true, gfRadiusFrac: 0.0015, gfEps: 1e-4, curveLo: 0.3, curveHi: 0.7, decontaminate: true, r1Frac: 0.05, r2Frac: 0.006, bandFrac: 0.002, project: true };

/**
 * Everything computed on the working copy. `rgba`: the photo at working resolution (Uint8ClampedArray, w×h);
 * `mask`: the model's mask stretched to w×h (Uint8, 0..255). Returns the refined alpha (Uint8), the soft mixing
 * alpha used for the colours (`mix`, Uint8), and the subject and
 * background local means packed as RGBA (Uint8ClampedArray, alpha 255) — ready to be drawn stretched per band.
 */
export function refineAtWorkingSize(rgba, mask, w, h, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const n = w * h, side = Math.max(w, h);
  const R = new Float32Array(n), G = new Float32Array(n), Bp = new Float32Array(n), L = new Float32Array(n);
  let a = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    R[i] = rgba[i * 4] / 255; G[i] = rgba[i * 4 + 1] / 255; Bp[i] = rgba[i * 4 + 2] / 255;
    L[i] = 0.299 * R[i] + 0.587 * G[i] + 0.114 * Bp[i];
    a[i] = mask[i] / 255;
  }
  if (o.guided) a = guidedFilter(L, a, w, h, Math.max(1, Math.round(side * o.gfRadiusFrac)), o.gfEps);
  // Two alphas: the curved one is the cut-out's opacity; the soft one (before the curve) is how much of the subject
  // each pixel really holds, which is what the colour correction needs — an edge pixel made opaque by the curve still
  // holds some background colour, and is corrected too.
  const soft = a;
  if (o.curveLo > 0 || o.curveHi < 1) a = alphaCurve(a, o.curveLo, o.curveHi);
  const alpha = new Uint8Array(n), mix = new Uint8Array(n), band = new Uint8Array(n);
  for (let i = 0; i < n; i++) { alpha[i] = Math.round(a[i] * 255); mix[i] = Math.round(soft[i] * 255); }
  // The edge band (a few pixels each side of the cut): there, and only there, the colours may re-decide the alpha.
  const near = boxBlur(soft, w, h, Math.max(1, Math.round(side * o.bandFrac)));
  for (let i = 0; i < n; i++) band[i] = near[i] > 0.01 && near[i] < 0.99 ? 255 : 0;
  let fg = null, bg = null;
  if (o.decontaminate) {
    const { Fmean, Bmean } = foregroundMeans([R, G, Bp], soft, w, h, Math.max(2, Math.round(side * o.r1Frac)), Math.max(1, Math.round(side * o.r2Frac)));
    fg = new Uint8ClampedArray(n * 4); bg = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) {
      fg[i * 4] = Fmean[0][i] * 255; fg[i * 4 + 1] = Fmean[1][i] * 255; fg[i * 4 + 2] = Fmean[2][i] * 255; fg[i * 4 + 3] = 255;
      bg[i * 4] = Bmean[0][i] * 255; bg[i * 4 + 1] = Bmean[1][i] * 255; bg[i * 4 + 2] = Bmean[2][i] * 255; bg[i * 4 + 3] = 255;
    }
  }
  return { alpha, mix, band, fg, bg };
}

/**
 * Full-resolution band: `rgba` (the photo's pixels, rewritten in place) and, for the same pixels, `A`: RGBA from a
 * stretched drawing — R the opacity, G the mixing alpha, B the edge band; `Fm`, `Bm`: the stretched local means
 * (RGBA), or null when no colour correction.
 * In the edge band, where the subject's and the background's local colours are clearly apart, the alpha is read
 * from the colour itself: how far the pixel lies from the background colour towards the subject's (the projection
 * of I − B̄ on F̄ − B̄). The model's mask, computed at 1024 px and stretched, is often one or two pixels too wide;
 * those pixels are background, and no colour correction can make them clean — only a lower alpha. Then the colour:
 * F = F̄ + m (I − m F̄ − (1−m) B̄).
 */
export function composeBand(rgba, A, Fm, Bm, project = true) {
  for (let i = 0; i < rgba.length; i += 4) {
    let al = A[i], mx = A[i + 1];
    if (Fm && project && A[i + 2] > 127 && al > 0) {
      const d0 = Fm[i] - Bm[i], d1 = Fm[i + 1] - Bm[i + 1], d2 = Fm[i + 2] - Bm[i + 2];
      const n2 = d0 * d0 + d1 * d1 + d2 * d2;
      if (n2 > 1600) { // colours at least 40 levels apart
        const p = ((rgba[i] - Bm[i]) * d0 + (rgba[i + 1] - Bm[i + 1]) * d1 + (rgba[i + 2] - Bm[i + 2]) * d2) / n2;
        const ap = p < 0 ? 0 : p > 1 ? 1 : p;
        const conf = Math.min(1, (Math.sqrt(n2) - 40) / 60);
        // never more opaque than the mask said: the colour only removes background, it never adds subject
        al = Math.min(al, Math.round(al * (1 - conf) + ap * 255 * conf));
        mx = Math.min(mx, Math.round(ap * 255));
      }
    }
    rgba[i + 3] = al;
    if (!Fm || al === 0 || mx === 255) continue;
    const t = mx / 255, u = 1 - t;
    for (let c = 0; c < 3; c++) {
      const I = rgba[i + c], f = Fm[i + c], b = Bm[i + c];
      const v = f + t * (I - t * f - u * b);
      rgba[i + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
    }
  }
}

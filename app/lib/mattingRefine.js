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
// P31 (03/10): the owner's real photo still kept a violet line along the mug's rim. Cause: the local means of step 2
// use a 5 % radius (≈ 50 px), so next to a thin rim F̄ mixed the white rim with the coffee and B̄ the violet cloth with
// the dark room behind it — the projection then kept background pixels opaque. Now (estimator 'local', the default):
// the subject's and the background's colours come from the NEAREST sure pixels (pull-push, Gortler 1996), the alpha
// is re-decided in the mask's transition band with them, and each pixel's subject colour is solved from
// I = αF + (1−α)B by fast multi-level foreground estimation (Germer et al. 2020, port of pymatting's MIT code).
// Bench (28 cases): background colour left in the edge 4.9 % → 3.9 %, alpha error unchanged (2.79 → 2.78).
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

/**
 * P31 (03/10) — masked pull-push (Gortler et al. 1996): fills every pixel with the colour of the NEAREST known pixels,
 * at whatever scale they are found. `planes`: [R, G, B] Float32 (0..1); `known`: Float32 weights 0..1. Returns 3 planes.
 * Unlike a fixed-radius mean (blur fusion, r = 5 % of the photo), a thin subject part (a mug's 6 px rim) gets ITS colour,
 * not the average of the rim and the coffee 30 px further in.
 */
export function pullPush(planes, known, w, h) {
  const levels = [];
  let cw = w, ch = h, wt = known, cs = planes.map((p) => { const o = new Float32Array(w * h); for (let i = 0; i < o.length; i++) o[i] = p[i] * known[i]; return o; });
  // pull: 2×2 sums of weight and weighted colour, the weight then capped at 1 (colours stored normalised)
  for (;;) {
    const norm = cs.map((s) => { const o = new Float32Array(cw * ch); for (let i = 0; i < o.length; i++) o[i] = wt[i] > 0 ? s[i] / wt[i] : 0; return o; });
    const wc = new Float32Array(cw * ch); for (let i = 0; i < wc.length; i++) wc[i] = Math.min(1, wt[i]);
    levels.push({ w: cw, h: ch, c: norm, wt: wc });
    if (cw === 1 && ch === 1) break;
    const nw = Math.max(1, (cw + 1) >> 1), nh = Math.max(1, (ch + 1) >> 1);
    const nwt = new Float32Array(nw * nh), ncs = [0, 1, 2].map(() => new Float32Array(nw * nh));
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const i = y * cw + x, j = (y >> 1) * nw + (x >> 1), a = wc[i];
      if (a === 0) continue;
      nwt[j] += a;
      for (let c = 0; c < 3; c++) ncs[c][j] += norm[c][i] * a;
    }
    cw = nw; ch = nh; wt = nwt; cs = ncs;
  }
  // push: each level keeps its own colour where it is known (weight 1) and takes the coarser level's, bilinearly
  // upsampled, where it is not
  for (let l = levels.length - 2; l >= 0; l--) {
    const f = levels[l], g = levels[l + 1];
    for (let y = 0; y < f.h; y++) {
      const gy = Math.min(g.h - 1, Math.max(0, (y - 0.5) / 2)), y0 = Math.floor(gy), y1 = Math.min(g.h - 1, y0 + 1), ty = gy - y0;
      for (let x = 0; x < f.w; x++) {
        const i = y * f.w + x, a = f.wt[i];
        if (a >= 1) continue;
        const gx = Math.min(g.w - 1, Math.max(0, (x - 0.5) / 2)), x0 = Math.floor(gx), x1 = Math.min(g.w - 1, x0 + 1), tx = gx - x0;
        for (let c = 0; c < 3; c++) {
          const p = g.c[c];
          const up = (p[y0 * g.w + x0] * (1 - tx) + p[y0 * g.w + x1] * tx) * (1 - ty) + (p[y1 * g.w + x0] * (1 - tx) + p[y1 * g.w + x1] * tx) * ty;
          f.c[c][i] = f.c[c][i] * a + up * (1 - a);
        }
      }
    }
  }
  return levels[0].c;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * P31 (03/10) — fast multi-level foreground estimation (Germer, Uelwer, Conrad, Harmeling, "Fast Multi-Level
 * Foreground Estimation", ICPR 2020; port of pymatting's estimate_fg_bg_ml, MIT licence). Solves I = αF + (1−α)B for
 * F and B per pixel, with a smoothness term weighted by the alpha gradient, coarse to fine. `img`: [R, G, B] planes
 * 0..1, `a`: alpha 0..1. Returns { F, B } (3 planes each).
 */
export function estimateForegroundML(img, a, w0, h0, { regularization = 1e-5, nSmall = 10, nBig = 2, smallSize = 32, gradientWeight = 1 } = {}) {
  const nLevels = Math.ceil(Math.log2(Math.max(w0, h0)));
  const mean = [0, 1, 2].map((c) => { let s = 0; for (let i = 0; i < img[c].length; i++) s += img[c][i]; return s / img[c].length; });
  let pw = 1, ph = 1;
  let Fp = mean.map((m) => Float32Array.of(m)), Bp = mean.map((m) => Float32Array.of(m));
  const nearest = (src, sw, sh, w, h) => {
    const o = new Float32Array(w * h);
    for (let y = 0; y < h; y++) { const sy = Math.min(sh - 1, Math.floor(y * sh / h)) * sw; for (let x = 0; x < w; x++) o[y * w + x] = src[sy + Math.min(sw - 1, Math.floor(x * sw / w))]; }
    return o;
  };
  for (let lv = 0; lv <= nLevels; lv++) {
    const w = Math.max(1, Math.round(w0 ** (lv / nLevels))), h = Math.max(1, Math.round(h0 ** (lv / nLevels)));
    const I = lv === nLevels && w === w0 && h === h0 ? img : img.map((p) => nearest(p, w0, h0, w, h));
    const A = lv === nLevels && w === w0 && h === h0 ? a : nearest(a, w0, h0, w, h);
    const F = Fp.map((p) => nearest(p, pw, ph, w, h)), B = Bp.map((p) => nearest(p, pw, ph, w, h));
    const nIter = w <= smallSize && h <= smallSize ? nSmall : nBig;
    const [F0, F1, F2] = F, [B0, B1, B2] = B, [I0, I1, I2] = I;
    for (let it = 0; it < nIter; it++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, a0 = A[i], a1 = 1 - a0;
        let a00 = a0 * a0, a11 = a1 * a1;
        const a01 = a0 * a1;
        let f0 = 0, f1 = 0, f2 = 0, b0 = 0, b1 = 0, b2 = 0;
        // the 4 neighbours, clamped at the borders (written out: this loop runs millions of times)
        for (let k = 0; k < 4; k++) {
          const j = k === 0 ? (y > 0 ? i - w : i) : k === 1 ? (y < h - 1 ? i + w : i) : k === 2 ? (x > 0 ? i - 1 : i) : (x < w - 1 ? i + 1 : i);
          const da = regularization + gradientWeight * Math.abs(a0 - A[j]);
          a00 += da; a11 += da;
          f0 += da * F0[j]; f1 += da * F1[j]; f2 += da * F2[j];
          b0 += da * B0[j]; b1 += da * B1[j]; b2 += da * B2[j];
        }
        const inv = 1 / (a00 * a11 - a01 * a01);
        const r0 = a0 * I0[i], r1 = a0 * I1[i], r2 = a0 * I2[i], s0 = a1 * I0[i], s1 = a1 * I1[i], s2 = a1 * I2[i];
        F0[i] = clamp01(inv * (a11 * (r0 + f0) - a01 * (s0 + b0)));
        F1[i] = clamp01(inv * (a11 * (r1 + f1) - a01 * (s1 + b1)));
        F2[i] = clamp01(inv * (a11 * (r2 + f2) - a01 * (s2 + b2)));
        B0[i] = clamp01(inv * (a00 * (s0 + b0) - a01 * (r0 + f0)));
        B1[i] = clamp01(inv * (a00 * (s1 + b1) - a01 * (r1 + f1)));
        B2[i] = clamp01(inv * (a00 * (s2 + b2) - a01 * (r2 + f2)));
      }
    }
    Fp = F; Bp = B; pw = w; ph = h;
  }
  return { F: Fp, B: Bp };
}

/** Square erosion of a 0/1 plane: 1 only where every pixel within r is 1. */
function erode(bin, w, h, r) {
  if (r < 1) return bin;
  const m = boxBlur(bin, w, h, r), o = new Float32Array(w * h);
  for (let i = 0; i < o.length; i++) o[i] = m[i] > 0.9999 ? 1 : 0;
  return o;
}

export const DEFAULTS = { guided: true, gfRadiusFrac: 0.0015, gfEps: 1e-4, curveLo: 0.1, curveHi: 0.9, decontaminate: true, r1Frac: 0.05, r2Frac: 0.006, bandFrac: 0.002, project: true, estimator: 'local', ml: true, bandMode: 'transition', erodeFrac: 0.001, projLo: 40, projSpan: 60 };

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
  if (o.decontaminate && o.estimator !== 'blur') {
    // P31 (03/10): the subject's and the background's colours are taken from the NEAREST pixels that are surely
    // subject (soft alpha ≥ 0.98, eroded by `erodeFrac`) and surely background (≤ 0.02, eroded the same) — the
    // stretched mask is often a few pixels too wide or too narrow, so the pixels right at the cut are not trusted.
    // Everything between the two is the edge band, where the colour re-decides the alpha (projection, as composeBand
    // does at full size); then each pixel's subject colour is solved from I = αF + (1−α)B (Germer 2020).
    const re = Math.max(1, Math.round(side * o.erodeFrac));
    const fk = new Float32Array(n), bk = new Float32Array(n);
    for (let i = 0; i < n; i++) { fk[i] = soft[i] >= 0.98 ? 1 : 0; bk[i] = soft[i] <= 0.02 ? 1 : 0; }
    const Fk = erode(fk, w, h, re), Bk = erode(bk, w, h, re);
    let hasF = false, hasB = false;
    for (let i = 0; i < n; i++) { if (Fk[i]) hasF = true; if (Bk[i]) hasB = true; }
    const img = [R, G, Bp];
    if (hasF && hasB) {
      const Fh = pullPush(img, Fk, w, h), Bh = pullPush(img, Bk, w, h);
      if (o.bandMode === 'transition') {
        // the band where the colour may re-decide the alpha stays the mask's own transition (± bandFrac); only the
        // colours come from farther away
        const near = boxBlur(soft, w, h, Math.max(1, Math.round(side * o.bandFrac)));
        for (let i = 0; i < n; i++) band[i] = near[i] > 0.01 && near[i] < 0.99 ? 255 : 0;
      } else for (let i = 0; i < n; i++) band[i] = Fk[i] || Bk[i] ? 0 : 255;
      let F = Fh, B = Bh;
      if (o.ml) {
        // the alpha the colours are solved with: the soft one, re-decided by the colour in the band
        const am = new Float32Array(n), px = new Uint8ClampedArray(4), fm = new Uint8ClampedArray(4), bm = new Uint8ClampedArray(4);
        for (let i = 0; i < n; i++) {
          if (!band[i]) { am[i] = soft[i]; continue; }
          for (let c = 0; c < 3; c++) { px[c] = img[c][i] * 255; fm[c] = Fh[c][i] * 255; bm[c] = Bh[c][i] * 255; }
          am[i] = projectAlpha(px, 0, fm, bm, alpha[i], mix[i], o)[1] / 255;
        }
        ({ F, B } = estimateForegroundML(img, am, w, h));
      }
      const fg = new Uint8ClampedArray(n * 4), bg = new Uint8ClampedArray(n * 4);
      for (let i = 0; i < n; i++) {
        for (let c = 0; c < 3; c++) { fg[i * 4 + c] = F[c][i] * 255; bg[i * 4 + c] = B[c][i] * 255; }
        fg[i * 4 + 3] = 255; bg[i * 4 + 3] = 255;
      }
      return { alpha, mix, band, fg, bg };
    }
    // no sure subject or no sure background anywhere (tiny or odd mask): the blur-fusion means below
  }
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


const proj = [0, 0];
/**
 * In the edge band, where the subject's and the background's local colours are clearly apart, the alpha is read
 * from the colour itself: how far the pixel lies from the background colour towards the subject's (the projection
 * of I − B̄ on F̄ − B̄). The model's mask, computed at 1024 px and stretched, is often one or two pixels too wide;
 * those pixels are background, and no colour correction can make them clean — only a lower alpha. Never more opaque
 * than the mask said: the colour only removes background, it never adds subject. `I`, `F`, `B`: 0..255 at index i.
 * Returns [opacity, mixing alpha] (0..255), in a shared array.
 */
export function projectAlpha(I, i, F, B, al, mx, o = {}) {
  const lo = o.projLo ?? 40, span = o.projSpan ?? 60;
  proj[0] = al; proj[1] = mx;
  const d0 = F[i] - B[i], d1 = F[i + 1] - B[i + 1], d2 = F[i + 2] - B[i + 2];
  const n2 = d0 * d0 + d1 * d1 + d2 * d2;
  if (n2 > lo * lo) {
    const p = ((I[i] - B[i]) * d0 + (I[i + 1] - B[i + 1]) * d1 + (I[i + 2] - B[i + 2]) * d2) / n2;
    const ap = p < 0 ? 0 : p > 1 ? 1 : p;
    let conf = Math.min(1, (Math.sqrt(n2) - lo) / span);
    if (o.projResid) {
      // a colour far off the line between the two (a shade, a reflection, another part of the subject) is not a mix
      // of them: the two-colour model does not explain it, and the mask's alpha is kept
      const e0 = I[i] - B[i] - p * d0, e1 = I[i + 1] - B[i + 1] - p * d1, e2 = I[i + 2] - B[i + 2] - p * d2;
      const r = Math.sqrt((e0 * e0 + e1 * e1 + e2 * e2) / n2);
      conf *= Math.max(0, 1 - r / o.projResid);
    }
    proj[0] = Math.min(al, Math.round(al * (1 - conf) + ap * 255 * conf));
    proj[1] = Math.min(mx, Math.round(ap * 255));
  }
  return proj;
}

/**
 * Full-resolution band: `rgba` (the photo's pixels, rewritten in place) and, for the same pixels, `A`: RGBA from a
 * stretched drawing — R the opacity, G the mixing alpha, B the edge band; `Fm`, `Bm`: the stretched subject and
 * background colours (RGBA), or null when no colour correction. In the band the alpha is re-decided by the colour
 * (projectAlpha); then the colour: F = F̄ + m (I − m F̄ − (1−m) B̄) (Forte 2021's last step, which also brings back
 * the full-resolution detail the working-size colours lack).
 */
export function composeBand(rgba, A, Fm, Bm, project = true, o = DEFAULTS) {
  for (let i = 0; i < rgba.length; i += 4) {
    let al = A[i], mx = A[i + 1];
    if (Fm && project && A[i + 2] > 127 && al > 0) [al, mx] = projectAlpha(rgba, i, Fm, Bm, al, mx, o);
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

// Background Remover edge bench (P21, 02/10): runs the page's own refinement code (app/lib/mattingRefine.js) on the
// cases made by make-cases.py (real hand-cut photos on difficult backgrounds, IS-Net masks from the production
// model run locally) and measures the result against the TRUE alpha and colours.
//   - alpha error: mean |α − α_true| (0-255) over the whole image;
//   - veil: opacity left where the truth is fully transparent, as % of the subject's own opacity (halo, background
//     pieces); holes: opacity missing inside the subject, same unit;
//   - edge colour error: the cut-out laid on WHITE and on BLACK vs the truth laid on the same, mean absolute error
//     (0-255) over the edge band — this is the "blue line" a visitor sees.
// Variants: "production" (mask stretched, photo colours kept: what www does today) and the refined settings.
// Usage: node scripts/p21/bg-bench/bench.mjs [--only=case,case] [--write]  (--write saves PNG crops for the report)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { refineAtWorkingSize, composeBand, boxBlur, WORK_PIXELS, DEFAULTS } from '../../../app/lib/mattingRefine.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', '..');
const DIR = path.join(ROOT, 'docs', 'audit', 'detourage-p21');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const write = process.argv.includes('--write');
const index = JSON.parse(fs.readFileSync(path.join(DIR, 'cases', 'index.json'), 'utf8'));

const raw = async (img, w, h, channels) => {
  let s = sharp(img);
  if (w) s = s.resize(w, h, { fit: 'fill', kernel: 'lanczos3' });
  if (channels === 4) s = s.ensureAlpha(); else if (channels === 3) s = s.removeAlpha(); else s = s.toColourspace('b-w');
  const { data } = await s.raw().toBuffer({ resolveWithObject: true });
  return new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
};
const toRGBA = (buf, ch) => { if (ch === 4) return buf; const n = buf.length / ch, o = new Uint8ClampedArray(n * 4); for (let i = 0; i < n; i++) { for (let c = 0; c < 3; c++) o[i * 4 + c] = buf[i * ch + (ch === 1 ? 0 : c)]; o[i * 4 + 3] = 255; } return o; };

export async function runVariant(c, variant) {
  const d = path.join(DIR, 'cases', c.case);
  const W = c.width, H = c.height;
  const photo = toRGBA(await raw(path.join(d, 'composite.jpg'), 0, 0, 3), 3);
  const out = new Uint8ClampedArray(photo);
  const maskFile = (typeof variant === 'object' && variant.mask) || 'mask.png';
  if (variant === 'production' || variant.raw) {
    const m = await raw(path.join(d, maskFile), W, H, 1);
    for (let i = 0; i < W * H; i++) out[i * 4 + 3] = m[i];
    return out;
  }
  const opts = typeof variant === 'object' ? variant : {};
  const k = Math.min(1, Math.sqrt((Number(process.env.BG_WORK) || WORK_PIXELS) / (W * H)));
  const w = Math.max(1, Math.round(W * k)), h = Math.max(1, Math.round(H * k));
  const work = toRGBA(await raw(path.join(d, 'composite.jpg'), w, h, 3), 3);
  const mask = await raw(path.join(d, maskFile), w, h, 1);
  const r = refineAtWorkingSize(work, mask, w, h, opts);
  const stretch = (buf, ch) => raw(Buffer.from(buf.buffer, buf.byteOffset, buf.length), W, H, 4).catch(() => null);
  const am = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { am[i * 4] = r.alpha[i]; am[i * 4 + 1] = r.mix[i]; am[i * 4 + 2] = r.band[i]; am[i * 4 + 3] = 255; }
  const A = await raw(await sharp(Buffer.from(am.buffer), { raw: { width: w, height: h, channels: 4 } }).png().toBuffer(), W, H, 4);
  let Fm = null, Bm = null;
  if (r.fg) {
    Fm = await raw(await sharp(Buffer.from(r.fg.buffer), { raw: { width: w, height: h, channels: 4 } }).png().toBuffer(), W, H, 4);
    Bm = await raw(await sharp(Buffer.from(r.bg.buffer), { raw: { width: w, height: h, channels: 4 } }).png().toBuffer(), W, H, 4);
  }
  void stretch;
  composeBand(out, A, Fm, Bm, opts.project !== false);
  return out;
}

function metrics(res, gt, bgImg, W, H) {
  const n = W * H;
  let aErr = 0, veil = 0, holes = 0, solid = 0;
  for (let i = 0; i < n; i++) {
    const a = res[i * 4 + 3], t = gt[i * 4 + 3];
    aErr += Math.abs(a - t);
    solid += t;
    if (t === 0) veil += a;
    if (t === 255) holes += 255 - a;
  }
  // edge band: within 4 px of a change of the true alpha
  const edge = new Uint8Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, t = gt[i * 4 + 3];
    if (t > 0 && t < 255) { edge[i] = 1; continue; }
    for (let dy = -4; dy <= 4 && !edge[i]; dy += 2) for (let dx = -4; dx <= 4; dx += 2) {
      const yy = y + dy, xx = x + dx;
      if (yy < 0 || xx < 0 || yy >= H || xx >= W) continue;
      if (gt[(yy * W + xx) * 4 + 3] !== t) { edge[i] = 1; break; }
    }
  }
  let eW = 0, eB = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    if (!edge[i]) continue;
    cnt++;
    const a = res[i * 4 + 3] / 255, t = gt[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c++) {
      const rc = res[i * 4 + c], gc = gt[i * 4 + c];
      eW += Math.abs((rc * a + 255 * (1 - a)) - (gc * t + 255 * (1 - t)));
      eB += Math.abs(rc * a - gc * t);
    }
  }
  // Background leak — the "blue line": how much of the (known) background colour each edge pixel of the cut-out still
  // carries, as a fraction of the way from the subject's colour to the background's (0 = clean, 100 = background).
  // Subject colour = the true one, or the local mean of the true subject next to a pixel outside it.
  const ga = new Float32Array(n); for (let i = 0; i < n; i++) ga[i] = gt[i * 4 + 3] / 255;
  const wa = boxBlur(ga, W, H, 6), loc = [];
  for (let c = 0; c < 3; c++) { const pl = new Float32Array(n); for (let i = 0; i < n; i++) pl[i] = gt[i * 4 + c] * ga[i]; const b = boxBlur(pl, W, H, 6); for (let i = 0; i < n; i++) b[i] /= wa[i] + 1e-6; loc.push(b); }
  let leak = 0, lw = 0, leakSolid = 0, wSolid = 0;
  for (let i = 0; i < n; i++) {
    if (!edge[i]) continue;
    const a = res[i * 4 + 3] / 255;
    if (a < 0.02 || wa[i] < 0.01) continue;
    let dot = 0, nn = 0;
    for (let c = 0; c < 3; c++) {
      const G = gt[i * 4 + 3] > 0 ? gt[i * 4 + c] : loc[c][i];
      const d = bgImg[i * 3 + c] - G, e = res[i * 4 + c] - G;
      dot += d * e; nn += d * d;
    }
    if (nn < 900) continue; // subject and background of similar colour here: nothing to measure
    const t = Math.min(1, Math.max(0, dot / nn));
    leak += a * t; lw += a;
    if (a === 1) { leakSolid += t; wSolid += 1; }
  }
  return {
    bgLeakPct: +((leak / (lw || 1)) * 100).toFixed(2),
    leakFromSolidPct: +((leakSolid / (leak || 1)) * 100).toFixed(1), // share of the leak carried by fully opaque pixels
    alphaMAE: +(aErr / n).toFixed(2),
    veilPct: +((veil / solid) * 100).toFixed(2),
    holesPct: +((holes / solid) * 100).toFixed(2),
    edgeOnWhite: +(eW / (cnt * 3)).toFixed(2),
    edgeOnBlack: +(eB / (cnt * 3)).toFixed(2),
  };
}

const VARIANTS = {
  production: 'production',
  decontaminate: { guided: false, curveLo: 0, curveHi: 1, decontaminate: true },
  refined: { ...DEFAULTS },
  'refined-noproj': { ...DEFAULTS, project: false },
};
if (process.env.BG_VARIANTS) { Object.assign(VARIANTS, JSON.parse(process.env.BG_VARIANTS)); for (const k of Object.keys(VARIANTS)) if (VARIANTS[k] === null) delete VARIANTS[k]; }

const rows = [];
for (const c of index) {
  if (only.length && !only.includes(c.case)) continue;
  const gt = await raw(path.join(DIR, 'cases', c.case, 'gt.png'), 0, 0, 4);
  const bgImg = await raw(path.join(DIR, 'cases', c.case, 'background.png'), 0, 0, 3);
  const row = { case: c.case };
  for (const [vn, v] of Object.entries(VARIANTS)) {
    const t0 = Date.now();
    const res = await runVariant(c, v);
    row[vn] = { ...metrics(res, gt, bgImg, c.width, c.height), ms: Date.now() - t0 };
    if (write) {
      fs.mkdirSync(path.join(DIR, 'out'), { recursive: true });
      await sharp(Buffer.from(res.buffer), { raw: { width: c.width, height: c.height, channels: 4 } })
        .flatten({ background: '#ffffff' }).jpeg({ quality: 88 }).toFile(path.join(DIR, 'out', `${c.case}__${vn}__white.jpg`));
    }
  }
  rows.push(row);
  console.log(c.case, Object.entries(row).filter(([k]) => k !== 'case').map(([k, m]) => `${k}: leak${m.bgLeakPct}% α${m.alphaMAE} veil${m.veilPct}% holes${m.holesPct}% edgeW${m.edgeOnWhite} edgeB${m.edgeOnBlack}`).join(' | '));
}
const mean = (vn, key) => +(rows.reduce((s, r) => s + r[vn][key], 0) / rows.length).toFixed(2);
console.log('\nMEAN over', rows.length, 'cases');
for (const vn of Object.keys(VARIANTS)) console.log(vn.padEnd(14), ['bgLeakPct', 'alphaMAE', 'veilPct', 'holesPct', 'edgeOnWhite', 'edgeOnBlack'].map((k) => `${k} ${mean(vn, k)}`).join('  '));
fs.writeFileSync(path.join(DIR, 'mesures.json'), JSON.stringify(rows, null, 1));

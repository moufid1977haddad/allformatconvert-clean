// P32 (04/10) — Background Remover model bench: the current model (IS-Net + largest-component filter, run locally by
// prep.py) against BRIA RMBG 2.0 and BiRefNet v2 (fal, masks from fal-masks.mjs), each mask put through the page's own
// cut-out pipeline (scripts/p31/bg/lib.mjs -> app/lib/mattingRefine.js, P31 DEFAULTS) at the photo's FULL resolution,
// exactly as the site recomposites the small returned mask on the original photo.
// Variants per model: "brut" (mask stretched as alpha, photo colours kept) and "p31" (the page today). For the fal
// models also "lcc-p31": the production service's largest-connected-component filter applied to their mask first.
//
// Measures on the 28 P21/P31 cases (true alpha gt.png + known background.png): the P21/P31 bench metrics, same code
// (bgLeakPct = "fond resté dans le bord", alphaMAE, veilPct, holesPct, edgeOnWhite/Black), plus
//   - fondGardePx / fondGardePct : pieces of background kept = pixels the cut-out shows OPAQUE (alpha >= 128) more than
//     6 px away from any pixel of the true subject (alpha_true > 0); % of the true subject's area (sum alpha_true/255).
//     fondGardeRegions = number of 8-connected such regions of >= 100 px; fondGardeMaxPx = the largest one.
//   - sujetPerduPx / sujetPerduPct : subject cut = pixels of the true subject's interior (alpha_true = 255 and more
//     than 6 px from any non-opaque true pixel) the cut-out leaves transparent (alpha < 128); same % unit.
// On the owner's photo IMG_2433 (no true alpha): the P31 "violet" measure (scripts/p31/bg/violet-metric.mjs, same
// rule) on the whole cut-out and in its top quarter, and "nappePx" = opaque pixels (alpha >= 128) (see RIM below):
// the tablecloth piece: opaque pixels (alpha >= 128) ABOVE the cup's rim, x in [80, 320] (where IS-Net keeps the
// piece and the wire), y >= 50 and more than 2 px above the rim line RIM (read by hand on the photo, 3x-4x zoom:
// at x = 120 and 170 the rim's top edge is at y = 107 and 96; recorded in the JSON).
// Usage: node scripts/p32/bg/bench.mjs [--only=case,case]
//        -> docs/audit/p32-bg/mesures-p32.json (rows of other cases kept when --only is given)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { cutout } from '../../p31/bg/lib.mjs';
import { boxBlur, DEFAULTS } from '../../../app/lib/mattingRefine.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', '..');
const CASES = path.join(ROOT, 'docs', 'audit', 'detourage-p21', 'cases');
const WORK = path.join(ROOT, 'docs', 'audit', 'p32-bg', 'private', 'work');
const OUT = path.join(ROOT, 'docs', 'audit', 'p32-bg', 'mesures-p32.json');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { cases: [] };
const RIM = [[80, 125], [100, 115], [120, 107], [140, 101], [160, 97], [180, 95], [200, 93], [220, 92], [240, 93], [260, 93], [280, 95], [300, 98], [320, 103]];
const TABLECLOTH = { rim: RIM, marginPx: 2, yMin: 50 };
const rimY = (x) => { for (let k = 1; k < RIM.length; k++) if (x <= RIM[k][0]) { const [x0, y0] = RIM[k - 1], [x1, y1] = RIM[k]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); } return null; };
const inPiece = (x, y) => x >= RIM[0][0] && x <= RIM[RIM.length - 1][0] && y >= TABLECLOTH.yMin && y < rimY(x) - TABLECLOTH.marginPx;

const raw = async (img, ch) => {
  let s = sharp(img);
  s = ch === 4 ? s.ensureAlpha() : ch === 3 ? s.removeAlpha() : s.toColourspace('b-w');
  const { data, info } = await s.raw().toBuffer({ resolveWithObject: true });
  return { d: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), w: info.width, h: info.height };
};

// 8-connected components of `on` (Uint8Array) -> { lab, sizes } (label 0 = off)
export function components(on, W, H) {
  const lab = new Int32Array(W * H), sizes = [0], st = new Int32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    if (!on[i] || lab[i]) continue;
    const L = sizes.length; let n = 0, sp = 0; st[sp++] = i; lab[i] = L;
    while (sp) {
      const p = st[--sp]; n++;
      const x = p % W, y = (p / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const q = yy * W + xx; if (on[q] && !lab[q]) { lab[q] = L; st[sp++] = q; }
      }
    }
    sizes.push(n);
  }
  return { lab, sizes };
}

// services/background-removal/app/infer.py keep_largest_connected_component, same rule (binarize >= 127, 8-conn,
// keep the largest component with its soft values), on the mask at the upload size
async function lccMask(src, dst) {
  const { d, w, h } = await raw(src, 1);
  const on = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) on[i] = d[i] >= 127 ? 1 : 0;
  const { lab, sizes } = components(on, w, h);
  let best = 1; for (let L = 2; L < sizes.length; L++) if (sizes[L] > sizes[best]) best = L;
  const o = Buffer.alloc(w * h); for (let i = 0; i < w * h; i++) o[i] = sizes.length <= 2 || lab[i] === best ? d[i] : 0;
  await sharp(o, { raw: { width: w, height: h, channels: 1 } }).png().toFile(dst);
}

// ---- P21/P31 metrics, copied from scripts/p21/bg-bench/bench.mjs (that file runs its own bench on import) ----
function metricsP21(res, gt, bgImg, W, H) {
  const n = W * H;
  let aErr = 0, veil = 0, holes = 0, solid = 0;
  for (let i = 0; i < n; i++) { const a = res[i * 4 + 3], t = gt[i * 4 + 3]; aErr += Math.abs(a - t); solid += t; if (t === 0) veil += a; if (t === 255) holes += 255 - a; }
  const edge = new Uint8Array(n);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, t = gt[i * 4 + 3];
    if (t > 0 && t < 255) { edge[i] = 1; continue; }
    for (let dy = -4; dy <= 4 && !edge[i]; dy += 2) for (let dx = -4; dx <= 4; dx += 2) {
      const yy = y + dy, xx = x + dx; if (yy < 0 || xx < 0 || yy >= H || xx >= W) continue;
      if (gt[(yy * W + xx) * 4 + 3] !== t) { edge[i] = 1; break; }
    }
  }
  let eW = 0, eB = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    if (!edge[i]) continue; cnt++;
    const a = res[i * 4 + 3] / 255, t = gt[i * 4 + 3] / 255;
    for (let c = 0; c < 3; c++) { const rc = res[i * 4 + c], gc = gt[i * 4 + c]; eW += Math.abs((rc * a + 255 * (1 - a)) - (gc * t + 255 * (1 - t))); eB += Math.abs(rc * a - gc * t); }
  }
  const ga = new Float32Array(n); for (let i = 0; i < n; i++) ga[i] = gt[i * 4 + 3] / 255;
  const wa = boxBlur(ga, W, H, 6), loc = [];
  for (let c = 0; c < 3; c++) { const pl = new Float32Array(n); for (let i = 0; i < n; i++) pl[i] = gt[i * 4 + c] * ga[i]; const b = boxBlur(pl, W, H, 6); for (let i = 0; i < n; i++) b[i] /= wa[i] + 1e-6; loc.push(b); }
  let leak = 0, lw = 0, leakSolid = 0;
  for (let i = 0; i < n; i++) {
    if (!edge[i]) continue;
    const a = res[i * 4 + 3] / 255; if (a < 0.02 || wa[i] < 0.01) continue;
    let dot = 0, nn = 0;
    for (let c = 0; c < 3; c++) { const G = gt[i * 4 + 3] > 0 ? gt[i * 4 + c] : loc[c][i]; const d = bgImg[i * 3 + c] - G, e = res[i * 4 + c] - G; dot += d * e; nn += d * d; }
    if (nn < 900) continue;
    const t = Math.min(1, Math.max(0, dot / nn)); leak += a * t; lw += a; if (a === 1) leakSolid += t;
  }
  return {
    bgLeakPct: +((leak / (lw || 1)) * 100).toFixed(2), leakFromSolidPct: +((leakSolid / (leak || 1)) * 100).toFixed(1),
    alphaMAE: +(aErr / n).toFixed(2), veilPct: +((veil / solid) * 100).toFixed(2), holesPct: +((holes / solid) * 100).toFixed(2),
    edgeOnWhite: +(eW / (cnt * 3)).toFixed(2), edgeOnBlack: +(eB / (cnt * 3)).toFixed(2),
  };
}

function piecesAndCuts(res, gt, W, H) {
  const n = W * H, R = 6;
  const subj = new Float32Array(n), notSolid = new Float32Array(n); let area = 0;
  for (let i = 0; i < n; i++) { const t = gt[i * 4 + 3]; subj[i] = t > 0 ? 1 : 0; notSolid[i] = t < 255 ? 1 : 0; area += t / 255; }
  const nearSubj = boxBlur(subj, W, H, R), nearEdge = boxBlur(notSolid, W, H, R);
  const kept = new Uint8Array(n); let keptPx = 0, cutPx = 0;
  for (let i = 0; i < n; i++) {
    const a = res[i * 4 + 3];
    if (a >= 128 && nearSubj[i] < 1e-6) { kept[i] = 1; keptPx++; }
    if (gt[i * 4 + 3] === 255 && nearEdge[i] < 1e-6 && a < 128) cutPx++;
  }
  const { sizes } = components(kept, W, H);
  const rest = sizes.slice(1);
  return {
    fondGardePx: keptPx, fondGardePct: +((keptPx / area) * 100).toFixed(3), fondGardeRegions: rest.filter((s) => s >= 100).length,
    fondGardeMaxPx: rest.reduce((m, s) => Math.max(m, s), 0), sujetPerduPx: cutPx, sujetPerduPct: +((cutPx / area) * 100).toFixed(3),
  };
}

function violet(res, W, H) {
  let v = 0, vt = 0, op = 0, nappe = 0, nappeA = 0, nappeArea = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, r = res[i], g = res[i + 1], b = res[i + 2], a = res[i + 3] / 255;
    op += a;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (b - Math.max(r, g) > 25 && luma > 120) { v += a; if (y < 0.25 * H) vt += a; }
    if (inPiece(x, y)) { nappeArea++; if (res[i + 3] >= 128) nappe++; nappeA += a; }
  }
  return { violetPx: Math.round(v), violetTopPx: Math.round(vt), opaquePx: Math.round(op), nappePx: nappe, nappeAlphaPx: Math.round(nappeA), nappeZonePx: nappeArea };
}

const MODELS = ['isnet', 'bria', 'birefnet'];
const variantsFor = (m) => (m === 'isnet' ? { brut: 'production', p31: { ...DEFAULTS } } : { brut: 'production', p31: { ...DEFAULTS }, 'lcc-p31': { ...DEFAULTS, lcc: true } });

const index = JSON.parse(fs.readFileSync(path.join(CASES, 'index.json'), 'utf8'));
const jobs = [...index.map((c) => ({ case: c.case, photo: path.join(CASES, c.case, 'composite.jpg') })), { case: 'IMG_2433', photo: path.join(WORK, 'IMG_2433', 'photo.png'), owner: true }];
const isnetMs = JSON.parse(fs.readFileSync(path.join(WORK, 'isnet-times.json'), 'utf8'));
const falLog = { bria: JSON.parse(fs.readFileSync(path.join(WORK, 'fal-log-bria.json'), 'utf8')), birefnet: JSON.parse(fs.readFileSync(path.join(WORK, 'fal-log-birefnet.json'), 'utf8')) };
const rows = only.length ? prev.cases.filter((r) => !only.includes(r.case)) : [];

for (const c of jobs) {
  if (only.length && !only.includes(c.case)) continue;
  const d = path.join(WORK, c.case);
  const { w: W, h: H } = await raw(c.photo, 3);
  const gt = c.owner ? null : (await raw(path.join(CASES, c.case, 'gt.png'), 4)).d;
  const bgImg = c.owner ? null : (await raw(path.join(CASES, c.case, 'background.png'), 3)).d;
  const row = { case: c.case, width: W, height: H };
  for (const m of MODELS) {
    const lccPath = path.join(d, `mask_${m}-lcc.png`);
    if (m !== 'isnet') await lccMask(path.join(d, `mask_${m}.png`), lccPath);
    row[m] = m === 'isnet' ? { callMs: isnetMs[c.case], where: 'CPU local (onnxruntime), inference + filtre' } : { callMs: falLog[m][c.case].ms, where: 'fal.run sync, horloge murale avec envoi' };
    for (const [vn, v] of Object.entries(variantsFor(m))) {
      const maskPath = v.lcc ? lccPath : path.join(d, `mask_${m}.png`);
      const res = await cutout(c.photo, maskPath, W, H, v);
      const met = c.owner ? violet(res, W, H) : { ...metricsP21(res, gt, bgImg, W, H), ...piecesAndCuts(res, gt, W, H) };
      if (res.workMs) met.refineMs = Math.round(res.workMs);
      row[m][vn] = met;
      await sharp(Buffer.from(res.buffer, res.byteOffset, res.length), { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(d, `cut_${m}_${vn}.png`));
    }
  }
  rows.push(row);
  const s = (m, v) => { const x = row[m][v]; return c.owner ? `violet ${x.violetPx}/${x.violetTopPx} nappe ${x.nappePx ?? '-'}` : `leak ${x.bgLeakPct} a ${x.alphaMAE} keep ${x.fondGardePct} cut ${x.sujetPerduPct}`; };
  console.log(c.case.padEnd(18), MODELS.map((m) => `${m}: ${s(m, 'p31')}`).join(' | '));
}
const order = jobs.map((j) => j.case);
rows.sort((a, b) => order.indexOf(a.case) - order.indexOf(b.case));
const gtRows = rows.filter((r) => r.case !== 'IMG_2433');
const keys = ['bgLeakPct', 'alphaMAE', 'veilPct', 'holesPct', 'edgeOnWhite', 'edgeOnBlack', 'fondGardePct', 'fondGardePx', 'fondGardeRegions', 'sujetPerduPct', 'sujetPerduPx'];
const means = { nGtCases: gtRows.length };
if (gtRows.length) for (const m of MODELS) for (const vn of Object.keys(variantsFor(m))) {
  means[`${m}/${vn}`] = Object.fromEntries(keys.map((k) => [k, +(gtRows.reduce((s, r) => s + r[m][vn][k], 0) / gtRows.length).toFixed(3)]));
}
for (const m of MODELS) means[`${m}/callMs`] = Math.round(rows.reduce((s, r) => s + r[m].callMs, 0) / rows.length);
fs.writeFileSync(OUT, JSON.stringify({
  made: new Date().toISOString(),
  uploadCopy: 'cote la plus longue 1024 px, JPEG 0.92 (resizeForUpload de la page) ; detourage a la pleine resolution de la photo avec app/lib/mattingRefine.js DEFAULTS (P31)',
  models: { isnet: 'IS-Net general-use + filtre plus grande composante (services/background-removal), local', bria: 'fal-ai/bria/background/remove (BRIA RMBG 2.0), alpha du PNG rendu', birefnet: 'fal-ai/birefnet/v2, model General Use (Light), 1024x1024, mask_only' },
  tablecloth: TABLECLOTH, means, cases: rows,
}, null, 1));
console.log(JSON.stringify(means, null, 1));

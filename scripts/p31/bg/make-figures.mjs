// P31 (03/10) — before/after figures for docs/audit/p31-bg/: for each bench case, the photo, the www cut-out (P21
// pipeline) and the P31 cut-out, side by side on a checkerboard, ≤ 1200 px wide; plus a 3× zoom on one edge.
// Usage: node scripts/p31/bg/make-figures.mjs [case,case,...]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { cutout } from './lib.mjs';
import { DEFAULTS } from '../../../app/lib/mattingRefine.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', '..');
const CASES = path.join(ROOT, 'docs', 'audit', 'detourage-p21', 'cases');
const OUT = path.join(ROOT, 'docs', 'audit', 'p31-bg');
const index = JSON.parse(fs.readFileSync(path.join(CASES, 'index.json'), 'utf8'));
const want = (process.argv[2] || 'cup__violet,china-cup__violet,teacup__violet,beer-mug__violet,cat-short__violet,helmet__field').split(',');
const P21 = { ...DEFAULTS, estimator: 'blur' };
const P31 = { ...DEFAULTS };

function checkerBuf(w, h, cell = 10) {
  const bg = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = ((x / cell | 0) + (y / cell | 0)) % 2 ? 204 : 255; bg.fill(v, (y * w + x) * 3, (y * w + x) * 3 + 3); }
  return sharp(bg, { raw: { width: w, height: h, channels: 3 } });
}
async function tile(rgbaOrFile, W, H, region, tw, th) {
  const src = typeof rgbaOrFile === 'string' ? sharp(rgbaOrFile) : sharp(Buffer.from(rgbaOrFile.buffer), { raw: { width: W, height: H, channels: 4 } });
  const fg = await src.extract(region).resize(tw, th, { kernel: region.width < tw / 2 ? 'nearest' : 'lanczos3' }).png().toBuffer();
  return checkerBuf(tw, th).composite([{ input: fg }]).png().toBuffer();
}

for (const c of index.filter((x) => want.includes(x.case))) {
  const d = path.join(CASES, c.case), W = c.width, H = c.height, photo = path.join(d, 'composite.jpg');
  const before = await cutout(photo, path.join(d, 'mask.png'), W, H, P21);
  const after = await cutout(photo, path.join(d, 'mask.png'), W, H, P31);
  // edge zoom: the topmost opaque row's left end (a rim or an ear), a 120 px square around it
  let zy = 0, zx = 0;
  outer: for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (after[(y * W + x) * 4 + 3] > 200) { zy = y; zx = x; break outer; }
  const s = 120, zr = { left: Math.max(0, Math.min(W - s, zx - s / 2)), top: Math.max(0, Math.min(H - s, zy - s / 3)), width: s, height: s };
  const full = { left: 0, top: 0, width: W, height: H };
  const tw = 392, th = Math.round(H * tw / W), zs = 392, gap = 4;
  const rows = [
    [await tile(photo, W, H, full, tw, th), await tile(before, W, H, full, tw, th), await tile(after, W, H, full, tw, th)],
    [await tile(photo, W, H, zr, zs, zs), await tile(before, W, H, zr, zs, zs), await tile(after, W, H, zr, zs, zs)],
  ];
  const tot = th + gap + zs;
  const comp = [];
  rows.forEach((r, ri) => r.forEach((t, i) => comp.push({ input: t, left: i * (tw + gap), top: ri ? th + gap : 0 })));
  await sharp({ create: { width: 3 * tw + 2 * gap, height: tot, channels: 3, background: '#333' } }).composite(comp).png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `${c.case}__photo-www-p31.png`));
  console.log(c.case, 'zoom at', zr.left, zr.top);
}

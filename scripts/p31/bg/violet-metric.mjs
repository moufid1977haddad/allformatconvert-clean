// P31 (03/10) — objective "violet left" measure on the owner's real photo (no ground truth exists for it).
// The tablecloth is a LIGHT blue-violet plastic; the mug has white, cream, brown and a DARK navy band. A pixel of the
// cut-out "carries the tablecloth" when its colour is light and clearly bluer than red and green
// (B − max(R, G) > 25 and luma > 120: the navy band is far darker, the white rim neutral). Reported, alpha-weighted:
//   violetPx  = Σ α · [violet colour]  (opaque-pixel equivalents showing the tablecloth's colour)
//   violetTop = the same within the top part (y < topFrac·H), where the rim, the wire and the leftover piece are.
// Usage: node scripts/p31/bg/violet-metric.mjs <cut1.png> [cut2.png ...]
import sharp from 'sharp';

const topFrac = 0.25;
for (const f of process.argv.slice(2)) {
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let v = 0, vt = 0, op = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3] / 255;
    op += a;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (b - Math.max(r, g) > 25 && luma > 120) { v += a; if (y < topFrac * H) vt += a; }
  }
  console.log(f.split(/[\\/]/).pop().padEnd(40), 'violetPx', v.toFixed(0).padStart(6), ' violetTop', vt.toFixed(0).padStart(6), ' opaquePx', op.toFixed(0));
}

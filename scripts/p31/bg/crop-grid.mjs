// P31 — side-by-side zoomed crops of several cut-outs on a checkerboard (visual check of the edge).
// Usage: node scripts/p31/bg/crop-grid.mjs <out.png> <left,top,width,height> <zoom> <cut1.png> [cut2.png ...]
import sharp from 'sharp';

const [out, box, zoomS, ...files] = process.argv.slice(2);
const [left, top, width, height] = box.split(',').map(Number);
const z = Number(zoomS) || 3;
const ow = width * z, oh = height * z, gap = 6;
const tiles = [];
for (const f of files) {
  const fg = await sharp(f).extract({ left, top, width, height }).resize(ow, oh, { kernel: 'nearest' }).png().toBuffer();
  const bg = Buffer.alloc(ow * oh * 3);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) { const v = ((x / 12 | 0) + (y / 12 | 0)) % 2 ? 204 : 255; bg.fill(v, (y * ow + x) * 3, (y * ow + x) * 3 + 3); }
  tiles.push(await sharp(bg, { raw: { width: ow, height: oh, channels: 3 } }).composite([{ input: fg }]).png().toBuffer());
}
const W = tiles.length * ow + (tiles.length - 1) * gap;
await sharp({ create: { width: W, height: oh, channels: 3, background: '#222' } })
  .composite(tiles.map((t, i) => ({ input: t, left: i * (ow + gap), top: 0 }))).png().toFile(out);

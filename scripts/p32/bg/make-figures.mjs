// P32 (04/10) — before/after figures of the model bench, on a checkerboard: for each case, the photo then the cut-out
// of each model after the page's refinement (cut_<model>_p31.png from bench.mjs), side by side, plus a 3x zoom row on
// the place where the models differ most (the window of largest alpha disagreement).
// The owner's photo IMG_2433: the public figure shows ONLY the three cut-outs (cup, coaster, tablecloth piece: no
// person, no room) and a 4x zoom of the top of the cup; the sheet with the photo itself goes to private/.
// Usage: node scripts/p32/bg/make-figures.mjs [case,case,...]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..', '..');
const CASES = path.join(ROOT, 'docs', 'audit', 'detourage-p21', 'cases');
const WORK = path.join(ROOT, 'docs', 'audit', 'p32-bg', 'private', 'work');
const OUT = path.join(ROOT, 'docs', 'audit', 'p32-bg');
const MODELS = ['isnet', 'bria', 'birefnet'];
const LABEL = { photo: 'photo', isnet: 'IS-Net (actuel) + P31', bria: 'BRIA RMBG 2.0 + P31', birefnet: 'BiRefNet v2 Light + P31' };
const want = (process.argv[2] || '').split(',').filter(Boolean);

function checkerBuf(w, h, cell = 10) {
  const bg = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = ((x / cell | 0) + (y / cell | 0)) % 2 ? 204 : 255; bg.fill(v, (y * w + x) * 3, (y * w + x) * 3 + 3); }
  return sharp(bg, { raw: { width: w, height: h, channels: 3 } });
}
async function tile(file, region, tw, th) {
  const fg = await sharp(file).ensureAlpha().extract(region).resize(tw, th, { kernel: region.width < tw / 2 ? 'nearest' : 'lanczos3' }).png().toBuffer();
  return checkerBuf(tw, th).composite([{ input: fg }]).png().toBuffer();
}
const label = (text, w) => Buffer.from(`<svg width="${w}" height="22" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#222"/><text x="6" y="16" font-family="Arial" font-size="14" fill="#fff">${text}</text></svg>`);

async function alphaOf(file) { const { data, info } = await sharp(file).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true }); return { a: data, w: info.width, h: info.height }; }

// the s x s window (step s/2) where the models' alphas disagree most
async function hotspot(files, s) {
  const al = await Promise.all(files.map(alphaOf));
  const { w, h } = al[0];
  let best = { v: -1, left: 0, top: 0 };
  for (let y = 0; y + s <= h; y += s / 2) for (let x = 0; x + s <= w; x += s / 2) {
    let v = 0;
    for (let yy = y; yy < y + s; yy += 2) for (let xx = x; xx < x + s; xx += 2) { const i = yy * w + xx; let mn = 255, mx = 0; for (const A of al) { mn = Math.min(mn, A.a[i]); mx = Math.max(mx, A.a[i]); } v += mx - mn; }
    if (v > best.v) best = { v, left: x, top: y };
  }
  return { left: best.left, top: best.top, width: s, height: s };
}

async function sheet(cols, files, region, zoom, out) {
  const { width: W, height: H } = await sharp(files[0]).metadata();
  const tw = Math.floor((1200 - (cols.length - 1) * 4) / cols.length), th = Math.round(region.height * tw / region.width);
  const gap = 4, comp = [];
  for (let i = 0; i < cols.length; i++) {
    const x = i * (tw + gap);
    comp.push({ input: label(LABEL[cols[i]] || cols[i], tw), left: x, top: 0 });
    comp.push({ input: await tile(files[i], region, tw, th), left: x, top: 22 });
    if (zoom) comp.push({ input: await tile(files[i], zoom, tw, tw), left: x, top: 22 + th + gap });
  }
  void W; void H;
  const total = 22 + th + (zoom ? gap + tw : 0);
  await sharp({ create: { width: cols.length * tw + (cols.length - 1) * gap, height: total, channels: 3, background: '#333' } }).composite(comp).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(out);
}

const index = JSON.parse(fs.readFileSync(path.join(CASES, 'index.json'), 'utf8'));
for (const c of index) {
  if (want.length && !want.includes(c.case)) continue;
  const cuts = MODELS.map((m) => path.join(WORK, c.case, `cut_${m}_p31.png`));
  const z = await hotspot(cuts, Math.round(Math.min(c.width, c.height) / 8 / 2) * 2);
  await sheet(['photo', ...MODELS], [path.join(CASES, c.case, 'composite.jpg'), ...cuts], { left: 0, top: 0, width: c.width, height: c.height }, z, path.join(OUT, `${c.case}__modeles-p32.png`));
  console.log(c.case, 'zoom', z.left, z.top, z.width);
}
if (!want.length || want.includes('IMG_2433')) {
  const d = path.join(WORK, 'IMG_2433');
  const cuts = MODELS.map((m) => path.join(d, `cut_${m}_p31.png`));
  // the cup + coaster only: the bounding box of what any model keeps opaque (no room, no person)
  let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0;
  for (const f of cuts) { const { a, w, h } = await alphaOf(f); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[y * w + x] >= 128) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } }
  const box = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const zoom = { left: 70, top: 50, width: 120, height: 120 };
  await sheet(MODELS, cuts, box, zoom, path.join(OUT, 'IMG_2433__decoupe-modeles-p32.png'));
  await sheet(['photo', ...MODELS], [path.join(d, 'photo.png'), ...cuts], box, zoom, path.join(d, 'IMG_2433__photo-modeles-p32.png'));
  console.log('IMG_2433 box', JSON.stringify(box));
}

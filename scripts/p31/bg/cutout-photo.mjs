// P31 (03/10) — cut-outs of one real photo (no ground truth) for each mask in <dir>: the page's pipeline, on a checkerboard.
// Usage: node scripts/p31/bg/cutout-photo.mjs <dir with upright.png and mask_*.png> [variants JSON {name: opts|"production"}] [mask filter regexp]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { cutout, checker } from './lib.mjs';
import { DEFAULTS } from '../../../app/lib/mattingRefine.js';

const dir = process.argv[2];
const variants = process.argv[3] ? JSON.parse(process.argv[3]) : { production: 'production', page: {} };
const filter = new RegExp(process.argv[4] || '.');
const photo = path.join(dir, 'upright.png');
const { width: W, height: H } = await sharp(photo).metadata();
for (const f of fs.readdirSync(dir).filter((x) => /^mask_.*\.png$/.test(x) && filter.test(x))) {
  const model = f.slice(5, -4);
  for (const [v, opts] of Object.entries(variants)) {
    const res = await cutout(photo, path.join(dir, f), W, H, opts === 'production' ? 'production' : { ...DEFAULTS, ...opts });
    await sharp(Buffer.from(res.buffer), { raw: { width: W, height: H, channels: 4 } }).png().toFile(path.join(dir, `cut_${model}_${v}.png`));
    await checker(res, W, H, path.join(dir, `checker_${model}_${v}.png`));
    console.log(model, v, res.workMs ? `${res.workMs.toFixed(0)} ms` : '');
  }
}

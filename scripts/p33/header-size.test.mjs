// P33 point 4 (05/10): the size read from a file's header (app/lib/fileChecks.js imageHeaderSize), now also for HEIC /
// AVIF ('ispe' boxes), and the one phone bound (app/lib/reduceImage.js): the owner's 48 MP photo (8064 × 6048) passes,
// the 63 MP panorama does not and is reduced to 12 220 × 3 927.
//   node scripts/p33/header-size.test.mjs        (kit: %TEMP%/p31-kit, or P31_KIT)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { imageHeaderSize } from '../../app/lib/fileChecks.js';
import { PHONE_MAX_MP, PHONE_MAX_PIXELS, overPhoneBound, reducedSize, PHONE_REDUCE_MP } from '../../app/lib/reduceImage.js';

const kit = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
const size = async (buf) => imageHeaderSize(new Blob([buf]));
let n = 0;
const ok = (name, cond, info = '') => { assert.ok(cond, `${name} ${info}`); n++; console.log('PASS', name); };

const photo48 = fs.readFileSync(path.join(kit, 'kit-iphone-p19', 'photo-48mpx.jpg'));
const s48 = await size(photo48);
ok(`48 MP photo JPEG header ${s48.width} × ${s48.height}`, s48.width * s48.height === 48771072);
ok('48 MP photo is not over the phone bound', !overPhoneBound(s48.width, s48.height));
ok('the bound is 48,771,072 pixels, said "48"', PHONE_MAX_PIXELS === 48771072 && PHONE_MAX_MP === 48);
ok('one pixel more is over the bound and reads as 49 MP', overPhoneBound(8065, 6048) && Math.round(8065 * 6048 / 1e6) === 49);
const heic = path.join(kit, 'kit-iphone-p19', 'photo-48mpx.heic');
if (fs.existsSync(heic)) {
  const sh = await size(fs.readFileSync(heic));
  ok(`48 MP photo HEIC header (ispe) ${sh && sh.width} × ${sh && sh.height}`, sh && sh.width * sh.height === 48771072 && !overPhoneBound(sh.width, sh.height), JSON.stringify(sh));
}
const pano = fs.readFileSync(path.join(kit, 'kit-iphone-p27', 'panorama-63mpx.jpg'));
const sp = await size(pano);
ok(`panorama ${sp.width} × ${sp.height} is over the bound`, overPhoneBound(sp.width, sp.height));
const r = reducedSize(sp.width, sp.height, PHONE_REDUCE_MP);
ok(`panorama reduced to ${r.width} × ${r.height}`, r.width === 12220 && r.height === 3927 && !overPhoneBound(r.width, r.height));
sharp.cache(false);
const avif = await sharp(pano).resize(3000).avif({ quality: 40, effort: 0 }).toBuffer();
const sa = await size(avif), ma = await sharp(avif).metadata();
ok(`AVIF header (ispe) ${sa && sa.width} × ${sa && sa.height}`, sa && sa.width === ma.width && sa.height === ma.height, JSON.stringify(sa));
const webp = await sharp(pano).resize(3000).webp({ quality: 50 }).toBuffer();
const sw = await size(webp);
ok(`WebP header ${sw.width} × ${sw.height}`, sw.width === 3000);
const mp4ish = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(100)]);
ok('an ftyp file without ispe has no size', (await size(mp4ish)) === null);
console.log(`ALL PASS: ${n} checks`);

// P24: metadata removal keeps the pixels byte for byte, the orientation and the colour profile, and removes GPS / camera
// data, on real JPEG, PNG and WebP files written by sharp (libvips). Usage: node scripts/p24/strip-metadata.test.mjs
import assert from 'node:assert/strict';
import sharp from 'sharp';
import exifr from 'exifr';
import { stripMetadata } from '../../app/lib/stripMetadata.js';
const f = (b, n) => new File([b], n);
const base = () => sharp({ create: { width: 64, height: 48, channels: 3, background: '#3a7' } });
const raw2 = () => ({ create: { width: 32, height: 24, channels: 3, background: '#a37' } });
const withGps = { exif: { IFD0: { Make: 'TestCam', Model: 'X1', Software: 'secret-sw' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '45/1 30/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '73/1 34/1 0/1' } } };

// JPEG: EXIF with GPS + orientation 6 + ICC profile (Display P3)
const jpg = await base().jpeg({ quality: 90 }).withMetadata({ orientation: 6, icc: 'p3' }).withExif(withGps.exif).toBuffer();
const before = await exifr.parse(jpg, { gps: true, icc: true });
assert.ok(before.latitude && before.Make === 'TestCam', 'fixture has GPS and camera');
const r = await stripMetadata(f(jpg, 'a.jpg'));
const out = Buffer.from(r.bytes);
const after = await exifr.parse(out, { gps: true, icc: true, tiff: true }).catch(() => ({}));
assert.equal(after?.latitude, undefined, 'GPS removed');
assert.equal(after?.Make, undefined, 'camera removed');
assert.equal((await sharp(out).metadata()).orientation, 6, 'orientation kept');
assert.ok((await sharp(out).metadata()).icc, 'colour profile kept');
const [p0, p1] = await Promise.all([sharp(jpg).raw().toBuffer(), sharp(out).raw().toBuffer()]);
assert.ok(p0.equals(p1), 'JPEG pixels identical');
assert.ok(r.removed.some((x) => /EXIF/.test(x)), r.removed.join());

// PNG: text chunks
const png = await base().png().withMetadata().withExif(withGps.exif).toBuffer();
const rp = await stripMetadata(f(png, 'a.png'));
const pOut = Buffer.from(rp.bytes);
assert.equal((await exifr.parse(pOut, { gps: true }).catch(() => null))?.latitude, undefined, 'PNG GPS removed');
assert.ok((await sharp(png).raw().toBuffer()).equals(await sharp(pOut).raw().toBuffer()), 'PNG pixels identical');

// WebP: EXIF chunk, flags fixed, RIFF size right
const webp = await base().webp({ quality: 80 }).withExif(withGps.exif).toBuffer();
const rw = await stripMetadata(f(webp, 'a.webp'));
const wOut = Buffer.from(rw.bytes);
assert.equal(wOut.readUInt32LE(4) + 8, wOut.length, 'RIFF size');
assert.equal((await exifr.parse(wOut, { gps: true }).catch(() => null))?.latitude, undefined, 'WebP GPS removed');
assert.ok((await sharp(webp).raw().toBuffer()).equals(await sharp(wOut).raw().toBuffer()), 'WebP pixels identical');

// review 03/10: a second picture after the main one (MPF / Motion Photo) carrying its own EXIF with GPS is cut
const second = await sharp(raw2()).jpeg().withExif(withGps.exif).toBuffer();
const mpo = Buffer.concat([jpg, second, Buffer.from('ftypMotionPhoto-trailer')]);
const rm = await stripMetadata(f(mpo, 'motion.jpg'));
const mOut = Buffer.from(rm.bytes);
assert.ok(!mOut.includes(Buffer.from('TestCam')) && !mOut.includes(Buffer.from('MotionPhoto')), 'nothing after the main picture');
assert.ok(rm.removed.some((x) => /after the picture/.test(x)), rm.removed.join());
assert.ok((await sharp(jpg).raw().toBuffer()).equals(await sharp(mOut).raw().toBuffer()), 'main picture identical');
// a progressive JPEG (several scans) stays identical
const prog = await base().jpeg({ progressive: true }).withExif(withGps.exif).toBuffer();
assert.ok((await sharp(prog).raw().toBuffer()).equals(await sharp(Buffer.from((await stripMetadata(f(prog, 'p.jpg'))).bytes)).raw().toBuffer()), 'progressive identical');
// PNG and WebP keep their orientation
const pngRot = await base().png().withMetadata({ orientation: 6 }).toBuffer();
const pr = Buffer.from((await stripMetadata(f(pngRot, 'r.png'))).bytes);
assert.equal((await exifr.orientation(pr)) || 1, (await exifr.orientation(pngRot)) || 1, 'PNG orientation kept');
const webpRot = await base().webp().withMetadata({ orientation: 6 }).withExif(withGps.exif).toBuffer();
const wr = Buffer.from((await stripMetadata(f(webpRot, 'r.webp'))).bytes);
assert.equal(wr.readUInt32LE(4) + 8, wr.length, 'RIFF size with the orientation chunk');
assert.equal((await sharp(wr).metadata()).orientation, 6, 'WebP orientation kept');
assert.equal((await exifr.parse(wr, { gps: true }).catch(() => null))?.latitude, undefined, 'WebP GPS still removed');

// other formats: a sentence
await assert.rejects(stripMetadata(f(await base().tiff().toBuffer(), 'a.tif')), /Image Converter/);
console.log('strip-metadata: all passed');

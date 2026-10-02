// P23 (02/10): the picture / video guards never refuse a good file (every real video container we have, the starts of
// the others, a .mts whose time code begins with "BM"), and say the right thing for empty / other-kind / damaged /
// giant files. Usage: node scripts/p23/media-checks.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import { videoFileProblem, unreadableVideoMessage, unreadableImageMessage, emptyImageProblem, imageHeaderSize } from '../../app/lib/fileChecks.js';
const f = (bytes, name) => new File([bytes], name);
const pad = (head, n = 1024) => Buffer.concat([Buffer.from(head), Buffer.alloc(Math.max(0, n - head.length), 0x11)]);
const dir = 'scripts/audit/fixtures/files/';

// ---- videos: real files and container starts are never refused, nor called damaged
const real = ['sample.mp4', 'sample.mov', 'sample.webm', 'sample.avi', 'sample-real.avi'].map((n) => [n, fs.readFileSync(dir + n)]);
const ts = Buffer.alloc(188 * 4, 0xff); for (let i = 0; i < 4; i++) ts[i * 188] = 0x47;
const mts = Buffer.alloc(192 * 4, 0xff); for (let i = 0; i < 4; i++) { mts.write('BM', i * 192, 'latin1'); mts[i * 192 + 4] = 0x47; } // time code starting "BM"
const mtsGz = Buffer.from(mts); mtsGz[0] = 0x1f; mtsGz[1] = 0x8b;
const starts = {
  'frag.mp4': pad([0, 0, 0, 24, ...Buffer.from('styp'), ...Buffer.from('msdh')]), 'moof.m4s': pad([0, 0, 0, 24, ...Buffer.from('moof')]),
  'old.mov': pad([0, 0, 0, 8, ...Buffer.from('wide')]), 'mdat.mov': pad([0, 0, 0, 8, ...Buffer.from('mdat')]), 'phone.3gp': pad([0, 0, 0, 20, ...Buffer.from('ftyp3gp4')]),
  'film.mkv': pad([0x1a, 0x45, 0xdf, 0xa3]), 'clip.ogv': pad([...Buffer.from('OggS')]), 'clip.flv': pad([...Buffer.from('FLV'), 1]),
  'clip.wmv': pad([0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66]), 'dvd.vob': pad([0, 0, 1, 0xba]), 'clip.mpg': pad([0, 0, 1, 0xb3]),
  'clip.ts': ts, 'cam.mts': mts, 'cam2.m2ts': mtsGz, 'clip.rm': pad([...Buffer.from('.RMF')]), 'clip.mxf': pad([0x06, 0x0e, 0x2b, 0x34]),
  'clip.ivf': pad([...Buffer.from('DKIF')]), 'clip.y4m': pad([...Buffer.from('YUV4MPEG2 W2')]), 'raw.h264': pad([0, 0, 0, 1, 0x67]),
  'unknown.mp4': pad([0x12, 0x34, 0x56, 0x78]), // an unknown start is left to the browser / ffmpeg
};
for (const [n, b] of [...real, ...Object.entries(starts)]) {
  assert.equal(await videoFileProblem(f(b, n)), null, `refused a good video: ${n}`);
  if (n !== 'unknown.mp4') assert.equal(await unreadableVideoMessage(f(b, n)), null, `called damaged: ${n}`);
}
// empty / other kind / random bytes
const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#08f' } }).png().toBuffer();
const jpg = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#08f' } }).jpeg().toBuffer();
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF');
const rand = Buffer.from(Array.from({ length: 512 }, (_, i) => (i * 2654435761 >>> 13) & 255));
assert.match(await videoFileProblem(f(Buffer.alloc(0), 'a.mp4')), /empty \(0 bytes\)/);
for (const [b, label] of [[png, 'PNG'], [jpg, 'JPEG'], [pdf, 'PDF']]) assert.match(await videoFileProblem(f(b, 'a.mp4')), new RegExp(`not a video: its content is ${label}`));
assert.equal(await videoFileProblem(f(rand, 'a.mp4')), null); // unknown: judged by the browser…
assert.match(await unreadableVideoMessage(f(rand, 'a.mp4')), /could not be read as a video: it may be damaged/); // …then told apart from a codec gap

// ---- pictures
assert.match(emptyImageProblem(f(Buffer.alloc(0), 'a.png')), /empty \(0 bytes\)/);
assert.equal(emptyImageProblem(f(png, 'a.png')), null);
assert.match(await unreadableImageMessage(f(pdf, 'a.png')), /not an image: its content is PDF/);
assert.match(await unreadableImageMessage(f(rand, 'a.png')), /could not be read: it may be damaged/);
const heic = pad([0, 0, 0, 24, ...Buffer.from('ftypheic')]);
assert.match(await unreadableImageMessage(f(heic, 'a.heic')), /HEIC to JPG/);
// sizes from the header, without decoding: PNG, GIF, JPEG (with EXIF before the frame), a 30 000 × 30 000 PNG
const exifJpg = await sharp({ create: { width: 4032, height: 3024, channels: 3, background: '#888' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
assert.deepEqual(await imageHeaderSize(f(exifJpg, 'p.jpg')), { width: 4032, height: 3024 });
const progJpg = await sharp({ create: { width: 640, height: 480, channels: 3, background: '#888' } }).jpeg({ progressive: true }).toBuffer();
assert.deepEqual(await imageHeaderSize(f(progJpg, 'p.jpg')), { width: 640, height: 480 });
assert.deepEqual(await imageHeaderSize(f(png, 'p.png')), { width: 8, height: 8 });
const gif = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#888' } }).gif().toBuffer();
assert.deepEqual(await imageHeaderSize(f(gif, 'p.gif')), { width: 300, height: 200 });
const ihdr = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0x75, 0x30, 0, 0, 0x75, 0x30, 8, 0, 0, 0, 0]);
assert.match(await unreadableImageMessage(f(ihdr, 'giant.png')), /30,000 × 30,000 pixels \(900 megapixels\): too large/);
assert.equal(await imageHeaderSize(f(rand, 'x.png')), null);

// ---- review 02/10 (independent reviewer): the cases it raised
{
  const { decodedText } = await import('../../app/lib/fileChecks.js');
  const tsv = 'SKU\tName\r\n12345678\tWidget é\r\n';
  const u16 = (le, bom) => { const b = Buffer.alloc(tsv.length * 2); for (let i = 0; i < tsv.length; i++) le ? b.writeUInt16LE(tsv.charCodeAt(i), i * 2) : b.writeUInt16BE(tsv.charCodeAt(i), i * 2); return bom ? Buffer.concat([Buffer.from(le ? [0xff, 0xfe] : [0xfe, 0xff]), b]) : b; };
  for (const [n, b] of [['u16le-bom', u16(true, true)], ['u16be-bom', u16(false, true)], ['u16le', u16(true, false)], ['utf8-bom', Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(tsv)])], ['utf8', Buffer.from(tsv)]])
    assert.equal(await decodedText(f(b, 'codes.txt')), tsv, `Barcode CSV import, ${n}`);
  assert.equal(await decodedText(f(Buffer.from(tsv, 'latin1'), 'codes.csv')), tsv); // ANSI (Windows-1252) export
  // raw Motion-JPEG from an IP camera is left to ffmpeg; a JPEG renamed .mp4 is still refused
  assert.equal(await videoFileProblem(f(jpg, 'cam.mjpeg')), null);
  assert.match(await videoFileProblem(f(jpg, 'cam.mp4')), /not a video/);
  // DV, TS with 204-byte packets, TS cut mid-packet: containers, never "damaged"
  const ts204 = Buffer.alloc(204 * 3, 0xff); for (let i = 0; i < 3; i++) ts204[i * 204] = 0x47;
  const tsCut = Buffer.concat([Buffer.alloc(57, 0xff), ts]);
  for (const [n, b] of [['a.dv', pad([0x1f, 0x07, 0x00, 0x3f])], ['dvb.ts', ts204], ['cut.ts', tsCut]]) assert.equal(await unreadableVideoMessage(f(b, n)), null, n);
  // .svgz (gzip) is not called "not an image"
  assert.match(await unreadableImageMessage(f(pad([0x1f, 0x8b, 8, 0]), 'logo.svgz')), /compressed SVG/);
  // sizes of WebP (lossy, lossless, extended), BMP, TIFF; a JPEG cut in the middle of its frame header does not throw
  for (const [opt, n] of [[{ lossless: false }, 'webp'], [{ lossless: true }, 'webp-ll']]) {
    const w = await sharp({ create: { width: 1234, height: 567, channels: 3, background: '#888' } }).webp(opt).toBuffer();
    assert.deepEqual(await imageHeaderSize(f(w, n)), { width: 1234, height: 567 }, n);
  }
  const wa = await sharp({ create: { width: 1234, height: 567, channels: 4, background: '#8888' } }).webp().toBuffer();
  assert.deepEqual(await imageHeaderSize(f(wa, 'alpha.webp')), { width: 1234, height: 567 });
  const tif = await sharp({ create: { width: 700, height: 300, channels: 3, background: '#888' } }).tiff().toBuffer();
  assert.deepEqual(await imageHeaderSize(f(tif, 'a.tif')), { width: 700, height: 300 });
  const bmp = Buffer.alloc(54); bmp.write('BM', 0, 'latin1'); bmp.writeUInt32LE(40, 14); bmp.writeInt32LE(800, 18); bmp.writeInt32LE(-600, 22);
  assert.deepEqual(await imageHeaderSize(f(bmp, 'a.bmp')), { width: 800, height: 600 });
  const sof = exifJpg.indexOf(Buffer.from([0xff, 0xc0]));
  for (let cut = sof; cut < sof + 10; cut++) await imageHeaderSize(f(exifJpg.subarray(0, cut), 'cut.jpg'));
}
console.log('media-checks: all passed');

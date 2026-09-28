// Builds fixtures/exif-gps.jpg: the 800x600 Safari test JPEG with an EXIF
// APP1 segment written by hand (IFD0 Make/Model + GPS IFD at 48.8584 N,
// 2.2945 E). Used by the Image Metadata Viewer browser test (29/09).
// Run: node scripts/converter-tests/fixtures/make-exif-jpeg.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const jpeg = readFileSync(join(dir, '../../../docs/audit/fixtures-safari/safari-small-800x600.jpg'));

// little-endian TIFF
const buf = Buffer.alloc(512);
let o = 0;
const u16 = (v) => { buf.writeUInt16LE(v, o); o += 2; };
const u32 = (v) => { buf.writeUInt32LE(v, o); o += 4; };
buf.write('II', 0); o = 2; u16(42); u32(8);
const make = 'OnlineConvertToolsCam\0', model = 'Test Model 1\0';
// IFD0 at 8: 3 entries
const ifd0 = 8, ifd0Size = 2 + 3 * 12 + 4;
const gpsIfd = ifd0 + ifd0Size, gpsSize = 2 + 4 * 12 + 4;
const dataStart = gpsIfd + gpsSize;
let data = dataStart;
const makeOff = data; data += make.length;
const modelOff = data; data += model.length;
const latOff = data; data += 24;
const lonOff = data; data += 24;
o = ifd0; u16(3);
u16(0x010f); u16(2); u32(make.length); u32(makeOff);
u16(0x0110); u16(2); u32(model.length); u32(modelOff);
u16(0x8825); u16(4); u32(1); u32(gpsIfd);
u32(0);
o = gpsIfd; u16(4);
u16(0x0001); u16(2); u32(2); buf.write('N\0', o); o += 4;
u16(0x0002); u16(5); u32(3); u32(latOff);
u16(0x0003); u16(2); u32(2); buf.write('E\0', o); o += 4;
u16(0x0004); u16(5); u32(3); u32(lonOff);
u32(0);
buf.write(make, makeOff, 'latin1'); buf.write(model, modelOff, 'latin1');
o = latOff; u32(48); u32(1); u32(51); u32(1); u32(3024); u32(100); // 48°51'30.24"
o = lonOff; u32(2); u32(1); u32(17); u32(1); u32(4020); u32(100);  // 2°17'40.20"
const tiff = buf.subarray(0, data);
const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), Buffer.from([(payload.length + 2) >> 8, (payload.length + 2) & 0xff]), payload]);
writeFileSync(join(dir, 'exif-gps.jpg'), Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]));
console.log('written', join(dir, 'exif-gps.jpg'));

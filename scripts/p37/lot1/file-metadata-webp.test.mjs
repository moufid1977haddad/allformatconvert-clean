// P37 lot 1 follow-up -- File Metadata and WebP files.
// exifr 7.1.3 has no WebP reader: exifr.parse throws "Unknown file format", File Metadata caught it as "no metadata"
// and said "No metadata found inside this file" for a WebP carrying a camera and a GPS position (its page even said
// "WebP photos are not read"). It now takes the EXIF, XMP and ICC chunks out with app/lib/webpMetadata.js, the module
// Image Metadata Viewer uses, and shows the same groups as for a JPEG.
// Runs the page's reader, readEmbedded(file, detectSignature(head)) of app/lib/embeddedMetadata.js, on:
//   - a WebP written by libvips (sharp) from scripts/converter-tests/fixtures/exif-gps.jpg, with EXIF + GPS, XMP, ICC;
//   - the same WebP cut short, and a WebP without metadata;
//   - the JPEG itself (regression: unchanged code path).
//   --legacy : the image reader as it was before (copied below: exifr.parse only)
//   default  : app/lib/embeddedMetadata.js as the page uses it now
//   node scripts/p37/lot1/file-metadata-webp.test.mjs [--legacy]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import './ext-hook.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const from = (p) => pathToFileURL(path.join(ROOT, p)).href;
const legacy = process.argv.includes('--legacy');
const { readEmbedded } = await import(from('app/lib/embeddedMetadata.js'));
const { detectSignature } = await import(from('app/lib/fileSignature.js'));

// ---- the image reader of embeddedMetadata.js before the fix (P24 code, unchanged since)
const clean = (v) => (v === undefined || v === null ? '' : String(v).replace(/\s+/g, ' ').trim());
const dateText = (d) => (d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().replace('.000Z', 'Z').replace('T', ' ') : clean(d));
const rows = (pairs) => pairs.map(([k, v]) => [k, v instanceof Date ? dateText(v) : clean(v)]).filter(([, v]) => v);
async function legacyImageGroups(file) {
  const exifr = (await import('exifr')).default;
  const t = await exifr.parse(file, { tiff: true, exif: true, gps: true, xmp: true, iptc: true, ifd1: false, translateValues: true, reviveValues: true }).catch(() => null);
  if (!t) return [];
  const out = [];
  const camera = rows([['Camera make', t.Make], ['Camera model', t.Model], ['Lens', t.LensModel], ['Taken', t.DateTimeOriginal || t.CreateDate],
    ['Exposure', t.ExposureTime ? (t.ExposureTime < 1 ? `1/${Math.round(1 / t.ExposureTime)} s` : `${t.ExposureTime} s`) : ''], ['Aperture', t.FNumber ? `f/${t.FNumber}` : ''],
    ['ISO', t.ISO], ['Focal length', t.FocalLength ? `${t.FocalLength} mm` : ''], ['Orientation', t.Orientation]]);
  if (camera.length) out.push(['Camera (EXIF)', camera]);
  const author = rows([['Software', t.Software || t.CreatorTool], ['Artist', t.Artist || t.creator], ['Copyright', t.Copyright || t.rights], ['Description', t.ImageDescription || t.description], ['Modified', t.ModifyDate]]);
  if (author.length) out.push(['Authoring', author]);
  if (Number.isFinite(t.latitude) && Number.isFinite(t.longitude)) out.push(['Location (GPS)', [['Latitude', t.latitude.toFixed(6)], ['Longitude', t.longitude.toFixed(6)], ...(Number.isFinite(t.GPSAltitude) ? [['Altitude', `${Math.round(t.GPSAltitude)} m`]] : [])]]);
  return out;
}
async function legacyReadEmbedded(file, sig) {
  if (!sig || !file.size) return [];
  try {
    if (/JPEG|PNG|WebP|TIFF|HEIC|AVIF/.test(sig.label)) return await legacyImageGroups(file);
  } catch { return [['Embedded metadata', [['Note', 'Could not be read: the file may be damaged or cut short.']]]]; }
  return [];
}

// What the page shows for these bytes. In the browser the page hands a File to exifr; exifr's Node build does not read
// a Blob, so the bytes are given as a Uint8Array carrying the File's `size` and `slice` (the WebP path reads the file
// with file.slice(a, b).arrayBuffer(); every slice it asks for is counted, to check it does not load the whole file).
let sliced = 0;
function asPageFile(buf) {
  const u = Uint8Array.from(buf);
  const blob = new Blob([u]);
  return Object.assign(u, { size: u.length, slice: (a, b) => { const s = blob.slice(a, b); sliced += s.size; return s; } });
}
async function readLikePage(buf) {
  const sig = detectSignature(new Uint8Array(buf.subarray(0, 0x8010)));
  return (legacy ? legacyReadEmbedded : readEmbedded)(asPageFile(buf), sig);
}
const group = (r, g) => r.find(([n]) => n === g)?.[1];
const row = (r, g, k) => group(r, g)?.find(([kk]) => kk === k)?.[1];
const summary = (r) => r.length ? r.map(([g, list]) => `${g}: ${list.map(([k, v]) => `${k}=${v}`).join(', ')}`).join(' | ') : 'nothing (page: "No metadata found inside this file")';

// ---- fixtures
const jpg = fs.readFileSync(path.join(ROOT, 'scripts/converter-tests/fixtures/exif-gps.jpg'));
const XMP = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/"><xmp:CreatorTool>P37Test</xmp:CreatorTool><dc:creator><rdf:Seq><rdf:li>Jane Doe</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>';
const webp = await sharp(jpg).keepExif().withXmp(XMP).withIccProfile('p3').webp().toBuffer();
const twinJpeg = await sharp(jpg).keepExif().withXmp(XMP).withIccProfile('p3').jpeg().toBuffer(); // same metadata, as a JPEG
const plainWebp = await sharp(jpg).webp().toBuffer();
const cutWebp = webp.subarray(0, webp.length - 100); // ends inside the last metadata chunk

let failed = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`); if (!ok) failed++; };
console.log(`mode: ${legacy ? 'BEFORE the fix (exifr.parse only)' : 'AFTER the fix (app/lib/embeddedMetadata.js + app/lib/webpMetadata.js)'}`);

// the JPEG read by the old code: the reference for the WebP made from it
const jpegBefore = await legacyReadEmbedded(asPageFile(jpg), detectSignature(new Uint8Array(jpg.subarray(0, 0x8010))));
const jr = await readLikePage(jpg);
check('JPEG with GPS (regression): same groups as before the fix', JSON.stringify(jr) === JSON.stringify(jpegBefore) && row(jr, 'Location (GPS)', 'Latitude') === '48.858400', summary(jr));

// the JPEG written by libvips with the same metadata (libvips adds an Orientation tag), read by the old code
const twinBefore = await legacyReadEmbedded(asPageFile(twinJpeg), detectSignature(new Uint8Array(twinJpeg.subarray(0, 0x8010))));
const wr = await readLikePage(webp);
const webpSliced = sliced;
check('WebP with EXIF + GPS: Location (GPS) shown, same as the source JPEG', JSON.stringify(group(wr, 'Location (GPS)')) === JSON.stringify(group(jpegBefore, 'Location (GPS)')) && row(wr, 'Location (GPS)', 'Longitude') === '2.294500', summary(wr));
check('WebP with EXIF: camera make and model of the source JPEG', row(wr, 'Camera (EXIF)', 'Camera make') === row(jpegBefore, 'Camera (EXIF)', 'Camera make') && row(wr, 'Camera (EXIF)', 'Camera model') === row(jpegBefore, 'Camera (EXIF)', 'Camera model'), `Camera make=${row(wr, 'Camera (EXIF)', 'Camera make')}`);
check('WebP with XMP: Authoring shows the XMP creator tool and author', row(wr, 'Authoring', 'Software') === 'P37Test' && row(wr, 'Authoring', 'Artist') === 'Jane Doe', `Authoring: ${JSON.stringify(group(wr, 'Authoring'))}`);
check('WebP: every group and row identical to a JPEG carrying the same metadata', JSON.stringify(wr) === JSON.stringify(twinBefore), `JPEG twin: ${summary(twinBefore)}`);

if (!legacy) {
  let image = 0; // bytes of the picture itself (VP8 / VP8L / ALPH chunk payloads)
  for (let i = 12; i + 8 <= webp.length;) { const t = webp.toString('latin1', i, i + 4), l = webp.readUInt32LE(i + 4); if (/^(VP8[ L]|ALPH)$/.test(t)) image += l; i += 8 + l + (l & 1); }
  check('WebP: the picture data is not read, only the RIFF header, chunk headers and metadata chunks', image > 0 && webpSliced <= webp.length - image + 8, `${webpSliced} of ${webp.length} bytes read; picture data ${image} bytes`);
}
const pr = await readLikePage(plainWebp);
check('WebP without metadata: nothing listed, no error note', pr.length === 0, summary(pr));
const cr = await readLikePage(cutWebp);
check('WebP cut short: the "damaged or cut short" note', /cut short/.test(row(cr, 'Embedded metadata', 'Note') || ''), summary(cr));

console.log(failed ? `\n${failed} FAILED` : '\nALL PASS');
process.exitCode = failed ? 1 : 0;

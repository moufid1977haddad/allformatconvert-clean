// P37 lot 1, bug 1 — Image Metadata Viewer and WebP files.
// Runs the page's reading logic (image-metadata/page.jsx, analyze()) on real WebP files carrying EXIF / GPS / XMP / ICC:
//   - one written by libvips (sharp 0.34) from a JPEG with GPS: EXIF chunk with an "Exif\0\0" header, XMP, ICCP;
//   - one built by hand from the JPEG's own APP1 segment: raw TIFF EXIF chunk (the spec's form), an odd-length XMP
//     chunk (padding byte) placed before the image data;
//   - a plain lossy WebP with no metadata, and a WebP cut short.
// Also checks a JPEG gives the same groups as before (regression) and that "Remove metadata" on a WebP really removes it.
//   node scripts/p37/lot1/image-metadata-webp.test.mjs            -> the page's logic after the fix
//   node scripts/p37/lot1/image-metadata-webp.test.mjs --legacy   -> the page's logic before the fix (exifr.parse only)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const from = (p) => pathToFileURL(path.join(ROOT, p)).href;
const exifrModule = await import(from('node_modules/exifr/dist/full.esm.mjs'));
const exifr = exifrModule.default;
const legacy = process.argv.includes('--legacy');
const webpLib = legacy ? null : await import(from('app/lib/webpMetadata.js'));
const { stripMetadata } = await import(from('app/lib/stripMetadata.js'));

const OPTIONS = { tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: true, interop: true, ifd1: false, mergeOutput: false, translateValues: true, reviveValues: true };
const fmt = (v) => { if (v instanceof Date) return v.toISOString().replace('.000Z', 'Z'); if (v instanceof Uint8Array || v instanceof ArrayBuffer) return `(${v.byteLength} bytes of binary data)`; if (Array.isArray(v)) return v.map(fmt).join(', '); if (v && typeof v === 'object') return JSON.stringify(v); return String(v); };
const asFile = (buf) => new Blob([buf]);

// analyze() of the page, minus React: returns { groups, error }
async function readLikePage(buf) {
  const file = asFile(buf);
  const all = async () => new Uint8Array(await file.arrayBuffer());
  try {
    let tags, webp = false;
    if (legacy) tags = await exifr.parse(await all(), OPTIONS);
    else {
      webp = webpLib.isWebp(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
      tags = webp ? await webpLib.parseWebpMetadata(exifrModule, await all(), OPTIONS) : await exifr.parse(await all(), OPTIONS);
    }
    const groups = [];
    for (const [group, values] of Object.entries(tags || {})) {
      if (!values || typeof values !== 'object') continue;
      const rows = Object.entries(values).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, fmt(v)]);
      if (rows.length) groups.push([group.toUpperCase(), rows]);
    }
    const gps = webp ? tags?.gps : await exifr.gps(await all()).catch(() => null);
    if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) groups.unshift(['LOCATION', [['Latitude', gps.latitude.toFixed(6)], ['Longitude', gps.longitude.toFixed(6)]]]);
    return { groups, error: '' };
  } catch (err) {
    const silent = /Unknown file format|invalid|not supported/i.test(err?.message || '');
    return { groups: [], error: silent ? '' : 'The embedded metadata could not be read: the file may be damaged or cut short.', raw: err?.message };
  }
}

const get = (r, g, k) => r.groups.find(([n]) => n === g)?.[1].find(([kk]) => kk === k)?.[1];
const summary = (r) => r.error ? `ERROR "${r.error}"` : r.groups.length ? r.groups.map(([g, rows]) => `${g}(${rows.length})`).join(' ') : `no metadata (page: "No embedded metadata ... found")${r.raw ? ' [exifr: ' + r.raw + ']' : ''}`;

// ---- fixtures
const jpg = fs.readFileSync(path.join(ROOT, 'scripts/converter-tests/fixtures/exif-gps.jpg'));
const XMP = '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/"><xmp:CreatorTool>P37Test</xmp:CreatorTool><dc:creator><rdf:Seq><rdf:li>Jane Doe</rdf:li></rdf:Seq></dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>';
const libvipsWebp = await sharp(jpg).keepExif().withXmp(XMP).withIccProfile('p3').webp().toBuffer();
const plainWebp = await sharp(jpg).webp().toBuffer(); // no metadata: simple "VP8 " file

function chunks(b) { const out = []; let i = 12; while (i + 8 <= b.length) { const t = b.toString('latin1', i, i + 4), l = b.readUInt32LE(i + 4); out.push([t, b.subarray(i + 8, i + 8 + l)]); i += 8 + l + (l & 1); } return out; }
function chunk(type, data) { const pad = data.length & 1, c = Buffer.alloc(8 + data.length + pad); c.write(type, 0, 'latin1'); c.writeUInt32LE(data.length, 4); Buffer.from(data).copy(c, 8); return c; }
function jpegExifTiff(b) { let i = 2; while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m === 0xe1 && b.toString('latin1', i + 4, i + 8) === 'Exif') return b.subarray(i + 10, i + 2 + len); i += 2 + len; } throw new Error('no EXIF in the JPEG'); }
const vp8 = chunks(plainWebp).find(([t]) => t === 'VP8 ')[1];
const w = vp8.readUInt16LE(6) & 0x3fff, h = vp8.readUInt16LE(8) & 0x3fff;
const vp8x = Buffer.alloc(10); vp8x[0] = 0x08 | 0x04; vp8x.writeUIntLE(w - 1, 4, 3); vp8x.writeUIntLE(h - 1, 7, 3);
let oddXmp = Buffer.from(XMP.replace('P37Test', 'P37Hand'));
if (!(oddXmp.length & 1)) oddXmp = Buffer.concat([oddXmp, Buffer.from(' ')]); // odd length -> a padding byte follows
const body = Buffer.concat([chunk('VP8X', vp8x), chunk('XMP ', oddXmp), chunk('VP8 ', vp8), chunk('EXIF', jpegExifTiff(jpg))]);
const head = Buffer.alloc(12); head.write('RIFF', 0, 'latin1'); head.writeUInt32LE(4 + body.length, 4); head.write('WEBP', 8, 'latin1');
const handWebp = Buffer.concat([head, body]);
const cutWebp = libvipsWebp.subarray(0, libvipsWebp.length - 100); // ends inside the XMP chunk
const outDir = path.join(ROOT, 'scripts/p37/lot1/out'); fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'gps-libvips.webp'), libvipsWebp); fs.writeFileSync(path.join(outDir, 'gps-hand.webp'), handWebp);
const meta = await sharp(handWebp).metadata(); // the hand-built file must still be a valid WebP picture

let failed = 0;
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`); if (!ok) failed++; };
console.log(`mode: ${legacy ? 'BEFORE the fix (exifr.parse only)' : 'AFTER the fix (app/lib/webpMetadata.js)'}`);
console.log(`chunks libvips: ${chunks(libvipsWebp).map(([t, d]) => `${t}:${d.length}`).join(' ')} | hand: ${chunks(handWebp).map(([t, d]) => `${t}:${d.length}`).join(' ')} (sharp reads it: ${meta.format} ${meta.width}x${meta.height})`);

const jr = await readLikePage(jpg);
check('JPEG with GPS (regression)', get(jr, 'LOCATION', 'Latitude') === '48.858400' && get(jr, 'IFD0', 'Make') === 'OnlineConvertToolsCam', summary(jr));

for (const [name, buf, creator] of [['WebP by libvips (Exif header, XMP, ICC)', libvipsWebp, 'P37Test'], ['WebP built by hand (raw TIFF, odd XMP before the image)', handWebp, 'P37Hand']]) {
  const r = await readLikePage(buf);
  check(`${name}: GPS shown first`, r.groups[0]?.[0] === 'LOCATION' && get(r, 'LOCATION', 'Latitude') === '48.858400' && get(r, 'LOCATION', 'Longitude') === '2.294500', summary(r));
  check(`${name}: camera make/model`, get(r, 'IFD0', 'Make') === 'OnlineConvertToolsCam' && get(r, 'IFD0', 'Model') === 'Test Model 1', `Make=${get(r, 'IFD0', 'Make')}`);
  check(`${name}: XMP`, get(r, 'XMP', 'CreatorTool') === creator && get(r, 'DC', 'creator') === 'Jane Doe', `CreatorTool=${get(r, 'XMP', 'CreatorTool')}`);
  if (buf === libvipsWebp) check(`${name}: ICC profile`, get(r, 'ICC', 'ColorSpaceData') === 'RGB', `ICC ColorSpaceData=${get(r, 'ICC', 'ColorSpaceData')}`);
  check(`${name}: GPS group equals the JPEG's`, JSON.stringify(r.groups.find(([g]) => g === 'GPS')) === JSON.stringify(jr.groups.find(([g]) => g === 'GPS')));
}
const pr = await readLikePage(plainWebp);
check('WebP without metadata: "none found", no error', pr.groups.length === 0 && !pr.error, summary(pr));
const cr = await readLikePage(cutWebp);
check('WebP cut short: the "damaged or cut short" message', cr.groups.length === 0 && /cut short/.test(cr.error), summary(cr));

// "Remove metadata" on the WebP (the button shows once groups are found): EXIF/GPS/XMP gone, ICC kept, picture readable
if (!legacy) {
  const st = await stripMetadata(asFile(libvipsWebp));
  const after = await readLikePage(Buffer.from(st.bytes));
  const m2 = await sharp(Buffer.from(st.bytes)).metadata();
  check('Remove metadata on the WebP: no GPS, camera or XMP left; ICC kept; still a valid picture',
    !after.groups.some(([g]) => ['LOCATION', 'GPS', 'XMP', 'DC'].includes(g)) && !get(after, 'IFD0', 'Make') && get(after, 'ICC', 'ColorSpaceData') === 'RGB' && m2.width === 800,
    `removed: ${st.removed.join(' + ')}; left: ${summary(after)}; ${m2.format} ${m2.width}x${m2.height}`);
}
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS');
process.exitCode = failed ? 1 : 0;

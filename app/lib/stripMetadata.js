// P24 (03/10): remove an image's metadata (camera, date, GPS position, software, comments, IPTC/XMP) WITHOUT re-encoding
// it — the pixels stay byte-for-byte the same, as exiftool -all= or jpegtran -copy none do (imgonline and iLoveIMG
// re-encode). Kept on purpose: the colour profile (ICC — an iPhone photo in Display P3 would change colour without it)
// and the orientation (a portrait photo would lie on its side): JPEG keeps a minimal EXIF with Orientation only.
// Formats: JPEG, PNG, WebP. Returns { bytes, removed: [labels] } or throws a sentence.

const u16be = (b, o) => (b[o] << 8) | b[o + 1];
const TRAILER = 'data after the picture (second pictures with their own EXIF / GPS, Motion Photo video, HDR gain map, maker trailer)';

function orientationOf(exif) { // exif: bytes after "Exif\0\0"
  if (exif.length < 8) return 1;
  const le = exif[0] === 0x49, r16 = (o) => (le ? exif[o] | (exif[o + 1] << 8) : (exif[o] << 8) | exif[o + 1]);
  const r32 = (o) => (le ? (exif[o] | (exif[o + 1] << 8) | (exif[o + 2] << 16) | (exif[o + 3] << 24)) >>> 0 : ((exif[o] << 24) | (exif[o + 1] << 16) | (exif[o + 2] << 8) | exif[o + 3]) >>> 0);
  const ifd = r32(4);
  if (ifd + 2 > exif.length) return 1;
  const n = r16(ifd);
  for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; if (e + 12 > exif.length) break; if (r16(e) === 0x0112) return r16(e + 8) || 1; }
  return 1;
}
// "Exif\0\0" + little-endian TIFF with one IFD entry: Orientation
function minimalExif(orientation) {
  const b = new Uint8Array(6 + 8 + 2 + 12 + 4);
  b.set([0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, orientation & 255, 0, 0, 0, 0, 0, 0, 0]);
  return b;
}

function stripJpeg(b) {
  const out = [b.subarray(0, 2)], removed = new Set();
  let i = 2, orientation = 1;
  while (i + 2 <= b.length) {
    if (b[i] !== 0xff) throw new Error('This JPEG is damaged (a marker is missing), so its metadata cannot be removed safely.');
    const m = b[i + 1];
    if (m === 0xd9) { out.push(b.subarray(i, i + 2)); if (i + 2 < b.length) removed.add(TRAILER); i = b.length; break; }
    if (m === 0xda) { // a scan: its header, then entropy-coded data up to the next real marker (FF00 and RSTn belong to it)
      const len = u16be(b, i + 2);
      let j = i + 2 + len;
      while (j + 1 < b.length && !(b[j] === 0xff && b[j + 1] !== 0x00 && !(b[j + 1] >= 0xd0 && b[j + 1] <= 0xd7) && b[j + 1] !== 0xff)) j++;
      out.push(b.subarray(i, j));
      i = j;
      continue;
    }
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { out.push(b.subarray(i, i + 2)); i += m === 0xff ? 1 : 2; continue; }
    if (i + 4 > b.length) throw new Error('This JPEG is cut short, so its metadata cannot be removed safely.');
    const len = u16be(b, i + 2), seg = b.subarray(i, i + 2 + len);
    if (i + 2 + len > b.length) throw new Error('This JPEG is cut short, so its metadata cannot be removed safely.');
    const id = String.fromCharCode(...seg.subarray(4, 4 + Math.min(14, len - 2)));
    if (m === 0xe1) { // APP1: EXIF or XMP
      if (id.startsWith('Exif')) { orientation = orientationOf(seg.subarray(10)); removed.add('EXIF (camera, date, GPS position…)'); }
      else removed.add('XMP');
    } else if (m === 0xed) removed.add('IPTC / Photoshop');
    else if (m === 0xfe) removed.add('comment');
    else if (m === 0xe2 && !id.startsWith('ICC_PROFILE')) removed.add(id.startsWith('MPF') ? 'multi-picture index (MPF)' : 'APP2 block (FlashPix…)'); // only the colour profile is kept
    else if (m >= 0xe3 && m <= 0xef && m !== 0xee) removed.add(`APP${m - 0xe0} block`); // vendor blocks (Ducky…); APP14 Adobe kept (colour transform)
    else if (m === 0xe0 && !id.startsWith('JFIF')) removed.add('APP0 block (thumbnail…)'); // JFXX thumbnails, others; JFIF kept
    else out.push(seg); // APP0 JFIF, APP2 ICC profile, APP14 Adobe, DQT, SOF, DHT, DRI, later scans of a progressive JPEG…: kept
    i += 2 + len;
  }
  if (orientation !== 1) {
    const ex = minimalExif(orientation), seg = new Uint8Array(4 + ex.length);
    seg.set([0xff, 0xe1, ((ex.length + 2) >> 8) & 255, (ex.length + 2) & 255]); seg.set(ex, 4);
    const jfif = out.length > 1 && out[1][1] === 0xe0 ? 2 : 1; // after the JFIF block when there is one
    out.splice(jfif, 0, seg);
  }
  return { parts: out, removed };
}

function stripPng(b) {
  const out = [b.subarray(0, 8)], removed = new Set();
  const DROP = { tEXt: 'text notes', zTXt: 'text notes', iTXt: 'text notes (XMP…)', eXIf: 'EXIF', exIf: 'EXIF', zxIf: 'EXIF', tIME: 'modification time' };
  let i = 8, orientation = 1;
  while (i + 12 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    const end = i + 12 + len;
    if (end > b.length) throw new Error('This PNG is cut short, so its metadata cannot be removed safely.');
    if (type === 'eXIf') orientation = orientationOf(b.subarray(i + 8, i + 8 + len));
    if (type === 'IEND' && orientation !== 1) out.push(pngChunk('eXIf', minimalExif(orientation).subarray(6)));
    if (DROP[type]) removed.add(DROP[type]); else out.push(b.subarray(i, end));
    i = end;
    if (type === 'IEND') break;
  }
  return { parts: out, removed };
}

function stripWebp(b) {
  const removed = new Set(), chunks = [];
  let i = 12, vp8x = null, orientation = 1;
  const riffEnd = Math.min(b.length, 8 + ((b[4] | (b[5] << 8) | (b[6] << 16) | (b[7] << 24)) >>> 0));
  while (i + 8 <= riffEnd) {
    const type = String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
    const len = (b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24)) >>> 0;
    const end = i + 8 + len + (len & 1);
    if (i + 8 + len > b.length) throw new Error('This WebP is cut short, so its metadata cannot be removed safely.');
    if (type === 'EXIF') { removed.add('EXIF (camera, date, GPS position…)'); const ex = b.subarray(i + 8, i + 8 + len); orientation = orientationOf(ex[0] === 0x45 ? ex.subarray(6) : ex); }
    else if (type === 'XMP ') removed.add('XMP');
    else { const c = b.slice(i, Math.min(end, b.length)); if (type === 'VP8X') vp8x = c; chunks.push(c); }
    i = end;
  }
  if (vp8x) vp8x[8] &= ~(0x08 | 0x04); // VP8X flags: no EXIF, no XMP any more
  if (vp8x && orientation !== 1) { // the orientation kept as a minimal EXIF chunk, at the end (its place in the spec)
    const ex = minimalExif(orientation).subarray(6), c = new Uint8Array(8 + ex.length + (ex.length & 1));
    c.set([0x45, 0x58, 0x49, 0x46, ex.length & 255, (ex.length >> 8) & 255, 0, 0]); c.set(ex, 8); chunks.push(c); vp8x[8] |= 0x08;
  }
  const size = 4 + chunks.reduce((n, c) => n + c.length, 0);
  const head = new Uint8Array(12); head.set(b.subarray(0, 12));
  head[4] = size & 255; head[5] = (size >> 8) & 255; head[6] = (size >> 16) & 255; head[7] = (size >>> 24) & 255;
  return { parts: [head, ...chunks], removed };
}

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function pngChunk(type, data) {
  const t = new TextEncoder().encode(type), out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length); out.set(t, 4); out.set(data, 8);
  let c = 0xffffffff; for (const x of [...t, ...data]) c = CRC[(c ^ x) & 255] ^ (c >>> 8);
  dv.setUint32(8 + data.length, (c ^ 0xffffffff) >>> 0);
  return out;
}

export async function stripMetadata(file) {
  const b = new Uint8Array(await file.arrayBuffer());
  let r;
  if (b[0] === 0xff && b[1] === 0xd8) r = stripJpeg(b);
  else if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) r = stripPng(b);
  else if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) r = stripWebp(b);
  else throw new Error('Metadata can be removed here from JPG, PNG and WebP images. For HEIC, TIFF or another format, convert it to JPG with our Image Converter: the copy holds no camera or GPS data.');
  const bytes = new Uint8Array(r.parts.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of r.parts) { bytes.set(p, o); o += p.length; }
  return { bytes, removed: [...r.removed] };
}

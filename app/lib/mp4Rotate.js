// Lossless, instant rotation of an MP4 / MOV / M4V / 3GP video (30/09, owner's iPhone).
//
// A phone does not turn the pixels of a portrait video either: it stores them as filmed and writes a rotation
// matrix in the video track's header ("tkhd" box, ISO/IEC 14496-12 §8.3.2), which Photos, Safari, Chrome, Firefox,
// VLC and every editor apply when showing it. So does `ffmpeg -display_rotation ... -c copy` and MP4Box
// "-rotate": no re-encoding, no quality loss, same size, any length. Here the 36-byte matrix is rewritten in place:
// only the "moov" box (the index, usually well under 1 MB) is read into memory; the rest of the file is passed
// through as slices of the original File, never copied. Matrices written as FFmpeg's MP4 muxer writes them.
// Returns null when the file is not ISO-BMFF or its matrix is not a plain rotation (mirrored, scaled): the caller
// then re-encodes on the service.

const MAX_MOOV = 256 * 1024 * 1024;
const u32 = (dv, o) => dv.getUint32(o);
const type = (dv, o) => String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));

async function readAt(file, start, len) { return new DataView(await file.slice(start, start + len).arrayBuffer()); }

// Top-level boxes of the file, without reading their contents.
async function topBoxes(file) {
  const boxes = [];
  let off = 0;
  while (off + 8 <= file.size && boxes.length < 10000) {
    const h = await readAt(file, off, 16);
    let size = u32(h, 0), head = 8;
    const t = type(h, 4);
    if (!/^[\x20-\x7e]{4}$/.test(t)) return null;
    if (size === 1) { size = Number(h.getBigUint64(8)); head = 16; } else if (size === 0) size = file.size - off;
    if (size < head || off + size > file.size) return null;
    boxes.push({ type: t, start: off, size, head });
    off += size;
  }
  return boxes;
}

// Child boxes inside [start, end) of a DataView.
function children(dv, start, end) {
  const out = [];
  let off = start;
  while (off + 8 <= end) {
    let size = u32(dv, off), head = 8;
    if (size === 1) { size = Number(dv.getBigUint64(off + 8)); head = 16; } else if (size === 0) size = end - off;
    if (size < head || off + size > end) break;
    out.push({ type: type(dv, off + 4), start: off, size, head });
    off += size;
  }
  return out;
}

const ONE = 0x10000; // 16.16
function readRotation(dv, m) { // m = offset of the matrix
  const a = dv.getInt32(m), b = dv.getInt32(m + 4), c = dv.getInt32(m + 12), d = dv.getInt32(m + 16);
  if (a === ONE && b === 0 && c === 0 && d === ONE) return 0;
  if (a === 0 && b === ONE && c === -ONE && d === 0) return 90;
  if (a === -ONE && b === 0 && c === 0 && d === -ONE) return 180;
  if (a === 0 && b === -ONE && c === ONE && d === 0) return 270;
  return null; // mirrored or scaled: not a plain rotation
}
function writeMatrix(dv, m, deg, w, h) {
  const [a, b, c, d, tx, ty] = deg === 90 ? [0, 1, -1, 0, h, 0] : deg === 180 ? [-1, 0, 0, -1, w, h] : deg === 270 ? [0, -1, 1, 0, 0, w] : [1, 0, 0, 1, 0, 0];
  const vals = [a * ONE, b * ONE, 0, c * ONE, d * ONE, 0, tx * ONE, ty * ONE, 0x40000000];
  vals.forEach((v, i) => dv.setInt32(m + i * 4, v | 0));
}

/**
 * @param {File|Blob} file
 * @param {90|180|270} turn clockwise
 * @returns {Promise<null | { blob: Blob, before: number, after: number, tracks: number }>}
 */
export async function rotateIsoBmff(file, turn) {
  const boxes = await topBoxes(file);
  if (!boxes || !boxes.length || !['ftyp', 'moov', 'wide', 'mdat', 'free', 'skip'].includes(boxes[0].type)) return null;
  const moov = boxes.find((b) => b.type === 'moov');
  if (!moov || moov.size > MAX_MOOV) return null;
  const buf = await file.slice(moov.start, moov.start + moov.size).arrayBuffer();
  const dv = new DataView(buf);
  let tracks = 0, before = null, after = null;
  for (const trak of children(dv, moov.head, moov.size).filter((b) => b.type === 'trak')) {
    const kids = children(dv, trak.start + trak.head, trak.start + trak.size);
    const tkhd = kids.find((b) => b.type === 'tkhd');
    const mdia = kids.find((b) => b.type === 'mdia');
    if (!tkhd || !mdia) continue;
    const hdlr = children(dv, mdia.start + mdia.head, mdia.start + mdia.size).find((b) => b.type === 'hdlr');
    if (!hdlr || type(dv, hdlr.start + hdlr.head + 8) !== 'vide') continue; // version/flags(4) pre_defined(4) handler_type
    const p = tkhd.start + tkhd.head, version = dv.getUint8(p);
    const m = p + 4 + (version === 1 ? 32 : 20) + 16; // times/ids/duration, then reserved, layer, group, volume
    if (m + 36 + 8 > tkhd.start + tkhd.size) return null;
    const cur = readRotation(dv, m);
    if (cur === null) return null;
    const w = dv.getUint32(m + 36) >>> 16, h = dv.getUint32(m + 40) >>> 16;
    const next = (cur + turn) % 360;
    writeMatrix(dv, m, next, w, h);
    tracks++; before = cur; after = next;
  }
  if (!tracks) return null;
  const blob = new Blob([file.slice(0, moov.start), buf, file.slice(moov.start + moov.size)], { type: file.type || 'video/mp4' });
  if (blob.size !== file.size) return null;
  return { blob, before, after, tracks };
}

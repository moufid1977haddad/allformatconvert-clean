// P24 (03/10): every image inside an .ico / .cur file (ezgif and Convertio give each size). A browser shows only the
// largest one (checked in Chromium, Firefox and WebKit). Each directory entry is read here; a PNG entry is handed over
// as it is (the same bytes), a BMP entry is put alone in a one-image .ico that the browser decodes — no hand-written
// DIB decoder (1/4/8/24/32-bit, AND masks) to get wrong.
export function icoEntries(bytes) {
  const b = bytes;
  const u16 = (o) => b[o] | (b[o + 1] << 8);
  const u32 = (o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  if (b.length < 6 || u16(0) !== 0 || (u16(2) !== 1 && u16(2) !== 2)) throw new Error('This is not an ICO file (its header is not an icon directory).');
  const type = u16(2), count = u16(4);
  if (!count) throw new Error('This icon file holds no image.');
  const out = [];
  for (let k = 0; k < count; k++) {
    const e = 6 + 16 * k;
    if (e + 16 > b.length) break;
    const size = u32(e + 8), offset = u32(e + 12);
    if (!size || offset + size > b.length) continue; // an entry pointing outside the file: skipped, said by the count
    const data = b.subarray(offset, offset + size);
    const png = data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
    // the directory says 0 for 256; a PNG entry's own header is the truth for its size
    let width = b[e] || 256, height = b[e + 1] || 256;
    if (png && data.length > 24) { width = (data[16] << 24 | data[17] << 16 | data[18] << 8 | data[19]) >>> 0; height = (data[20] << 24 | data[21] << 16 | data[22] << 8 | data[23]) >>> 0; }
    const bitCount = type === 1 ? u16(e + 6) : 0;
    out.push({ index: k, width, height, bitCount, png, data, dirEntry: b.subarray(e, e + 16), type });
  }
  return { entries: out, count };
}

// The entry alone in a .ico (header + one directory entry + its data), for the browser to decode
export function singleEntryIco(entry) {
  const head = new Uint8Array(22);
  head[2] = entry.type; head[4] = 1;
  head.set(entry.dirEntry, 6);
  const off = 22;
  head[18] = off & 255; head[19] = (off >> 8) & 255; head[20] = (off >> 16) & 255; head[21] = (off >>> 24) & 255;
  return new Blob([head, entry.data], { type: 'image/x-icon' });
}

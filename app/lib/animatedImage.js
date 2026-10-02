// P24 (03/10): is this image animated? The canvas filters draw the first frame only, and said nothing.
// Parsed by structure, not by searching bytes (a 0x21 0xF9 pair can occur inside compressed data):
// GIF — counts image descriptors walking the blocks; PNG — an acTL chunk before IDAT with 2 frames or more
// (APNG); WebP — the VP8X animation flag. Returns 'GIF' | 'APNG' | 'WebP' | null.
// GIF: { frames (stops counting at 2), complete } — complete is false when the bytes end before the trailer (a prefix)
export function gifFrameCount(b) {
  let p = 13;
  if (b[10] & 0x80) p += 3 * (1 << ((b[10] & 7) + 1));
  let frames = 0;
  const skipSubBlocks = () => { while (p < b.length) { const n = b[p++]; if (!n) return true; p += n; } return false; };
  while (p < b.length) {
    const t = b[p++];
    if (t === 0x2c) {
      if (++frames > 1) return { frames, complete: true };
      if (p + 9 > b.length) return { frames, complete: false };
      const flags = b[p + 8]; p += 9;
      if (flags & 0x80) p += 3 * (1 << ((flags & 7) + 1));
      p++; if (!skipSubBlocks()) return { frames, complete: false };
    } else if (t === 0x21) { p++; if (!skipSubBlocks()) return { frames, complete: false }; }
    else return { frames, complete: true }; // 0x3b trailer, or damaged data
  }
  return { frames, complete: false };
}

export function animationKind(bytes) {
  const b = bytes;
  if (b.length > 13 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return gifFrameCount(b).frames > 1 ? 'GIF' : null;
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    let p = 8;
    while (p + 8 <= b.length) {
      const len = ((b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0;
      const type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]);
      if (type === 'acTL') { const n = ((b[p + 8] << 24) | (b[p + 9] << 16) | (b[p + 10] << 8) | b[p + 11]) >>> 0; return n > 1 ? 'APNG' : null; }
      if (type === 'IDAT' || type === 'IEND') return null;
      p += 12 + len;
    }
    return null;
  }
  if (b.length > 21 && String.fromCharCode(b[0], b[1], b[2], b[3]) === 'RIFF' && String.fromCharCode(b[8], b[9], b[10], b[11]) === 'WEBP'
    && String.fromCharCode(b[12], b[13], b[14], b[15]) === 'VP8X') return (b[20] & 0x02) ? 'WebP' : null;
  return null;
}

export async function animationOf(file) {
  if (!file || !/gif|png|webp/i.test(file.type + ' ' + file.name)) return null;
  // the PNG / WebP marks sit near the start; a GIF's 2nd frame comes after the whole 1st one: 2 MB first, the whole file
  // only when the first frame runs past that (P24: a large GIF was read whole just to count its frames)
  const head = new Uint8Array(await file.slice(0, 2 << 20).arrayBuffer());
  if (!(head.length > 13 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46)) return animationKind(head);
  const first = gifFrameCount(head);
  if (first.frames > 1) return 'GIF';
  if (first.complete || file.size <= head.length) return null;
  return gifFrameCount(new Uint8Array(await file.arrayBuffer())).frames > 1 ? 'GIF' : null;
}

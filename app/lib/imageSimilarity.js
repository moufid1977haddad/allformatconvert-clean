// Duplicate Image Finder (audit 2, 29/09).
// Before: only byte-identical files were found (a resized or re-saved copy of the same photo was missed, while
// duplicate-photo tools find them), and "No duplicates found!" was shown as soon as images were loaded, before any
// search. Now: exact copies by SHA-256, and visually identical images by a difference hash (dHash, as the imagehash
// library and Neal Krawetz's "Kind of Like That"): 9x8 grayscale thumbnail, one bit per horizontal gradient, two images
// are "the same picture" when at most 6 of the 64 bits differ.

export async function sha256Hex(buffer) {
  const h = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, '0')).join('');
}

// 64-bit dHash as a BigInt, from anything drawImage accepts.
export function dHash(source) {
  const c = document.createElement('canvas');
  c.width = 9; c.height = 8;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  x.fillStyle = '#fff'; x.fillRect(0, 0, 9, 8); // transparent areas count as white
  x.drawImage(source, 0, 0, 9, 8);
  const d = x.getImageData(0, 0, 9, 8).data;
  const lum = (px, py) => { const i = (py * 9 + px) * 4; return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; };
  let h = 0n;
  for (let y = 0; y < 8; y++) for (let xx = 0; xx < 8; xx++) h = (h << 1n) | (lum(xx, y) > lum(xx + 1, y) ? 1n : 0n);
  return h;
}

export function hamming(a, b) {
  let v = a ^ b, n = 0;
  while (v) { n += Number(v & 1n); v >>= 1n; }
  return n;
}

export const SIMILAR_MAX_BITS = 6;

// items: [{ name, sha, hash }] -> [{ kind: 'exact'|'similar', a, b, bits }]
export function findPairs(items, maxBits = SIMILAR_MAX_BITS) {
  const out = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i], B = items[j];
      if (A.sha === B.sha) { out.push({ kind: 'exact', a: A.name, b: B.name, bits: 0 }); continue; }
      if (A.hash == null || B.hash == null) continue;
      const bits = hamming(A.hash, B.hash);
      if (bits <= maxBits) out.push({ kind: 'similar', a: A.name, b: B.name, bits });
    }
  }
  return out;
}

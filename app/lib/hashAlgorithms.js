// Algorithms offered by the Hash Generator. The reference (html-code-generator.com's file hash
// generator, read 2026-09-24) offers MD5, SHA-1, SHA-256/384/512, SHA3-256, BLAKE3, CRC32 and xxHash64,
// through the same means used here: Web Crypto for SHA-1/2 on files it can hold in memory, hash-wasm
// (MIT) streamed chunk by chunk for everything else (docs/audit/RAPPORT-licence-et-ameliorations.md §5).
// `subtle`: the Web Crypto name, when the browser has it natively (5-40x faster than WebAssembly, measured).
// `hmac`: a keyed HMAC makes sense for this algorithm (not for checksums like CRC or xxHash).
export const HASH_ALGORITHMS = [
  { id: 'md5', label: 'MD5', bits: 128, hmac: true, group: 'Common' },
  { id: 'sha1', label: 'SHA-1', bits: 160, hmac: true, subtle: 'SHA-1', group: 'Common' },
  { id: 'sha256', label: 'SHA-256', bits: 256, hmac: true, subtle: 'SHA-256', group: 'Common' },
  { id: 'sha512', label: 'SHA-512', bits: 512, hmac: true, subtle: 'SHA-512', group: 'Common' },
  { id: 'sha224', label: 'SHA-224', bits: 224, hmac: true, group: 'SHA-2 and SHA-3' },
  { id: 'sha384', label: 'SHA-384', bits: 384, hmac: true, subtle: 'SHA-384', group: 'SHA-2 and SHA-3' },
  { id: 'sha3_256', label: 'SHA3-256', bits: 256, hmac: true, group: 'SHA-2 and SHA-3' },
  { id: 'sha3_512', label: 'SHA3-512', bits: 512, hmac: true, group: 'SHA-2 and SHA-3' },
  { id: 'keccak256', label: 'Keccak-256 (Ethereum)', bits: 256, hmac: false, group: 'SHA-2 and SHA-3' },
  { id: 'blake2b', label: 'BLAKE2b-512', bits: 512, hmac: true, group: 'Other' },
  { id: 'blake3', label: 'BLAKE3', bits: 256, hmac: false, group: 'Other' },
  { id: 'ripemd160', label: 'RIPEMD-160', bits: 160, hmac: true, group: 'Other' },
  { id: 'crc32', label: 'CRC32', bits: 32, hmac: false, group: 'Checksums' },
  { id: 'crc32c', label: 'CRC32C', bits: 32, hmac: false, group: 'Checksums' },
  { id: 'xxh64', label: 'xxHash64', bits: 64, hmac: false, group: 'Checksums' },
  { id: 'xxh3', label: 'XXH3-64', bits: 64, hmac: false, group: 'Checksums' },
  { id: 'xxh128', label: 'XXH128', bits: 128, hmac: false, group: 'Checksums' },
];
export const DEFAULT_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512', 'crc32'];
export const byId = Object.fromEntries(HASH_ALGORITHMS.map((a) => [a.id, a]));

// Name used by `sha256sum --tag` / BSD `shasum` lines, which GNU `sha256sum -c` also checks.
export const TAG_NAME = { md5: 'MD5', sha1: 'SHA1', sha224: 'SHA224', sha256: 'SHA256', sha384: 'SHA384', sha512: 'SHA512', sha3_256: 'SHA3-256', sha3_512: 'SHA3-512', keccak256: 'KECCAK-256', blake2b: 'BLAKE2b', blake3: 'BLAKE3', ripemd160: 'RIPEMD160', crc32: 'CRC32', crc32c: 'CRC32C', xxh64: 'XXH64', xxh3: 'XXH3', xxh128: 'XXH128' };

export const toHex = (bytes, upper = false) => { let s = ''; for (const b of bytes) s += b.toString(16).padStart(2, '0'); return upper ? s.toUpperCase() : s; };
export const toBase64 = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };

// An expected hash as typed: hex (any case, spaces and colons allowed) or base64. Returns bytes or null.
export function parseExpected(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  const hex = t.replace(/[\s:]/g, '');
  if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) return Uint8Array.from(hex.match(/../g), (h) => parseInt(h, 16));
  if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(t)) {
    try { const bin = atob(t.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); } catch { return null; }
  }
  return null;
}
export const sameBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
// Which algorithms produce a digest of this many bytes (for "this looks like a SHA-256" hints).
export const algorithmsOfLength = (n) => HASH_ALGORITHMS.filter((a) => a.bits / 8 === n).map((a) => a.label);

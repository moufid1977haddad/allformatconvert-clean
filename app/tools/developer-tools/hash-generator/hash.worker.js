// Hashes one Blob (a file, or typed text as UTF-8) with every selected algorithm, reading it once.
// Same means as the reference (html-code-generator.com, read 2026-09-24): Web Crypto for SHA-1/2 on data
// it can hold in memory -- native, 5-40x faster than WebAssembly (measured in Chromium and Firefox) -- and
// hash-wasm fed 8 MiB at a time for the rest, or for everything past the in-memory ceiling (700 MiB, 100 MB
// on phones; set by the page), so there is no file size limit (5 GiB measured). Unlike the reference, the file is read into ONE buffer (it copies its chunks into a
// second one, doubling the peak), and a failed allocation falls back to streaming instead of an error.
import { createMD5, createSHA1, createSHA224, createSHA256, createSHA384, createSHA512, createSHA3, createKeccak, createBLAKE2b, createBLAKE3, createRIPEMD160, createCRC32, createXXHash64, createXXHash3, createXXHash128, createHMAC } from 'hash-wasm';
import { byId } from '../../../lib/hashAlgorithms';

const CHUNK = 8 * 1024 * 1024;

const MAKE = {
  md5: createMD5, sha1: createSHA1, sha224: createSHA224, sha256: createSHA256, sha384: createSHA384, sha512: createSHA512,
  sha3_256: () => createSHA3(256), sha3_512: () => createSHA3(512), keccak256: () => createKeccak(256),
  blake2b: () => createBLAKE2b(512), blake3: () => createBLAKE3(256), ripemd160: createRIPEMD160,
  crc32: () => createCRC32(), crc32c: () => createCRC32(0x82f63b78), // CRC-32C: Castagnoli, reflected
  xxh64: () => createXXHash64(), xxh3: () => createXXHash3(), xxh128: () => createXXHash128(),
};

async function subtleDigest(name, bytes, key) {
  if (!key) return new Uint8Array(await crypto.subtle.digest(name, bytes));
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: name }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, bytes));
}

self.onmessage = async ({ data: { blob, algorithms, hmacKey, inMemoryMax } }) => {
  try {
    const key = hmacKey ? new TextEncoder().encode(hmacKey) : null;
    const size = blob.size;
    const hasSubtle = typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function';
    let viaSubtle = hasSubtle && size <= inMemoryMax ? algorithms.filter((id) => byId[id].subtle) : [];
    let whole = null;
    if (viaSubtle.length) {
      try { whole = new Uint8Array(await blob.arrayBuffer()); } catch { whole = null; viaSubtle = []; } // not enough memory: stream
    }
    const streamed = algorithms.filter((id) => !viaSubtle.includes(id));
    const hashers = await Promise.all(streamed.map((id) => (key && byId[id].hmac ? createHMAC(MAKE[id](), key) : MAKE[id]())));
    hashers.forEach((h) => h.init());
    let done = 0;
    // The next piece is read while the current one is hashed (reading alone costs ~2 s per 760 MiB, measured).
    const read = (off) => (whole ? Promise.resolve(whole.subarray(off, off + CHUNK)) : blob.slice(off, off + CHUNK).arrayBuffer().then((b) => new Uint8Array(b)));
    if (hashers.length) {
      let next = read(0);
      for (let off = 0; off < size || (size === 0 && off === 0); off += CHUNK) {
        const part = await next;
        if (off + CHUNK < size) next = read(off + CHUNK);
        if (size > 0 && part.length === 0) throw new Error('The file could not be read (it may have been moved or changed while hashing).');
        for (const h of hashers) h.update(part);
        done = Math.min(size, off + part.length);
        self.postMessage({ type: 'progress', done, size });
        if (size === 0) break;
      }
    }
    const results = {};
    streamed.forEach((id, i) => { results[id] = hashers[i].digest('binary'); });
    for (const id of viaSubtle) results[id] = await subtleDigest(byId[id].subtle, whole, key && byId[id].hmac ? key : null);
    self.postMessage({ type: 'done', results, streamedAll: viaSubtle.length === 0 });
  } catch (e) {
    self.postMessage({ type: 'error', message: e?.message || String(e) });
  }
};

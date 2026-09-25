# Independent reference digests for the Hash Generator test: hashlib (OpenSSL) for MD5/SHA/BLAKE2b/RIPEMD-160,
# and the reference C implementations' Python bindings for the rest (pip: blake3 xxhash crc32c pycryptodome).
# Usage: python hash-reference.py <file> [hmac-key]  -> JSON {algorithm id: hex}
import hashlib, hmac, json, sys, zlib
import blake3, crc32c, xxhash
from Crypto.Hash import keccak

path = sys.argv[1]
key = sys.argv[2].encode() if len(sys.argv) > 2 else None
H = {  # id -> factory
    'md5': hashlib.md5, 'sha1': hashlib.sha1, 'sha224': hashlib.sha224, 'sha256': hashlib.sha256, 'sha384': hashlib.sha384,
    'sha512': hashlib.sha512, 'sha3_256': hashlib.sha3_256, 'sha3_512': hashlib.sha3_512, 'blake2b': hashlib.blake2b,
    'ripemd160': lambda: hashlib.new('ripemd160'),
}
state = {k: (hmac.new(key, digestmod=f) if key else f()) for k, f in H.items()}
if not key:
    state.update({'keccak256': keccak.new(digest_bits=256), 'blake3': blake3.blake3(), 'xxh64': xxhash.xxh64(), 'xxh3': xxhash.xxh3_64(), 'xxh128': xxhash.xxh3_128()})
crc = c32c = 0
with open(path, 'rb') as f:
    while chunk := f.read(8 << 20):
        for s in state.values(): s.update(chunk)
        if not key: crc = zlib.crc32(chunk, crc); c32c = crc32c.crc32c(chunk, c32c)
out = {k: s.hexdigest() for k, s in state.items()}
if not key: out.update({'crc32': f'{crc:08x}', 'crc32c': f'{c32c:08x}'})
print(json.dumps(out))

export const faqs = [
          { q: "Which algorithms are supported?", a: "MD5, SHA-1, SHA-224, SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-512, Keccak-256 (the Ethereum variant, which differs from SHA3-256), BLAKE2b-512, BLAKE3, RIPEMD-160, CRC32, CRC32C, xxHash64, XXH3-64 and XXH128. SHA-1 and the SHA-2 family use your browser's built-in Web Crypto; the others use hash-wasm, an open-source WebAssembly library." },
          { q: "Is there a file size limit?", a: "No. Files are read in 8 MB pieces, so even files larger than your device's memory can be hashed; speed depends on your device. Files up to 700 MB (100 MB on phones and tablets) are also held in memory once so SHA-1 and SHA-2 can use the browser's faster native code. A 5 GB file was hashed in under a minute on a desktop computer in our tests." },
          { q: "Are my files or text uploaded?", a: "No. Hashing runs in a background worker inside your browser tab; nothing is sent to a server." },
          { q: "How do I verify a downloaded file?", a: "Drop the file, then paste the checksum published by the site you downloaded it from into \"Expected hash\" (hex or Base64). The matching algorithm is highlighted in green; if none matches, the tool says which algorithms produce a hash of that length." },
          { q: "What is the checksums.txt file?", a: "One line per file and algorithm, in the \"SHA256 (file) = hash\" format that `sha256sum -c`, `md5sum -c` and `shasum -c` understand, so you can check the files again later from a terminal." },
          { q: "What does the HMAC key do?", a: "With a key, the tool computes a keyed HMAC (for example HMAC-SHA256) instead of a plain hash — used to sign API requests and webhooks. HMAC is not defined for checksums such as CRC32 or xxHash, nor for BLAKE3 and Keccak, so they are skipped while a key is set." },
          { q: "Why does my text give a different hash elsewhere?", a: "Text is hashed as UTF-8, exactly as it appears in the box. A trailing newline, Windows line endings (CRLF) or a different encoding change the hash; the byte count under the results helps spot this." }
        ];

// One source for this page's search content: the visible FAQ, example and links (page.jsx) and the metadata and
// structured data (layout.tsx) read the same object. 29/09 (croissance-29-09, point 4): the pages ranked first for
// "hash generator" / "sha256 checksum online" are single-purpose tool pages that list algorithms
// and a worked example; ours adds files of any size, verification and HMAC. Example values checked against the tool
// (scripts/browser-tests/seo-pages-29-09.mjs) and against OpenSSL.
export const SEO = {
  name: 'Hash Generator',
  path: '/tools/developer-tools/hash-generator',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'Hash Generator — MD5, SHA-256, SHA-512 & CRC32 Checksums',
  description: 'Free hash and checksum generator: MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3, CRC32, xxHash — 17 algorithms for text or files of any size. Verify a download or add an HMAC key. Nothing is uploaded.',
  faqs: [
    ...faqs,
    { q: 'MD5, SHA-1 or SHA-256: which one should I use?', a: 'Use the one the other side publishes — to verify a download, compare with the checksum the site gives. For anything new, prefer SHA-256: MD5 (128 bits, 32 hex characters) and SHA-1 (160 bits, 40 characters) have known collision attacks, while SHA-256 (256 bits, 64 characters) has none. MD5 and CRC32 remain fine for spotting accidental corruption.' },
  ],
  example: {
    caption: 'The word hello (5 bytes, no line break), typed in Text mode:',
    inputLabel: 'Text',
    input: 'hello',
    outputLabel: 'Hashes',
    output: 'MD5      5d41402abc4b2a76b9719d911017c592\nSHA-1    aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d\nSHA-256  2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824\nCRC32    3610a686',
  },
  related: [
    { href: '/tools/developer-tools/base64-encoder', label: 'Base64 Encoder', note: 'encode or decode Base64 text.' },
    { href: '/tools/developer-tools/password-generator', label: 'Password Generator', note: 'random passwords from your browser\'s secure generator.' },
    { href: '/tools/developer-tools/uuid-generator', label: 'UUID Generator', note: 'random version 4 UUIDs from a cryptographically strong source.' },
    { href: '/tools/developer-tools/jwt-decoder', label: 'JWT Decoder', note: 'read the header and payload of a JSON Web Token.' },
    { href: '/tools/file-tools/zip-extractor', label: 'ZIP Extractor', note: 'open ZIP, RAR, 7z and 40+ archive formats in the browser.' },
  ],
};

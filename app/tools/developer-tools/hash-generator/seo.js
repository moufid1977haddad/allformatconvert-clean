// One source for this page's example and links (page.jsx). P36 (06/10): the title and description are written as
// plain strings in layout.tsx (the content checks read them there) and repeated here; the FAQ is written in page.jsx.
// 29/09 (croissance-29-09, point 4): the pages ranked first for "hash generator" / "sha256 checksum online" are
// single-purpose tool pages that list algorithms and a worked example. Example values checked against the tool
// (scripts/browser-tests/seo-pages-29-09.mjs), against OpenSSL, and again with hash-wasm on 06/10 (P36).
export const SEO = {
  name: 'Hash Generator',
  path: '/tools/developer-tools/hash-generator',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'Hash Generator — MD5, SHA-256, SHA-512 & CRC32 Checksums',
  description: 'Hash text or files with MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3, CRC32 or xxHash, add an HMAC key or check a published checksum. Nothing is uploaded.',
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

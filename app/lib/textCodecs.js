// Text encoders/decoders for the developer tools (29/09).
//
// Measured before:
//   - Base64 Encoder: btoa() refuses any character above U+00FF ("Error
//     encoding" for "café ☕" or any emoji), and decoding Base64 of UTF-8 text
//     (what every other tool and every API produces) returned mojibake
//     ("cafÃ©") without a word; URL-safe Base64 (JWT, - and _) was refused.
//   - Hex to Text: é became "e9" (not the UTF-8 bytes "c3 a9" every hex tool
//     uses) and an emoji produced 4-digit groups that decoded to garbage.
//   - HTML Encoder: decoding "&amp;lt;" gave "<" instead of "&lt;" (two passes).
//   - HTML Entity Decoder: tags in the input were silently removed
//     ("<b>x</b> &amp; y" gave "x & y").
// Oracle in scripts/converter-tests/03-text-codecs.mjs: Node's Buffer.

const enc = new TextEncoder();

function bytesToBinary(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return s;
}

export function base64Encode(text, { urlSafe = false } = {}) {
  let b64 = btoa(bytesToBinary(enc.encode(text)));
  if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}

// Accepts standard and URL-safe alphabets, missing padding, and line breaks
// or spaces (MIME/PEM wrapping). Returns { text } for valid UTF-8, or
// { bytes } when the data is binary (not text) so the caller can say so.
export function base64Decode(input) {
  let s = input.replace(/[\s]/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('This is not valid Base64: only A-Z, a-z, 0-9, + / (or - _) and = padding are allowed.');
  s = s.replace(/=+$/, '');
  if (s.length % 4 === 1) throw new Error('This is not valid Base64: its length is impossible (one character too many or missing).');
  s += '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  try {
    return { text: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes), bytes };
  } catch {
    return { text: null, bytes };
  }
}

export function textToHex(text, separator = ' ') {
  return Array.from(enc.encode(text), (b) => b.toString(16).padStart(2, '0')).join(separator);
}

// Accepts spaces, commas, 0x prefixes and \x escapes between bytes.
export function hexToText(input) {
  const cleaned = input.replace(/0x|\\x/gi, '').replace(/[\s,:;-]/g, '');
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) throw new Error('This is not valid hex: only 0-9 and A-F are allowed (spaces, commas and 0x prefixes are fine).');
  if (cleaned.length % 2) throw new Error('This hex has an odd number of digits: every byte needs two.');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error('These bytes are not valid UTF-8 text (they may be binary data, or text in another encoding).');
  }
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function htmlEncode(text) {
  return text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

// One pass over each entity, never over the output of a previous
// replacement: "&amp;lt;" -> "&lt;". Named entities are resolved by the
// browser's own HTML parser (every HTML5 name), one entity at a time, so the
// rest of the input -- tags included -- is left exactly as written.
export function htmlDecode(text, resolveNamed) {
  return text.replace(/&(#[0-9]+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);?/g, (m, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '�';
      return String.fromCodePoint(code);
    }
    const r = resolveNamed(m);
    return r == null ? m : r;
  });
}

// Browser resolver for named entities (used by the pages).
export function browserNamedEntity(entity) {
  const out = new DOMParser().parseFromString('<!doctype html><body>' + entity, 'text/html').body.textContent;
  return out === entity ? null : out;
}

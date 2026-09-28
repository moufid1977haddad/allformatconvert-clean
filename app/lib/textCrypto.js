// Text Encryptor (29/09). Measured before: a repeating-key XOR, so with an
// EMPTY password the "encrypted" text was plain Base64 of the input (the key
// index i % 0 is NaN, XOR with undefined leaves every byte unchanged), and a
// short password is recoverable from a few known characters.
//
// Now, as the reference encryption sites do (aesencryption.net, devglan):
// AES-256-GCM from the browser's Web Crypto API, with the key derived from the
// password by PBKDF2-SHA-256 (600 000 iterations, OWASP 2023) and a random salt
// and IV per message. GCM authenticates: a wrong password or a modified text is
// refused, never decrypted into garbage.
//
// Format (Base64): "OCT1" | salt (16 bytes) | iv (12 bytes) | ciphertext+tag.
// Texts produced by the old XOR version can still be decrypted, and the result
// says that it was the old, weak format.

const MAGIC = [0x4f, 0x43, 0x54, 0x31]; // "OCT1"
const ITERATIONS = 600000;
const enc = new TextEncoder();

function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64) {
  const bin = atob(b64.replace(/\s+/g, ''));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptText(text, password) {
  if (!password) throw new Error('Enter a password: without one, the text cannot be encrypted.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
  const out = new Uint8Array(4 + 16 + 12 + ct.length);
  out.set(MAGIC, 0); out.set(salt, 4); out.set(iv, 20); out.set(ct, 32);
  return toB64(out);
}

// Returns { text, legacy } ; throws with a clear message otherwise.
export async function decryptText(b64, password) {
  if (!password) throw new Error('Enter the password used to encrypt this text.');
  let bytes;
  try { bytes = fromB64(b64.trim()); } catch { throw new Error('This is not an encrypted text from this tool (it is not valid Base64).'); }
  if (bytes.length >= 32 + 16 && MAGIC.every((b, i) => bytes[i] === b)) {
    const key = await deriveKey(password, bytes.subarray(4, 20));
    try {
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(20, 32) }, key, bytes.subarray(32));
      return { text: new TextDecoder().decode(pt), legacy: false };
    } catch {
      throw new Error('Wrong password, or the encrypted text was changed or cut: it cannot be decrypted.');
    }
  }
  // Old XOR format (before 29/09).
  const k = enc.encode(password);
  const pt = bytes.map((b, i) => b ^ k[i % k.length]);
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(pt), legacy: true };
  } catch {
    throw new Error('Wrong password, or this is not a text encrypted by this tool.');
  }
}

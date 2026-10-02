// P24 (03/10): JWT signature verification, as jwt.io offers it, with the browser's own WebCrypto (nothing is sent
// anywhere). Strict on purpose — a token must never be called "valid" when it is not:
//   - the algorithm comes from the header and must be one we verify; "none" and unknown values are refused;
//   - the key must fit that algorithm (an HMAC secret for HS*, an RSA key for RS*/PS*, the right curve for ES*,
//     an Ed25519 key for EdDSA); a public key pasted for HS256 is refused rather than used as an HMAC secret (the
//     classic "algorithm confusion" attack);
//   - an ECDSA signature must have the exact r||s length of its curve.
const ALGS = {
  HS256: { kind: 'hmac', hash: 'SHA-256' }, HS384: { kind: 'hmac', hash: 'SHA-384' }, HS512: { kind: 'hmac', hash: 'SHA-512' },
  RS256: { kind: 'rsa', name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, RS384: { kind: 'rsa', name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' }, RS512: { kind: 'rsa', name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
  PS256: { kind: 'rsa', name: 'RSA-PSS', hash: 'SHA-256', saltLength: 32 }, PS384: { kind: 'rsa', name: 'RSA-PSS', hash: 'SHA-384', saltLength: 48 }, PS512: { kind: 'rsa', name: 'RSA-PSS', hash: 'SHA-512', saltLength: 64 },
  ES256: { kind: 'ec', curve: 'P-256', hash: 'SHA-256', sigLen: 64 }, ES384: { kind: 'ec', curve: 'P-384', hash: 'SHA-384', sigLen: 96 }, ES512: { kind: 'ec', curve: 'P-521', hash: 'SHA-512', sigLen: 132 },
  EdDSA: { kind: 'ed' }, Ed25519: { kind: 'ed' },
};
export const SUPPORTED_ALGS = Object.keys(ALGS);

const toB64url = (bytes) => { let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const b64urlBytes = (s, what = 'The token') => {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error(`${what} contains characters that are not base64url.`);
  let bytes;
  try { bytes = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0)); } catch { throw new Error(`${what} is not valid base64url (wrong length).`); }
  // non-canonical spellings (unused trailing bits set) would make two strings the same bytes: refused (review 03/10)
  if (toB64url(bytes) !== s) throw new Error(`${what} is not canonical base64url (its last character carries extra bits).`);
  return bytes;
};
const b64Bytes = (s) => { try { return Uint8Array.from(atob(s.replace(/\s+/g, '')), (c) => c.charCodeAt(0)); } catch { throw new Error('The key is not valid base64.'); } };

function pemBody(text) {
  const m = /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/.exec(text);
  if (!m) return null;
  return { label: m[1], der: b64Bytes(m[2]) };
}

// A browser without WebCrypto Ed25519 refuses every Ed25519 key: said as such, never blamed on the visitor's key
let edSupport;
const ed25519Supported = () => (edSupport ??= crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify']).then(() => true, () => false));

async function importKey(alg, spec, keyText, secretEncoding) {
  const t = keyText.trim();
  if (spec.kind === 'ed' && !(await ed25519Supported())) throw new Error('This browser cannot verify Ed25519 (EdDSA) signatures yet: WebCrypto Ed25519 is recent. Try a current Chrome, Edge, Firefox or Safari 17+.');
  if (!t) throw new Error(spec.kind === 'hmac' ? 'Enter the secret the token was signed with.' : 'Paste the public key (PEM or JWK) the token was signed with.');
  if (spec.kind === 'hmac') {
    if (t.startsWith('{')) { // a JWK of type "oct" is a shared secret (its "k"), the only JWK an HS* token can use
      let jwk; try { jwk = JSON.parse(t); } catch { throw new Error('The key looks like a JWK but is not valid JSON.'); }
      if (jwk && jwk.kty === 'oct' && typeof jwk.k === 'string') {
        if (jwk.alg && jwk.alg !== alg) throw new Error(`The key is marked for ${jwk.alg}; the token says ${alg}.`);
        return crypto.subtle.importKey('raw', b64urlBytes(jwk.k, 'The key\'s "k"'), { name: 'HMAC', hash: spec.hash }, false, ['verify']);
      }
    }
    if (/-----BEGIN|^\s*\{/.test(t)) throw new Error(`${alg} is signed with a shared secret, not a public key: a token whose header says ${alg} must not be checked with an RSA or EC public key (that is the "algorithm confusion" attack).`);
    let raw;
    if (secretEncoding === 'base64') { try { raw = b64Bytes(t.replace(/-/g, '+').replace(/_/g, '/')); } catch { throw new Error('The secret is not valid base64.'); } } else raw = new TextEncoder().encode(keyText);
    return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: spec.hash }, false, ['verify']);
  }
  const params = spec.kind === 'rsa' ? { name: spec.name, hash: spec.hash } : spec.kind === 'ec' ? { name: 'ECDSA', namedCurve: spec.curve } : { name: 'Ed25519' };
  if (t.startsWith('{')) {
    let jwk;
    try { jwk = JSON.parse(t); } catch { throw new Error('The key looks like a JWK but is not valid JSON.'); }
    if (Array.isArray(jwk.keys)) throw new Error('This is a JWK Set: paste the one key (the object inside "keys") whose "kid" matches the token header.');
    const want = { rsa: 'RSA', ec: 'EC', ed: 'OKP' }[spec.kind];
    if (jwk.kty !== want) throw new Error(`The token says ${alg}, which needs a key of type ${want}; this JWK is "${jwk.kty}".`);
    if (spec.kind === 'ec' && jwk.crv !== spec.curve) throw new Error(`${alg} uses the curve ${spec.curve}; this key is on ${jwk.crv}.`);
    if (spec.kind === 'ed' && jwk.crv !== 'Ed25519') throw new Error('EdDSA here means Ed25519; this key is not an Ed25519 key.');
    if (jwk.alg && jwk.alg !== alg && !(spec.kind === 'ed' && ['EdDSA', 'Ed25519'].includes(jwk.alg))) throw new Error(`The key is marked for ${jwk.alg}; the token says ${alg}.`);
    if (jwk.use && jwk.use !== 'sig') throw new Error(`This key is marked "use": "${jwk.use}" (not for signatures).`);
    const { d, p, q, dp, dq, qi, oth, ...pub } = jwk; // only the public part is needed, a private key is never kept
    delete pub.key_ops; delete pub.use; delete pub.alg; delete pub.ext;
    try { return await crypto.subtle.importKey('jwk', pub, params, false, ['verify']); } catch (e) { throw new Error(`This key cannot be used for ${alg}: ${e.message}`); }
  }
  const pem = pemBody(t);
  if (!pem) throw new Error('The key is neither a PEM block (-----BEGIN PUBLIC KEY-----) nor a JWK ({"kty": …}).');
  if (pem.label === 'CERTIFICATE') throw new Error('This is an X.509 certificate: paste its public key (-----BEGIN PUBLIC KEY-----) instead, e.g. from `openssl x509 -pubkey -noout`.');
  if (pem.label === 'RSA PUBLIC KEY') throw new Error('This is a PKCS#1 RSA key: convert it to -----BEGIN PUBLIC KEY----- (openssl rsa -RSAPublicKey_in -pubout).');
  if (/PRIVATE KEY/.test(pem.label)) throw new Error('This is a private key: paste the public key. A private key should never be pasted into a web page.');
  if (pem.label !== 'PUBLIC KEY') throw new Error(`Unexpected PEM block "${pem.label}": paste -----BEGIN PUBLIC KEY-----.`);
  try { return await crypto.subtle.importKey('spki', pem.der, params, false, ['verify']); } catch (e) {
    throw new Error(`This public key does not fit ${alg} (${spec.kind === 'ec' ? `curve ${spec.curve}` : spec.kind === 'rsa' ? 'an RSA key is needed' : 'an Ed25519 key is needed'})${e.message ? ': ' + e.message : ''}.`);
  }
}

// -> { valid: boolean, alg } ; throws an Error with a sentence when the check cannot be made
export async function verifyJwt(token, keyText, { secretEncoding = 'utf8' } = {}) {
  // a token copied from an e-mail or a terminal may be cut by line breaks: they are removed, and said
  const notes = [];
  if (/\s/.test(token.trim())) notes.push('spaces and line breaks inside the token were removed');
  const parts = token.replace(/\s+/g, '').split('.');
  if (parts.length !== 3) throw new Error('A signed JWT has three parts separated by dots.');
  let header;
  try { header = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(b64urlBytes(parts[0], 'The header'))); } catch (e) { throw new Error(/base64url/.test(e.message) ? e.message : 'The header is not valid JSON.'); }
  if (!header || typeof header !== 'object' || Array.isArray(header)) throw new Error('The header is not a JSON object.');
  const alg = header.alg;
  // only an own, string "alg" from the table: {"alg":"toString"} or {"alg":["HS256"]} used to reach the wrong code (review 03/10)
  if (typeof alg !== 'string') throw new Error(alg === undefined ? 'The header has no "alg": the algorithm is unknown, nothing can be verified.' : 'The header\'s "alg" is not a string (RFC 7515 requires one).');
  if (alg.trim().toLowerCase() === 'none') throw new Error('This token is not signed (alg "none"): there is nothing to verify, and it must not be trusted.');
  if (!Object.hasOwn(ALGS, alg)) throw new Error(`Unsupported algorithm "${alg}". Supported: ${SUPPORTED_ALGS.join(', ')}.`);
  const spec = ALGS[alg];
  if (header.crit !== undefined) throw new Error(`This token marks extensions as critical ("crit": ${JSON.stringify(header.crit).slice(0, 60)}); RFC 7515 says a verifier that does not understand them must reject the token, and this tool does not.`);
  if (header.b64 === false) throw new Error('This token uses an unencoded payload ("b64": false, RFC 7797), which this tool does not verify.');
  try { JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(b64urlBytes(parts[1], 'The payload'))); } catch (e) { throw new Error(/base64url/.test(e.message) ? e.message : 'The payload is not valid JSON.'); }
  if (!crypto?.subtle) throw new Error('This browser has no WebCrypto: the signature cannot be checked here.');
  const sig = b64urlBytes(parts[2], 'The signature');
  const data = new TextEncoder().encode(parts[0] + '.' + parts[1]);
  const key = await importKey(alg, spec, keyText, secretEncoding);
  if (spec.kind === 'ec' && sig.length !== spec.sigLen) return { valid: false, alg, reason: `an ${alg} signature is ${spec.sigLen} bytes; this one is ${sig.length}` };
  const params = spec.kind === 'hmac' ? { name: 'HMAC' } : spec.kind === 'rsa' ? (spec.name === 'RSA-PSS' ? { name: 'RSA-PSS', saltLength: spec.saltLength } : { name: spec.name })
    : spec.kind === 'ec' ? { name: 'ECDSA', hash: spec.hash } : { name: 'Ed25519' };
  let valid;
  try { valid = await crypto.subtle.verify(params, key, sig, data); } catch (e) {
    if (spec.kind === 'ed') throw new Error('This browser cannot verify Ed25519 signatures yet (WebCrypto Ed25519 is recent).');
    throw e;
  }
  const note = notes.length ? notes.join('; ') : undefined;
  if (valid) return { valid, alg, note };
  // a secret copied with a line break or spaces around it (from a .env file) is a common cause: checked and said
  if (spec.kind === 'hmac' && secretEncoding === 'utf8' && keyText !== keyText.trim()) {
    const trimmed = await crypto.subtle.importKey('raw', new TextEncoder().encode(keyText.trim()), { name: 'HMAC', hash: spec.hash }, false, ['verify']);
    if (await crypto.subtle.verify(params, trimmed, sig, data)) return { valid: false, alg, note, reason: 'it matches the secret WITHOUT the spaces or line break at its start or end — the pasted secret has them; check how it was copied' };
  }
  // RSA-PSS: RFC 7518 requires a salt as long as the hash; some libraries sign with another length
  if (spec.name === 'RSA-PSS') {
    const modBytes = Math.ceil(key.algorithm.modulusLength / 8), hashLen = { 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64 }[spec.hash];
    for (const saltLength of [0, modBytes - hashLen - 2]) {
      if (saltLength >= 0 && await crypto.subtle.verify({ name: 'RSA-PSS', saltLength }, key, sig, data).catch(() => false)) {
        return { valid: false, alg, note, reason: `it was signed with this key but with a ${saltLength}-byte salt; RFC 7518 requires ${hashLen} bytes for ${alg}, and conforming libraries reject it` };
      }
    }
  }
  return { valid, alg, note };
}

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

const b64urlBytes = (s) => {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error('The token contains characters that are not base64url.');
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const b64Bytes = (s) => Uint8Array.from(atob(s.replace(/\s+/g, '')), (c) => c.charCodeAt(0));

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
    const { d, p, q, dp, dq, qi, ...pub } = jwk; // only the public part is needed, a private key is never kept
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
  const parts = token.trim().split('.');
  if (parts.length !== 3) throw new Error('A signed JWT has three parts separated by dots.');
  let header;
  try { header = JSON.parse(new TextDecoder().decode(b64urlBytes(parts[0]))); } catch { throw new Error('The header is not valid base64url JSON.'); }
  const alg = header && header.alg;
  if (alg === 'none' || alg === 'None' || alg === 'NONE') throw new Error('This token is not signed (alg "none"): there is nothing to verify, and it must not be trusted.');
  const spec = ALGS[alg];
  if (!spec) throw new Error(`Unsupported algorithm "${alg}". Supported: ${SUPPORTED_ALGS.join(', ')}.`);
  if (!crypto?.subtle) throw new Error('This browser has no WebCrypto: the signature cannot be checked here.');
  const sig = b64urlBytes(parts[2]);
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
  return { valid, alg };
}

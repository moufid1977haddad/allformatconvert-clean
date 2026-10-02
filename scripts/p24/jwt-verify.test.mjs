// P24 (03/10): tokens signed by Node's own crypto (an independent implementation), verified by app/lib/jwtVerify.js.
import { generateKeyPairSync, createSign, createHmac, sign as edSign, constants } from 'node:crypto';
import assert from 'node:assert/strict';
const { verifyJwt } = await import(new URL('../../app/lib/jwtVerify.js', import.meta.url));
let passed = 0, failed = 0;
const test = async (name, fn) => { try { await fn(); passed++; console.log('  PASS', name); } catch (e) { failed++; console.log('  FAIL', name, '\n', e.message); } };
const b64u = (b) => Buffer.from(b).toString('base64url');
const make = (alg, payload = { sub: '1', n: 12345678901234567890n.toString() }) => b64u(JSON.stringify({ alg, typ: 'JWT' })) + '.' + b64u(JSON.stringify(payload));
const tamper = (t) => { const [h, p, s] = t.split('.'); return h + '.' + b64u(JSON.stringify({ sub: '2' })) + '.' + s; };
const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
const rsaPem = rsa.publicKey.export({ type: 'spki', format: 'pem' });
const rsaJwk = JSON.stringify(rsa.publicKey.export({ format: 'jwk' }));
const ec = { 'P-256': generateKeyPairSync('ec', { namedCurve: 'P-256' }), 'P-384': generateKeyPairSync('ec', { namedCurve: 'P-384' }), 'P-521': generateKeyPairSync('ec', { namedCurve: 'P-521' }) };
const ed = generateKeyPairSync('ed25519');
const signRsa = (alg, hash, pss) => { const t = make(alg); const s = createSign(hash).update(t).sign(pss ? { key: rsa.privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: { SHA256: 32, SHA384: 48, SHA512: 64 }[hash] } : rsa.privateKey); return t + '.' + b64u(s); };
const signEc = (alg, curve, hash) => { const t = make(alg); const s = createSign(hash).update(t).sign({ key: ec[curve].privateKey, dsaEncoding: 'ieee-p1363' }); return t + '.' + b64u(s); };
const signHs = (alg, hash, secret) => { const t = make(alg); return t + '.' + createHmac(hash, secret).update(t).digest('base64url'); };

for (const [alg, hash] of [['HS256', 'sha256'], ['HS384', 'sha384'], ['HS512', 'sha512']]) await test(`${alg}: right secret valid, wrong secret and tampered payload invalid`, async () => {
  const t = signHs(alg, hash, 'a-string-secret-at-least-256-bits-long');
  assert.equal((await verifyJwt(t, 'a-string-secret-at-least-256-bits-long')).valid, true);
  assert.equal((await verifyJwt(t, 'another')).valid, false);
  assert.equal((await verifyJwt(tamper(t), 'a-string-secret-at-least-256-bits-long')).valid, false);
});
await test('HS256 base64 secret', async () => { const raw = Buffer.from('c2VjcmV0LWJ5dGVzLTEyMzQ=', 'base64'); const t = signHs('HS256', 'sha256', raw); assert.equal((await verifyJwt(t, 'c2VjcmV0LWJ5dGVzLTEyMzQ=', { secretEncoding: 'base64' })).valid, true); assert.equal((await verifyJwt(t, 'c2VjcmV0LWJ5dGVzLTEyMzQ=')).valid, false); });
for (const [alg, hash, pss] of [['RS256', 'SHA256'], ['RS384', 'SHA384'], ['RS512', 'SHA512'], ['PS256', 'SHA256', 1], ['PS384', 'SHA384', 1], ['PS512', 'SHA512', 1]]) await test(`${alg}: PEM and JWK valid, tampered invalid`, async () => {
  const t = signRsa(alg, hash, pss);
  assert.equal((await verifyJwt(t, rsaPem)).valid, true); assert.equal((await verifyJwt(t, rsaJwk)).valid, true);
  assert.equal((await verifyJwt(tamper(t), rsaPem)).valid, false);
});
for (const [alg, curve, hash] of [['ES256', 'P-256', 'SHA256'], ['ES384', 'P-384', 'SHA384'], ['ES512', 'P-521', 'SHA512']]) await test(`${alg}: valid, tampered invalid, wrong curve refused`, async () => {
  const t = signEc(alg, curve, hash);
  const pem = ec[curve].publicKey.export({ type: 'spki', format: 'pem' });
  assert.equal((await verifyJwt(t, pem)).valid, true);
  assert.equal((await verifyJwt(t, JSON.stringify(ec[curve].publicKey.export({ format: 'jwk' })))).valid, true);
  assert.equal((await verifyJwt(tamper(t), pem)).valid, false);
  const other = curve === 'P-256' ? 'P-384' : 'P-256';
  await assert.rejects(verifyJwt(t, ec[other].publicKey.export({ type: 'spki', format: 'pem' })));
});
await test('EdDSA valid / tampered invalid', async () => { const t = make('EdDSA'); const tok = t + '.' + b64u(edSign(null, Buffer.from(t), ed.privateKey)); const pem = ed.publicKey.export({ type: 'spki', format: 'pem' }); assert.equal((await verifyJwt(tok, pem)).valid, true); assert.equal((await verifyJwt(tamper(tok), pem)).valid, false); });
await test('alg none refused; unknown alg refused', async () => { await assert.rejects(verifyJwt(make('none') + '.', 'x'), /not signed/); await assert.rejects(verifyJwt(make('HS1') + '.abc', 'x'), /Unsupported/); });
await test('algorithm confusion: RS256 public key used as HS256 secret refused', async () => { const t = signHs('HS256', 'sha256', rsaPem); await assert.rejects(verifyJwt(t, rsaPem), /algorithm confusion/); await assert.rejects(verifyJwt(t, rsaJwk), /algorithm confusion/); });
await test('RSA key for an ES256 token refused; EC key for RS256 refused', async () => { await assert.rejects(verifyJwt(signEc('ES256', 'P-256', 'SHA256'), rsaPem)); await assert.rejects(verifyJwt(signRsa('RS256', 'SHA256'), ec['P-256'].publicKey.export({ type: 'spki', format: 'pem' }))); });
await test('ES256 with a DER (not r||s) signature is invalid, not accepted', async () => { const t = make('ES256'); const der = createSign('SHA256').update(t).sign(ec['P-256'].privateKey); const r = await verifyJwt(t + '.' + b64u(der), ec['P-256'].publicKey.export({ type: 'spki', format: 'pem' })); assert.equal(r.valid, false); });
await test('private key, certificate, JWK set refused with a sentence', async () => { const t = signRsa('RS256', 'SHA256'); await assert.rejects(verifyJwt(t, rsa.privateKey.export({ type: 'pkcs8', format: 'pem' })), /private key/); await assert.rejects(verifyJwt(t, '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----'), /certificate/); await assert.rejects(verifyJwt(t, JSON.stringify({ keys: [] })), /JWK Set/); });
await test('two parts or bad base64 refused', async () => { await assert.rejects(verifyJwt('a.b', 'x'), /three parts/); await assert.rejects(verifyJwt(make('HS256') + '.ab+c', 'x'), /base64url/); });
console.log(failed ? `${failed} FAILED, ${passed} passed` : `jwt-verify: all ${passed} passed`);
process.exitCode = failed ? 1 : 0;

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
// review 03/10
const hsTok = (header, payloadSeg, secret = 'k') => { const t = b64u(JSON.stringify(header)) + '.' + payloadSeg; return t + '.' + createHmac('sha256', secret).update(t).digest('base64url'); };
const okPayload = b64u(JSON.stringify({ sub: '1' }));
await test('alg from the prototype chain or not a string is refused', async () => {
  for (const alg of ['toString', '__proto__', 'constructor', 'valueOf']) await assert.rejects(verifyJwt(hsTok({ alg }, okPayload), 'k'), /Unsupported/, alg);
  await assert.rejects(verifyJwt(hsTok({ alg: ['HS256'] }, okPayload), 'k'), /not a string/);
  await assert.rejects(verifyJwt(hsTok({ typ: 'JWT' }, okPayload), 'k'), /no "alg"/);
  for (const alg of ['nOnE', ' none']) await assert.rejects(verifyJwt(hsTok({ alg }, okPayload), 'k'), /not signed/);
});
await test('crit and b64:false refused; payload must be base64url JSON', async () => {
  await assert.rejects(verifyJwt(hsTok({ alg: 'HS256', crit: ['zzz'], zzz: 1 }, okPayload), 'k'), /critical/);
  await assert.rejects(verifyJwt(hsTok({ alg: 'HS256', b64: false }, okPayload), 'k'), /unencoded/);
  await assert.rejects(verifyJwt(hsTok({ alg: 'HS256' }, 'notbase64!!'), 'k'), /payload/i);
  await assert.rejects(verifyJwt(hsTok({ alg: 'HS256' }, b64u('not json')), 'k'), /payload is not valid JSON/);
});
await test('non-canonical signature refused; token with line breaks verified and said', async () => {
  const t = hsTok({ alg: 'HS256' }, okPayload); const sig = t.split('.')[2];
  const last = sig.at(-1), alt = 'AEIMQUYcgkosw048'.includes(last) ? String.fromCharCode(last.charCodeAt(0) + 1) : null;
  if (alt) await assert.rejects(verifyJwt(t.slice(0, -1) + alt, 'k'), /canonical/);
  const r = await verifyJwt(t.slice(0, 20) + String.fromCharCode(10) + t.slice(20), 'k'); assert.equal(r.valid, true); assert.match(r.note, /line breaks/);
});
await test('HS secret pasted with a trailing newline: invalid, with the reason', async () => {
  const r = await verifyJwt(hsTok({ alg: 'HS256' }, okPayload, 'secret'), 'secret' + String.fromCharCode(10)); assert.equal(r.valid, false); assert.match(r.reason, /WITHOUT the spaces/);
});
await test('oct JWK accepted for HS256', async () => {
  const r = await verifyJwt(hsTok({ alg: 'HS256' }, okPayload, 'secret'), JSON.stringify({ kty: 'oct', k: b64u('secret') })); assert.equal(r.valid, true);
});
await test('PS256 signed with the maximum salt: invalid, with the reason', async () => {
  const t = make('PS256'); const sg = createSign('SHA256').update(t).sign({ key: rsa.privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_MAX_SIGN });
  const r = await verifyJwt(t + '.' + b64u(sg), rsaPem); assert.equal(r.valid, false); assert.match(r.reason, /salt/);
});
console.log(failed ? `${failed} FAILED, ${passed} passed` : `jwt-verify: all ${passed} passed`);
process.exitCode = failed ? 1 : 0;

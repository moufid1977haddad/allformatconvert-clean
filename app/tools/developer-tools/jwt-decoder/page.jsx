'use client';
import { useRef, useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reformatJson } from '../../../lib/jsonText';
import { verifyJwt } from '../../../lib/jwtVerify';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JwtDecoderPage() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useToolError('');
  // P24 (03/10): signature verification, as jwt.io does it — locally, with WebCrypto (app/lib/jwtVerify.js)
  const [key, setKey] = useState('');
  const [secretEncoding, setSecretEncoding] = useState('utf8');
  const [verdict, setVerdict] = useState(null); // { valid, alg, reason } | { error }
  const [checking, setChecking] = useState(false);
  // (decoded here: b64UrlDecodeUtf8 is declared further down, and a const cannot be used before its line)
  const alg = (() => { try { const h = token.trim().split('.')[0].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(h + '==='.slice((h.length + 3) % 4)), (c) => c.charCodeAt(0)))).alg || ''; } catch { return ''; } })();
  // a verdict is shown only for the token, key and encoding it was computed for (review 03/10: typing during a check
  // could show the old token's verdict under the new one)
  const reqRef = useRef(0);
  const stale = () => { reqRef.current++; setVerdict(null); setChecking(false); };
  const verify = async () => {
    const id = ++reqRef.current;
    setChecking(true); setVerdict(null);
    let v;
    try { v = await verifyJwt(token, key, { secretEncoding }); } catch (e) { v = { error: e.message || String(e) }; }
    if (id === reqRef.current) { setVerdict(v); setChecking(false); }
  };
  const b64UrlDecodeUtf8 = (str) => {
    const binary = atob(str.replace(/-/g,'+').replace(/_/g,'/'));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  };
  const decode = () => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      // Shown from the decoded TEXT, re-indented: JSON.parse + stringify
      // rounded 64-bit ids in claims (29/09). JSON.parse still validates.
      const headerText = b64UrlDecodeUtf8(parts[0]);
      const payloadText = b64UrlDecodeUtf8(parts[1]);
      const payloadObj = JSON.parse(payloadText);
      JSON.parse(headerText);
      const times = ['exp', 'iat', 'nbf'].filter(c => typeof payloadObj[c] === 'number').map(c => {
        const d = new Date(payloadObj[c] * 1000);
        const note = c === 'exp' ? (d < new Date() ? ' — expired' : ' — not expired yet') : c === 'nbf' && d > new Date() ? ' — not valid yet' : '';
        return `${c}: ${d.toISOString().replace('.000Z', 'Z')} (UTC)${note}`;
      });
      setDecoded({ header: reformatJson(headerText, 2), payload: reformatJson(payloadText, 2), times });
      setError('');
    } catch(e) { setError('Invalid JWT token'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JWT Decoder</h1>
        <p className="text-neutral-500 text-center mb-8">Decode and inspect JWT tokens</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none font-mono" placeholder="Paste JWT token here..." value={token} onChange={e => { setToken(e.target.value); stale(); setDecoded(null); setError(''); }} />
          <button onClick={decode} disabled={!token} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decode</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2">
            <label htmlFor="jwt-key" className="block text-sm text-neutral-600 font-semibold">Verify the signature{alg ? ` (${alg})` : ''}</label>
            <TextArea id="jwt-key" value={key} onChange={(e) => { setKey(e.target.value); stale(); }} spellCheck={false} autoComplete="off"
              placeholder={/^HS/.test(alg) ? 'The shared secret' : 'The public key: -----BEGIN PUBLIC KEY----- … or a JWK {"kty": …}'}
              className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-sm h-24 resize-none font-mono" />
            {/^HS/.test(alg) && (
              <label className="flex items-center gap-2 text-sm text-neutral-600">Secret is
                <select id="jwt-secret-enc" value={secretEncoding} onChange={(e) => { setSecretEncoding(e.target.value); stale(); }} className="bg-white border border-neutral-200 rounded p-1">
                  <option value="utf8">text</option><option value="base64">base64 / base64url</option>
                </select>
              </label>
            )}
            <button type="button" onClick={verify} disabled={!token || !key || checking} className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-gray-600 rounded-lg py-2 font-semibold text-white">{checking ? 'Checking…' : 'Verify signature'}</button>
            {verdict && (verdict.error
              ? <p role="alert" className="text-sm text-amber-700" data-verdict="error">{verdict.error}</p>
              : verdict.valid
                ? <p className="text-sm text-green-700 font-semibold" data-verdict="valid">Signature verified ({verdict.alg}): this token was signed with this key and has not been changed{verdict.note ? ` (${verdict.note})` : ''}. Check exp / nbf in the decoded payload as well.</p>
                : <p role="alert" className="text-sm text-red-600 font-semibold" data-verdict="invalid">Invalid signature ({verdict.alg}){verdict.reason ? `: ${verdict.reason}` : ''} {verdict.reason ? '.' : ' — the token was changed, or signed with another key.'} Do not trust it.</p>)}
            <p className="text-xs text-neutral-500">Checked in your browser with WebCrypto; the key and the token are not sent to our servers. HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512 and EdDSA (Ed25519, in browsers that support it).</p>
          </div>
          {decoded && ['header','payload'].map(k => <div key={k} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4"><div className="text-neutral-500 text-sm mb-2 uppercase">{k}</div><pre className="font-mono text-sm text-indigo-400 overflow-x-auto">{decoded[k]}</pre>{k === 'payload' && decoded.times.length > 0 && <ul className="mt-2 text-sm text-neutral-600">{decoded.times.map(t => <li key={t}>{t}</li>)}</ul>}</div>)}
        </div>
      </div>
      <SeoContent
        title={"JWT Decoder"}
        description={"JWT Decoder shows the header and payload of a signed JSON Web Token as indented JSON, keeping large numbers exactly as written, and turns the exp, iat and nbf claims into UTC dates with an expired or not-yet-valid note. It also verifies the signature locally with WebCrypto: a shared secret for HS256, HS384 and HS512, or a public key in PEM or JWK form for RS, PS, ES and EdDSA (Ed25519) tokens. Unsigned tokens (alg none) and a public key offered for an HS token are refused. Encrypted tokens with five parts are not supported."}
        example={{
          caption: "An HS256 token decoded, then verified with the secret my-secret (the exp note depends on today's date; this token expired on 1 January 2026):",
          inputLabel: "Token",
          input: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsIm5hbWUiOiJBZGEiLCJpYXQiOjE3NjcyMjU2MDAsImV4cCI6MTc2NzIyOTIwMH0.tSbItJNpja-KxR9Sew4UseTRkf2DxToP11X65NZgLJw",
          outputLabel: "Decode and Verify signature",
          output: "HEADER\n{\n  \"alg\": \"HS256\",\n  \"typ\": \"JWT\"\n}\n\nPAYLOAD\n{\n  \"sub\": \"42\",\n  \"name\": \"Ada\",\n  \"iat\": 1767225600,\n  \"exp\": 1767229200\n}\nexp: 2026-01-01T01:00:00Z (UTC) — expired\niat: 2026-01-01T00:00:00Z (UTC)\n\nSignature verified (HS256): this token was signed with this key and has not been changed. Check exp / nbf in the decoded payload as well.",
        }}
        howToTitle={"How to decode and verify a JWT"}
        howTo={[
          "Paste the token, three base64url parts separated by dots, and click \"Decode\".",
          "Read the header, the payload and, under it, the exp, iat and nbf dates in UTC.",
          "To check the signature, paste the secret or the public key under \"Verify the signature\"; for an HS token, set \"Secret is\" to text or base64 / base64url.",
          "Click \"Verify signature\" to get \"Signature verified\" or \"Invalid signature\" with the reason."
        ]}
        specs={[
          { label: "Token format", value: "Signed JWT in compact form (three parts); encrypted tokens and unencoded payloads are not handled" },
          { label: "Algorithms", value: "HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512 and EdDSA (Ed25519, in browsers whose WebCrypto supports it)" },
          { label: "Keys accepted", value: "A secret as text or base64/base64url, an oct JWK, a PEM public key, or an RSA, EC or OKP JWK" },
          { label: "Keys refused, with a reason", value: "JWK Sets, X.509 certificates, PKCS#1 RSA keys and PEM private keys; a private JWK is reduced to its public part" },
          { label: "Not checked for you", value: "exp, nbf, iss and aud: the dates are shown, the decision stays with your application" }
        ]}
        privacyTitle={"Where your token is processed"}
        privacy={"Decoding and signature checks run in this page with your browser's atob and WebCrypto; the token and the key are not sent to our servers. If you turn on a translation in the language menu, Google receives the text shown on the page, including the decoded header and payload, so keep translation off for real tokens. A failed decode sends us the message Invalid JWT token, the tool's name and your browser's name and version."}
        faqs={[
          { q: "Does this tool verify the JWT signature?", a: "Yes. Paste the shared secret for HS256, HS384 or HS512, or the issuer's public key as PEM or JWK for RS, PS, ES or EdDSA, then click \"Verify signature\". The algorithm is read from the token header, and alg none is refused." },
          { q: "Is a verified token safe to accept?", a: "Not by itself. A verified signature proves the token was signed with that key and has not changed since. Your application must still check exp, nbf, the issuer (iss) and the audience (aud); this page only shows them." },
          { q: "Why is my public key refused for an HS256 token?", a: "Accepting it would allow the algorithm-confusion attack, where a public key is used as an HMAC secret. An HS token must be checked with its shared secret, so a PEM key or a non-oct JWK is refused for HS256, HS384 and HS512." },
          { q: "Why is my JWK Set or certificate refused?", a: "The check needs one public key. From a JWK Set, paste the single key whose kid matches the token header. From an X.509 certificate, extract the key with openssl x509 -pubkey -noout, and convert a PKCS#1 RSA PUBLIC KEY to the PUBLIC KEY form." },
          { q: "Why does Decode say Invalid JWT token?", a: "The text does not have three dot-separated parts, or a part is not base64url-encoded JSON. Encrypted tokens with five parts are not supported. Decode never looks at the signature, so a wrong signature cannot cause this message." }
        ]}
        tips={[
          "A secret copied from a .env file can end with a line break; with \"Secret is\" set to text, the verdict says so when the secret matches without it.",
          "If a PS256 token was signed with another salt length, the verdict names that length and explains why conforming libraries reject it."
        ]}
      />
    </div>
  );
}
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
            <p className="text-xs text-neutral-500">Checked in your browser with WebCrypto; the key and the token are not sent anywhere. HS256/384/512, RS256/384/512, PS256/384/512, ES256/384/512 and EdDSA (Ed25519, in browsers that support it).</p>
          </div>
          {decoded && ['header','payload'].map(k => <div key={k} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4"><div className="text-neutral-500 text-sm mb-2 uppercase">{k}</div><pre className="font-mono text-sm text-indigo-400 overflow-x-auto">{decoded[k]}</pre>{k === 'payload' && decoded.times.length > 0 && <ul className="mt-2 text-sm text-neutral-600">{decoded.times.map(t => <li key={t}>{t}</li>)}</ul>}</div>)}
        </div>
      </div>
      <SeoContent
        title="JWT Decoder"
        description="JWT Decoder splits a JWT into its header and payload, base64url-decodes each, and pretty-prints the resulting JSON, entirely in your browser — nothing is uploaded to a server. It also verifies the signature, like jwt.io, with a shared secret (HS256/384/512) or a public key in PEM or JWK form (RS, PS, ES and EdDSA), locally with your browser's WebCrypto."
        howTo={[
          "Paste a JWT into the input box (three base64url segments separated by dots).",
          "Click 'Decode' to view the header and payload as formatted JSON.",
          "Read the claims — common ones include exp (expiration), iat (issued at), and sub (subject).",
          "To check the signature, paste the shared secret or the public key under 'Verify the signature' and click 'Verify signature'.",
          "If the format is invalid, you'll see an 'Invalid JWT token' error."
        ]}
        faqs={[
          { q: "What is a JWT?", a: "A compact, URL-safe token format with three dot-separated parts — header, payload, and signature — commonly used to carry authentication claims." },
          { q: "Does this tool verify the signature?", a: "Yes. Paste the shared secret (HS256, HS384, HS512) or the issuer's public key as PEM or JWK (RS*, PS*, ES*, EdDSA) and click 'Verify signature'. The algorithm is read from the token header; unsigned tokens (alg none) are refused, and a public key offered for an HS* token is refused too (the algorithm-confusion attack)." },
          { q: "Is my token uploaded to a server?", a: "No, decoding happens entirely in your browser." },
          { q: "Can I use this to confirm a token is valid or trustworthy?", a: "A verified signature proves the token was signed with that key and not changed since. Whether the token is still acceptable also depends on its claims — exp, nbf, the issuer (iss) and audience (aud) your application expects — which you should read below and check in your application." }
        ]}
        tips={[
          "Decoding always succeeds, whatever the signature: only 'Signature verified' says a token is authentic.",
          "Check the exp claim to see when a token expires — a valid signature does not make an expired token acceptable.",
          "Useful for quickly inspecting claims during development, not for making trust decisions about a token's origin.",
          "Be cautious pasting real production tokens here or anywhere — anyone who has the token text can read its (unencrypted) payload."
        ]}
      />
    </div>
  );
}
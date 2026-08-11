'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JwtDecoderPage() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');
  const b64UrlDecodeUtf8 = (str) => {
    const binary = atob(str.replace(/-/g,'+').replace(/_/g,'/'));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  };
  const decode = () => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const header = JSON.parse(b64UrlDecodeUtf8(parts[0]));
      const payload = JSON.parse(b64UrlDecodeUtf8(parts[1]));
      setDecoded({ header, payload });
      setError('');
    } catch(e) { setError('Invalid JWT token'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JWT Decoder</h1>
        <p className="text-neutral-500 text-center mb-8">Decode and inspect JWT tokens</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none font-mono" placeholder="Paste JWT token here..." value={token} onChange={e => setToken(e.target.value)} />
          <button onClick={decode} disabled={!token} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Decode</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {decoded && ['header','payload'].map(k => <div key={k} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4"><div className="text-neutral-500 text-sm mb-2 uppercase">{k}</div><pre className="font-mono text-sm text-indigo-400 overflow-x-auto">{JSON.stringify(decoded[k], null, 2)}</pre></div>)}
        </div>
      </div>
      <SeoContent
        title="JWT Decoder"
        description="JWT Decoder splits a JWT into its header and payload, base64url-decodes each, and pretty-prints the resulting JSON, entirely in your browser — nothing is uploaded to a server. It decodes only: it does not verify the signature, so it cannot tell you whether a token is authentic or has been tampered with. Any string with the correct three-part, base64url-encoded-JSON shape will decode successfully, valid signature or not."
        howTo={[
          "Paste a JWT into the input box (three base64url segments separated by dots).",
          "Click 'Decode' to view the header and payload as formatted JSON.",
          "Read the claims — common ones include exp (expiration), iat (issued at), and sub (subject).",
          "If the format is invalid, you'll see an 'Invalid JWT token' error."
        ]}
        faqs={[
          { q: "What is a JWT?", a: "A compact, URL-safe token format with three dot-separated parts — header, payload, and signature — commonly used to carry authentication claims." },
          { q: "Does this tool verify the signature?", a: "No. It only decodes the header and payload; the signature segment isn't checked or even displayed. A forged or tampered token with the right shape will decode exactly like a genuine one." },
          { q: "Is my token uploaded to a server?", a: "No, decoding happens entirely in your browser." },
          { q: "Can I use this to confirm a token is valid or trustworthy?", a: "No — decoding is not validation. To actually verify a token, check its signature against the issuer's key using a JWT library on a server or trusted environment, not by eye in a decoder like this." }
        ]}
        tips={[
          "Never treat a successfully decoded token as proof of authenticity — decoding always succeeds regardless of whether the signature is valid.",
          "Check the exp claim to see when a token expires, but remember this is just reading a field, not confirming the token wasn't forged.",
          "Useful for quickly inspecting claims during development, not for making trust decisions about a token's origin.",
          "Be cautious pasting real production tokens here or anywhere — anyone who has the token text can read its (unencrypted) payload."
        ]}
      />
    </div>
  );
}
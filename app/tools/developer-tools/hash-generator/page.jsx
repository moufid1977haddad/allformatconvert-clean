'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function HashGeneratorPage() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState(null);
  const generate = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = async (algo) => { const buf = await crypto.subtle.digest(algo, data); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''); };
    const [sha1, sha256, sha512] = await Promise.all([hashBuffer('SHA-1'), hashBuffer('SHA-256'), hashBuffer('SHA-512')]);
    setHashes({ sha1, sha256, sha512 });
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hash Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate SHA-1, SHA-256, SHA-512 hashes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Enter text to hash..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={generate} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Generate Hashes</button>
          {hashes && ['sha1','sha256','sha512'].map(k => (
            <div key={k} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
              <div className="text-neutral-500 text-xs mb-1 uppercase">{k}</div>
              <div className="font-mono text-xs break-all text-indigo-400">{hashes[k]}</div>
              <button onClick={() => navigator.clipboard.writeText(hashes[k])} className="text-xs text-neutral-500 hover:text-neutral-300 mt-1">Copy</button>
            </div>
          ))}
        </div>
      </div>
      <SeoContent
        title="Hash Generator"
        description="Hash Generator computes SHA-1, SHA-256, and SHA-512 hashes of the text you type, using the browser's built-in Web Crypto API — nothing is sent to a server. All three hashes are generated together automatically; there's no algorithm picker, no MD5 (the Web Crypto API doesn't provide it), and no file upload — only pasted or typed text."
        howTo={[
          "Type or paste text into the input box.",
          "Click 'Generate Hashes' to compute all three hashes at once.",
          "Read the SHA-1, SHA-256, and SHA-512 results below.",
          "Click 'Copy' next to any hash to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What is a hash used for?", a: "A hash is a fixed-length fingerprint of input data, used for verifying data integrity, checksums, and (with appropriately slow, salted algorithms — not these general-purpose ones) password storage." },
          { q: "Which algorithms does this tool support?", a: "SHA-1, SHA-256, and SHA-512, computed together every time. MD5 and SHA-384 aren't available, since this tool relies on the browser's Web Crypto API, which doesn't provide MD5." },
          { q: "Is my data uploaded to a server?", a: "No, hashing happens entirely in your browser using the Web Crypto API." },
          { q: "Can I hash a file instead of typed text?", a: "No — only text you type or paste into the box can be hashed; there's no file upload option." }
        ]}
        tips={[
          "Avoid SHA-1 for anything security-sensitive — it's included for compatibility with older systems, but SHA-256 or SHA-512 are the safer general-purpose choices.",
          "None of these are appropriate for hashing passwords directly — use a dedicated slow, salted algorithm (like bcrypt or Argon2) for that instead.",
          "To hash a file's contents, you'd need to extract the text first, since this tool only accepts typed or pasted text.",
          "Even a one-character difference in the input produces a completely different hash — useful for verifying exact text matches."
        ]}
      />
    </div>
  );
}
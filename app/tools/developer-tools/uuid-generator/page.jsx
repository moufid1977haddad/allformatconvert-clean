'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function UuidGeneratorPage() {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(1);
  const generateUuid = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(31));
    let i = 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = bytes[i++] % 16;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };
  const generate = () => {
    setUuids(Array.from({length: count}, generateUuid));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">UUID Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate unique UUIDs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Count</label><input type="number" min="1" max="20" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate</button>
          {uuids.length > 0 && <div className="space-y-2">{uuids.map((u,i) => <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="font-mono text-sm">{u}</span><button onClick={() => navigator.clipboard.writeText(u)} className="text-xs text-neutral-500 hover:text-white ml-2">Copy</button></div>)}</div>}
        </div>
      </div>
      <SeoContent
        title="UUID Generator"
        description="UUID Generator creates version 4 (random) UUIDs using the Web Crypto API's crypto.getRandomValues() for cryptographically strong randomness, entirely in your browser — nothing is uploaded to a server. It only generates version 4 UUIDs; there's no support for version 1 (timestamp-based), 3, or 5 (namespace-based) formats, and no format options like uppercase or no-hyphen output."
        howTo={[
          "Set how many UUIDs you want (1 to 20) in the Count field.",
          "Click 'Generate' to create that many random UUIDs.",
          "Click 'Copy' next to any UUID to copy it to your clipboard.",
          "Generating again replaces the current list — copy anything you need first."
        ]}
        faqs={[
          { q: "What is a UUID?", a: "A 128-bit identifier designed to be unique across systems without central coordination — commonly used for database keys, request IDs, and API resource identifiers." },
          { q: "Is the UUID Generator free to use?", a: "Yes, completely free with no registration required." },
          { q: "What UUID version does this generate?", a: "Only version 4 (random) UUIDs — versions 1, 3, and 5 aren't supported." },
          { q: "Are these UUIDs safe to use as unguessable tokens?", a: "Yes — they're generated with the Web Crypto API's cryptographically secure random number generator, not Math.random(), so they aren't predictable." }
        ]}
        tips={[
          "Copy each UUID you need right away, since generating a new batch replaces the current list without saving the old one.",
          "The maximum is 20 UUIDs per click; click 'Generate' again for more.",
          "All UUIDs are version 4 with standard lowercase, hyphenated formatting (8-4-4-4-12 hex digits).",
          "If you need UUID v1, v3, or v5, use a library or tool built for that specific version."
        ]}
      />
    </div>
  );
}
'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
export default function UuidGeneratorPage() {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(1);
  // P24 (03/10): uuidgenerator.net offers v7 (time-ordered: sorts by creation time, the best database key), v1, the nil
  // UUID and bulk lists; ours was v4 only, lowercase. v7 follows RFC 9562 §5.7 (48-bit Unix milliseconds, version 7,
  // 12-bit counter keeping several UUIDs of the same millisecond in order, variant, 62 random bits).
  const [version, setVersion] = useState('4');
  const [upper, setUpper] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);
  const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const dashed = (h) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  const v7 = (() => { let lastMs = -1, seq = 0; return () => {
    let ms = Date.now();
    if (ms <= lastMs) { seq++; if (seq > 0xfff) { lastMs++; seq = 0; } ms = lastMs; } else { lastMs = ms; seq = crypto.getRandomValues(new Uint16Array(1))[0] & 0x7ff; }
    const b = crypto.getRandomValues(new Uint8Array(16));
    for (let i = 0; i < 6; i++) b[i] = Math.floor(ms / 2 ** (8 * (5 - i))) & 0xff;
    b[6] = 0x70 | (seq >> 8); b[7] = seq & 0xff; b[8] = (b[8] & 0x3f) | 0x80;
    return dashed(hex(b));
  }; })();
  const format = (u) => { let s = hyphens ? u : u.replace(/-/g, ''); if (upper) s = s.toUpperCase(); return braces ? `{${s}}` : s; };
  const generateUuid = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(31));
    let i = 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = bytes[i++] % 16;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };
  const generate = () => {
    const n = Math.min(1000, Math.max(1, Math.round(Number(count)) || 1));
    const make = version === '7' ? v7 : version === 'nil' ? () => '00000000-0000-0000-0000-000000000000' : generateUuid;
    setUuids(Array.from({ length: version === 'nil' ? 1 : n }, () => format(make())));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">UUID Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate unique UUIDs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Count</label><input aria-label="Count" type="number" min="1" max="1000" value={count} onChange={e => setCount(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Version</span>
              <select id="uuid-version" value={version} onChange={e => setVersion(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2"><option value="4">v4 — random</option><option value="7">v7 — time-ordered (sorts by creation time)</option><option value="nil">Nil UUID (all zeros)</option></select></label>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2"><input id="uuid-upper" type="checkbox" checked={upper} onChange={e => setUpper(e.target.checked)} /> Uppercase</label>
              <label className="flex items-center gap-2"><input id="uuid-hyphens" type="checkbox" checked={hyphens} onChange={e => setHyphens(e.target.checked)} /> Hyphens</label>
              <label className="flex items-center gap-2"><input id="uuid-braces" type="checkbox" checked={braces} onChange={e => setBraces(e.target.checked)} /> {'{Braces}'} (GUID)</label>
            </div>
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">Generate</button>
          {uuids.length > 0 && <div className="space-y-2">{uuids.map((u,i) => <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="font-mono text-sm">{u}</span><button onClick={() => navigator.clipboard.writeText(u)} className="text-xs text-neutral-500 hover:text-white ml-2">Copy</button></div>)}</div>}
          {uuids.length > 0 && <TextDownload text={uuids.join('\n') + '\n'} name="uuids.txt" />}
        </div>
      </div>
      <SeoContent
        title="UUID Generator"
        description="UUID Generator creates version 4 (random) or version 7 (time-ordered) UUIDs, up to 1000 at a time, lowercase or uppercase, with or without hyphens or braces, using the Web Crypto API's crypto.getRandomValues() for cryptographically strong randomness, entirely in your browser — nothing is uploaded to a server. It only generates version 4 UUIDs; there's no support for version 1 (timestamp-based), 3, or 5 (namespace-based) formats, and no format options like uppercase or no-hyphen output."
        howTo={[
          "Set how many UUIDs you want (1 to 1000) and choose v4 (random), v7 (time-ordered) or the nil UUID, and the format.",
          "Click 'Generate' to create that many random UUIDs.",
          "Click 'Copy' next to any UUID to copy it to your clipboard.",
          "Generating again replaces the current list — copy anything you need first."
        ]}
        faqs={[
          { q: "What is a UUID?", a: "A 128-bit identifier designed to be unique across systems without central coordination — commonly used for database keys, request IDs, and API resource identifiers." },
          { q: "Is the UUID Generator free to use?", a: "Yes, completely free with no registration required." },
          { q: "What UUID version does this generate?", a: "Version 4 (random) and version 7 (RFC 9562: a millisecond timestamp first, so the UUIDs sort by creation time — a better database key than v4), plus the nil UUID. Versions 1, 3 and 5 aren't offered." },
          { q: "Are these UUIDs safe to use as unguessable tokens?", a: "Yes — they're generated with the Web Crypto API's cryptographically secure random number generator, not Math.random(), so they aren't predictable." }
        ]}
        tips={[
          "Copy each UUID you need right away, since generating a new batch replaces the current list without saving the old one.",
          "Up to 1000 UUIDs per click; the download button saves them all as a text file.",
          "Choose v7 for database primary keys: new rows land at the end of the index instead of at random places.",
          "Uppercase, no hyphens or {braces} match what some systems (Windows registry GUIDs, compact ids) expect."
        ]}
      />
    </div>
  );
}
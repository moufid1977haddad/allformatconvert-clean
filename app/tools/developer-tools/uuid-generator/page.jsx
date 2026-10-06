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
    if (String(n) !== String(count).trim()) setCount(n); // the count actually made is shown, never changed silently
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
        description={"UUID Generator creates universally unique identifiers in bulk, from 1 to 1000 per click. Version 4 draws 122 random bits from crypto.getRandomValues. Version 7 (RFC 9562) starts with the creation time in milliseconds, then a counter that keeps UUIDs made in the same millisecond in order, then random bits, so the values sort by creation time. The nil UUID is the all-zero value. Each can be shown in uppercase, without hyphens, or wrapped in braces as Windows GUIDs are written. Every UUID has its own copy button, and the whole list downloads as uuids.txt. Versions 1, 3 and 5 are not offered."}
        example={{
          caption: "Three v7 UUIDs made in one click by the page’s own code on 5 October 2026: the first at 23:53:33.378 UTC (01A10E7C-A9C2), the last two 7 ms later in the same millisecond (A9C9), so the counter goes from 763F to 7640.",
          inputLabel: "Settings",
          input: "Count: 3\nVersion: v7 — time-ordered (sorts by creation time)\nUppercase: on",
          outputLabel: "Generated",
          output: "01A10E7C-A9C2-71FE-80DC-FE755DC9B402\n01A10E7C-A9C9-763F-B7D8-A1053E7D9895\n01A10E7C-A9C9-7640-BC7C-6260183A54D4",
        }}
        howToTitle={"How to generate UUIDs in bulk"}
        howTo={[
          "Enter how many you need in \"Count\", from 1 to 1000.",
          "Choose the \"Version\": v4 for random IDs, v7 for IDs that sort by creation time, or the nil UUID.",
          "Tick \"Uppercase\", \"Hyphens\" or \"{Braces} (GUID)\" to match the format your system expects.",
          "Click \"Generate\", then \"Copy\" next to a UUID, or \"Download\" to save the whole list as uuids.txt.",
        ]}
        specs={[
          { label: "Versions", value: "v4 (random), v7 (time-ordered, RFC 9562) and the nil UUID" },
          { label: "Count per click", value: "1 to 1000; the nil UUID is always a single value" },
          { label: "Formats", value: "Lower or upper case, with or without hyphens, optional braces" },
          { label: "Randomness", value: "crypto.getRandomValues; a v4 UUID carries 122 random bits" },
          { label: "Download", value: "uuids.txt, one UUID per line" },
        ]}
        privacyTitle={"Where your UUIDs are generated"}
        privacy={"UUIDs are generated in your browser with crypto.getRandomValues and are not sent to our servers or recorded. A v7 UUID contains the time it was made, to the millisecond, so anyone who sees it can read when it was created; choose v4 when that matters. The list disappears on reload unless you download or copy it."}
        faqs={[
          { q: "Is v7 better than v4 for database keys?", a: "Yes, in most cases: its first 48 bits are the creation time, so new keys sort after older ones and are added at the end of an index ordered by key, instead of at random places. Use v4 when the creation time must not be visible." },
          { q: "Are these UUIDs safe to use as secret tokens?", a: "No, only v4 ones are: their 122 random bits come from the browser’s cryptographic generator. A v7 UUID reveals its creation time and, for IDs made in the same millisecond, a counter that goes up by one, so part of it can be guessed." },
          { q: "Can it output GUIDs with braces?", a: "Yes. Tick \"{Braces} (GUID)\" to wrap each value in curly braces, and \"Uppercase\" if your system expects capital letters, as in {01A10E7C-A9C2-71FE-80DC-FE755DC9B402}. The braces are added after the other options, so they also work with hyphens turned off." },
        ]}
        tips={[
          "Generating again replaces the list, so download uuids.txt first if you still need the earlier batch.",
        ]}
      />
    </div>
  );
}
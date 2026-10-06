'use client';
import { useState } from 'react';
import { stringify } from 'smol-toml';
import { parseJsonLossless, isLosslessNumber } from '../../../lib/jsonLossless';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JsonToTomlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const [tooBig, setTooBig] = useState([]);
  const convert = () => {
    let obj;
    try {
      // P24 (03/10): read without JSON.parse's rounding ({"id":12345678901234567890} came out as 12345678901234567168.0):
      // an integer is written digit for digit when TOML (64-bit) can hold it, else as a string, and said
      const tooBig = [];
      const LIMIT = 9223372036854775807n;
      const fix = (v, path) => {
        if (isLosslessNumber(v)) {
          if (v.isInteger) { const n = BigInt(v.source); if (n > LIMIT || n < -LIMIT - 1n) { tooBig.push(path || '(root)'); return v.source; } return n; }
          const d = Number(v.source); // a TOML float is a double: the closest double is TOML's own value
          if (!Number.isFinite(d) || (d === 0 && /[1-9]/.test(v.source.split(/e/i)[0]))) { tooBig.push(path || '(root)'); return v.source; } // 1e400 / 1e-400: beyond a double, kept as text
          return d;
        }
        if (typeof v === 'number' && Number.isInteger(v) && !Number.isSafeInteger(v)) return BigInt(v);
        if (Array.isArray(v)) return v.map((x, i) => fix(x, `${path}[${i}]`));
        if (v && typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = fix(v[k], path ? `${path}.${k}` : k); return o; }
        return v;
      };
      obj = fix(parseJsonLossless(input), '');
      setTooBig(tooBig);
    } catch(e) { setError('Invalid JSON'); return; }
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      setError('TOML documents are key/value tables at the top level -- wrap your JSON in an object (e.g. { "items": ... }) before converting.');
      return;
    }
    try {
      setOutput(stringify(obj));
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to TOML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to TOML format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TOML Output</label><TextArea aria-label="TOML Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.toml" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {tooBig.length > 0 && <p role="status" className="text-amber-800 bg-amber-50 rounded-lg p-2 text-center text-sm">Beyond what TOML numbers hold (integers up to 9,223,372,036,854,775,807, floats up to about 1.8e308): {tooBig.slice(0, 5).join(', ')}{tooBig.length > 5 ? '…' : ''} written as text (in quotes) to keep every digit.</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to TOML"
        description={"JSON to TOML writes a pasted JSON object as a TOML file, the format of Cargo.toml and pyproject.toml. Nested objects become [section] tables, arrays of objects become [[section]] arrays of tables, and other arrays stay inline. Strings, numbers and booleans keep their types; a date written as a JSON string stays a quoted string. TOML has no null, so a null value on a key is left out and a null inside an array stops the conversion. Integers beyond the TOML range are written as quoted text with a notice. smol-toml writes the TOML inside your browser tab."}
        example={SEO.example}
        howToTitle="How to convert JSON to TOML"
        howTo={[
          "Paste a JSON object, not an array, into \"JSON Input\".",
          "Click \"Convert\".",
          "Read the TOML in \"TOML Output\" and any notice about numbers written as text.",
          "Click \"Copy\", or \"Download\" to save data.toml.",
        ]}
        specs={[
          { label: "Input", value: "JSON object at the top level" },
          { label: "Output", value: "TOML text, file data.toml" },
          { label: "Integers", value: "up to 9,223,372,036,854,775,807; larger ones become quoted text" },
          { label: "null", value: "left out on a key, refused inside an array" },
        ]}
        privacy={"smol-toml writes the TOML in your browser; the JSON you paste is not uploaded, and the TOML stays on the page until you copy it or save data.toml. Error reports, whether or not a message is shown, carry the cleaned error text, the error type, the tool name and your browser name and version."}
        faqs={[
          { q: "Can TOML hold a JSON null?", a: "No. TOML has no null type, so a key whose value is null is simply left out. A null inside an array cannot be dropped without changing the array, so the tool stops with the message arrays cannot contain null or undefined values." },
          { q: "Can I convert a JSON array?", a: "No, not at the top level: a TOML document is a table of keys, so the tool asks you to wrap the array in an object, for example under an items key. Arrays inside the object are converted normally." },
          { q: "Are ISO date strings turned into TOML dates?", a: "No. JSON has no date type, so 2024-01-15 arrives as a string and is written in quotes, as the example shows. Remove the quotes by hand if you want a TOML date." },
          { q: "Are very large numbers kept?", a: "Yes, digit for digit. An integer above 9,223,372,036,854,775,807, or a float beyond the range of a double, cannot be a TOML number, so it is written as quoted text and a notice names the key." },
        ]}
        related={SEO.related}
      />
    </div>
  );
}

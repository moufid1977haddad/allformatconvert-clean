'use client';
import { useState } from 'react';
import { stringify } from 'smol-toml';
import { parseJsonLossless, isLosslessNumber } from '../../../lib/jsonLossless';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
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
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TOML Output</label><textarea aria-label="TOML Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
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
        description="JSON to TOML converts a JSON object into valid TOML using the smol-toml library, entirely in your browser — nothing is uploaded to a server. Nested objects convert into TOML tables at any depth, arrays become proper TOML array syntax (including arrays of tables), and numbers, booleans, and ISO date strings are typed correctly rather than left as quoted text."
        howTo={[
          "Paste a JSON object into the input box (the top level must be an object, not an array).",
          "Click 'Convert' to generate TOML text.",
          "The output is copy-paste-ready TOML, including nested tables and arrays.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={SEO.faqs}
        example={SEO.example}
        related={SEO.related}
        tips={[
          "Wrap top-level arrays in an object first (e.g. { \"items\": [...] }), since TOML itself has no concept of a top-level array.",
          "Remove any null values inside arrays before converting — TOML can't represent them there.",
          "ISO 8601 date strings in your JSON convert to TOML's native date-time type automatically.",
          "Always validate the output with a TOML linter or parser before using it in a real configuration file."
        ]}
      />
    </div>
  );
}

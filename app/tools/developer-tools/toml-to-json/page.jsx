'use client';
import { useState } from 'react';
import { parse } from 'smol-toml';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
export default function TomlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const [notice, setNotice] = useState('');
  // P24 (03/10): a 64-bit integer (9007199254740993) was refused ("cannot be represented losslessly") and inf / nan became
  // null without a word. Integers are now read exactly (BigInt when needed) and written digit for digit; inf / nan,
  // which JSON cannot hold, are written as null and said.
  const toJson = (v, ind, specials, path) => {
    if (typeof v === 'bigint') return v.toString();
    if (typeof v === 'number') { if (Number.isFinite(v)) return JSON.stringify(v); specials.push(path || '(root)'); return 'null'; }
    if (v && typeof v === 'object' && typeof v.toISOString === 'function') return JSON.stringify(v.toISOString());
    if (Array.isArray(v)) return v.length ? '[\n' + v.map((x, i) => ind + '  ' + toJson(x, ind + '  ', specials, `${path}[${i}]`)).join(',\n') + '\n' + ind + ']' : '[]';
    if (v && typeof v === 'object') { const k = Object.keys(v); return k.length ? '{\n' + k.map((key) => `${ind}  ${JSON.stringify(key)}: ${toJson(v[key], ind + '  ', specials, path ? `${path}.${key}` : key)}`).join(',\n') + '\n' + ind + '}' : '{}'; }
    return JSON.stringify(v);
  };
  const convert = () => {
    try {
      const obj = parse(input, { integersAsBigInt: 'asNeeded' });
      const specials = [];
      setOutput(toJson(obj, '', specials, ''));
      setNotice(specials.length ? `JSON has no infinity or NaN: ${specials.slice(0, 5).join(', ')}${specials.length > 5 ? '…' : ''} written as null.` : '');
      setError('');
    } catch(e) { setError('Invalid TOML' + (e?.message ? `: ${e.message}` : '')); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TOML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TOML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TOML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TOML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea aria-label="JSON Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.json" /></div>
          </div>
          {error && <p role="alert" className="text-red-400 text-center">{error}</p>}
          {notice && <p role="status" className="text-amber-800 bg-amber-50 rounded-lg p-2 text-center text-sm">{notice}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="TOML to JSON"
        description="TOML to JSON parses TOML using the smol-toml library and converts it to JSON, entirely in your browser — nothing is uploaded to a server. Nested tables (including [section.subsection] and arrays of tables), inline and multi-line arrays, and TOML's native date/time and number types all parse correctly, matching how a real TOML parser reads the file."
        howTo={[
          "Paste any valid TOML into the input box — flat, nested, or with arrays.",
          "Click 'Convert' to parse it into JSON.",
          "The output preserves nested tables, arrays, and native types (numbers, booleans, dates) correctly.",
          "Click 'Copy' to copy the JSON to your clipboard."
        ]}
        faqs={SEO.faqs}
        example={SEO.example}
        related={SEO.related}
        tips={[
          "Works on any valid TOML file, not just simple flat key-value pairs — nested tables and arrays of tables both convert correctly.",
          "TOML date/time values come through as ISO 8601 strings in the JSON, since JSON has no native date type.",
          "If conversion fails, the error message names the line where the parser got stuck, which is usually the fastest way to find a TOML syntax mistake.",
          "Review the output for very large integers — JSON numbers lose precision beyond 2^53, same limitation as any other JSON tool."
        ]}
      />
    </div>
  );
}

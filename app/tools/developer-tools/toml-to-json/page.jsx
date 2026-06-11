'use client';
import { useState } from 'react';
export default function TomlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = {};
      let currentSection = obj;
      input.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        if (line.startsWith('[')) {
          const key = line.slice(1,-1);
          obj[key] = {};
          currentSection = obj[key];
        } else if (line.includes('=')) {
          const eqIdx = line.indexOf('=');
          const k = line.slice(0, eqIdx).trim();
          const v = line.slice(eqIdx+1).trim().replace(/^"|"$/g,'');
          currentSection[k] = isNaN(v) ? v : Number(v);
        }
      });
      setOutput(JSON.stringify(obj, null, 2));
      setError('');
    } catch(e) { setError('Invalid TOML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TOML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TOML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TOML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TOML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
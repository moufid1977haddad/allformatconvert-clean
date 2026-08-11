'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function EnvToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toJson = () => {
    const obj = {};
    input.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) return;
      const k = line.slice(0, eqIdx).trim();
      const v = line.slice(eqIdx+1).trim().replace(/^"|"$/g,'').replace(/^'|'$/g,'');
      obj[k] = v;
    });
    setOutput(JSON.stringify(obj, null, 2));
  };
  const toEnv = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(Object.entries(obj).map(([k,v]) => k + '=' + v).join('\n'));
    } catch(e) { setOutput('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">.env to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert .env files to JSON and back</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="KEY=value..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={toJson} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">.env to JSON</button>
            <button onClick={toEnv} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">JSON to .env</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title=".env to JSON"
        description=".env to JSON parses KEY=VALUE lines into a JSON object, and can also convert a flat JSON object back into .env lines, entirely in your browser — nothing is uploaded to a server. It skips blank lines and lines starting with #, and strips a single matching pair of surrounding quotes from each value; it doesn't expand variable references like ${OTHER_VAR} or support multi-line values."
        howTo={[
          "Paste your .env content into the input box, or a flat JSON object to convert the other way.",
          "Click '.env to JSON' or 'JSON to .env' depending on the direction you need.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is .env to JSON free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What .env syntax does it understand?", a: "KEY=VALUE lines, blank lines, and # comments (both ignored). A single pair of surrounding single or double quotes is stripped from each value." },
          { q: "Does it expand variable references like ${OTHER_VAR}?", a: "No, values are taken literally as plain text — variable interpolation isn't resolved." },
          { q: "Is my data uploaded to a server?", a: "No, parsing and conversion happen entirely in your browser." }
        ]}
        tips={[
          "Every value becomes a string in the resulting JSON, even ones that look numeric or boolean — convert types yourself if your application needs them typed.",
          "JSON to .env only works with a flat JSON object; nested objects or arrays as values will be stringified oddly rather than expanded.",
          "Comments and blank lines are dropped when converting .env to JSON, so JSON to .env won't reproduce them.",
          "Since output may contain secrets like API keys, avoid pasting it somewhere it could be logged or committed to version control."
        ]}
      />
    </div>
  );
}
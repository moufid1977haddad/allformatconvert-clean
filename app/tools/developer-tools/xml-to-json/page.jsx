'use client';
import { useState } from 'react';
export default function XmlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(input, 'text/xml');
      const xmlToObj = (node) => {
        if (node.nodeType === 3) return node.nodeValue.trim();
        const obj = {};
        for (const child of node.childNodes) {
          const val = xmlToObj(child);
          if (val === '') continue;
          if (obj[child.nodeName]) {
            if (!Array.isArray(obj[child.nodeName])) obj[child.nodeName] = [obj[child.nodeName]];
            obj[child.nodeName].push(val);
          } else obj[child.nodeName] = val;
        }
        return obj;
      };
      setOutput(JSON.stringify(xmlToObj(xml.documentElement), null, 2));
      setError('');
    } catch(e) { setError('Invalid XML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">XML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert XML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">XML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
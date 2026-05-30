const fs = require('fs');
const path = require('path');

const tools = {
  'xml-to-json': `'use client';
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">XML to JSON</h1>
        <p className="text-neutral-400 text-center mb-8">Convert XML to JSON format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">XML Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'json-to-xml': `'use client';
import { useState } from 'react';
export default function JsonToXmlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const toXml = (obj, root = 'root') => {
        if (typeof obj !== 'object') return \`<\${root}>\${obj}</\${root}>\`;
        const inner = Object.entries(obj).map(([k,v]) => toXml(v, k)).join('');
        return \`<\${root}>\${inner}</\${root}>\`;
      };
      setOutput('<?xml version="1.0" encoding="UTF-8"?>\\n' + toXml(obj));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to XML</h1>
        <p className="text-neutral-400 text-center mb-8">Convert JSON to XML format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">XML Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'json-formatter': `'use client';
import { useState } from 'react';
export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const format = () => { try { setOutput(JSON.stringify(JSON.parse(input), null, 2)); setError(''); } catch(e) { setError('Invalid JSON'); } };
  const minify = () => { try { setOutput(JSON.stringify(JSON.parse(input))); setError(''); } catch(e) { setError('Invalid JSON'); } };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON Formatter</h1>
        <p className="text-neutral-400 text-center mb-8">Format and validate JSON</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'base64-encoder': `'use client';
import { useState } from 'react';
export default function Base64EncoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => { try { setOutput(btoa(input)); } catch(e) { setOutput('Error encoding'); } };
  const decode = () => { try { setOutput(atob(input)); } catch(e) { setOutput('Invalid Base64'); } };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Base64 Encoder</h1>
        <p className="text-neutral-400 text-center mb-8">Encode and decode Base64</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste text here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'hash-generator': `'use client';
import { useState } from 'react';
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hash Generator</h1>
        <p className="text-neutral-400 text-center mb-8">Generate SHA-1, SHA-256, SHA-512 hashes</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Enter text to hash..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={generate} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Generate Hashes</button>
          {hashes && ['sha1','sha256','sha512'].map(k => (
            <div key={k} className="bg-neutral-800 rounded-xl p-4">
              <div className="text-neutral-400 text-xs mb-1 uppercase">{k}</div>
              <div className="font-mono text-xs break-all text-indigo-400">{hashes[k]}</div>
              <button onClick={() => navigator.clipboard.writeText(hashes[k])} className="text-xs text-neutral-500 hover:text-neutral-300 mt-1">Copy</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,

  'regex-tester': `'use client';
import { useState } from 'react';
export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [matches, setMatches] = useState(null);
  const test = () => {
    try {
      const regex = new RegExp(pattern, flags);
      const found = [...text.matchAll(new RegExp(pattern, 'g'))];
      setMatches({ count: found.length, matches: found.map(m => m[0]), isMatch: regex.test(text) });
    } catch(e) { setMatches({ error: e.message }); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Regex Tester</h1>
        <p className="text-neutral-400 text-center mb-8">Test regular expressions</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3"><label className="block text-sm text-neutral-400 mb-1">Pattern</label><input type="text" value={pattern} onChange={e => setPattern(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-mono" placeholder="Enter regex pattern..." /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Flags</label><input type="text" value={flags} onChange={e => setFlags(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-mono" placeholder="gi" /></div>
          </div>
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Enter text to test..." value={text} onChange={e => setText(e.target.value)} />
          <button onClick={test} disabled={!pattern || !text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Test</button>
          {matches && (matches.error ? <p className="text-red-400 text-center">{matches.error}</p> : <div className="bg-neutral-800 rounded-xl p-4 space-y-2"><div className={matches.isMatch ? 'text-green-400' : 'text-red-400'} >{matches.isMatch ? 'Match found!' : 'No match'}</div><div className="text-neutral-400 text-sm">{matches.count} match(es)</div>{matches.matches.map((m,i) => <div key={i} className="font-mono text-sm bg-neutral-700 rounded p-2">{m}</div>)}</div>)}
        </div>
      </div>
    </div>
  );
}`,

  'uuid-generator': `'use client';
import { useState } from 'react';
export default function UuidGeneratorPage() {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(1);
  const generate = () => {
    const newUuids = Array.from({length: count}, () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }));
    setUuids(newUuids);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">UUID Generator</h1>
        <p className="text-neutral-400 text-center mb-8">Generate unique UUIDs</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div><label className="block text-sm text-neutral-400 mb-1">Count</label><input type="number" min="1" max="20" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate</button>
          {uuids.length > 0 && <div className="space-y-2">{uuids.map((u,i) => <div key={i} className="flex justify-between items-center bg-neutral-800 rounded-lg p-3"><span className="font-mono text-sm">{u}</span><button onClick={() => navigator.clipboard.writeText(u)} className="text-xs text-neutral-400 hover:text-white ml-2">Copy</button></div>)}</div>}
        </div>
      </div>
    </div>
  );
}`,

  'password-generator': `'use client';
import { useState } from 'react';
export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const generate = () => {
    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) return;
    setPassword(Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Password Generator</h1>
        <p className="text-neutral-400 text-center mb-8">Generate secure passwords</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div><label className="block text-sm text-neutral-400 mb-1">Length: {length}</label><input type="range" min="8" max="64" value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full" /></div>
          <div className="grid grid-cols-2 gap-3">
            {[['Uppercase', upper, setUpper],['Lowercase', lower, setLower],['Numbers', numbers, setNumbers],['Symbols', symbols, setSymbols]].map(([label, val, set]) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer bg-neutral-800 rounded-lg p-3"><input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="w-4 h-4" /><span>{label}</span></label>
            ))}
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate Password</button>
          {password && <div className="space-y-2"><div className="bg-neutral-800 rounded-xl p-4 font-mono text-center break-all text-indigo-400">{password}</div><button onClick={() => navigator.clipboard.writeText(password)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'timestamp-converter': `'use client';
import { useState } from 'react';
export default function TimestampConverterPage() {
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState('');
  const toDate = () => { const d = new Date(parseInt(timestamp) * 1000); setDate(d.toLocaleString()); };
  const toTimestamp = () => { const d = new Date(date); setTimestamp(Math.floor(d.getTime() / 1000).toString()); };
  const now = () => { const t = Math.floor(Date.now() / 1000); setTimestamp(t.toString()); setDate(new Date(t * 1000).toLocaleString()); };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Timestamp Converter</h1>
        <p className="text-neutral-400 text-center mb-8">Convert Unix timestamps to dates</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <button onClick={now} className="w-full bg-neutral-700 hover:bg-neutral-600 rounded-xl py-2 font-semibold transition">Use Current Time</button>
          <div><label className="block text-sm text-neutral-400 mb-1">Unix Timestamp</label><div className="flex gap-2"><input type="text" value={timestamp} onChange={e => setTimestamp(e.target.value)} className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-mono" placeholder="1234567890" /><button onClick={toDate} className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 font-semibold transition">Convert</button></div></div>
          <div><label className="block text-sm text-neutral-400 mb-1">Date and Time</label><div className="flex gap-2"><input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg p-3" /><button onClick={toTimestamp} className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-4 font-semibold transition">Convert</button></div></div>
          {timestamp && date && <div className="bg-neutral-800 rounded-xl p-4 text-center"><div className="text-indigo-400 font-mono">{timestamp}</div><div className="text-neutral-400 text-sm mt-1">{date}</div></div>}
        </div>
      </div>
    </div>
  );
}`,

  'color-picker': `'use client';
import { useState } from 'react';
export default function ColorPickerPage() {
  const [color, setColor] = useState('#3b82f6');
  const hexToRgb = (hex) => { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null; };
  const rgb = hexToRgb(color);
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Color Picker</h1>
        <p className="text-neutral-400 text-center mb-8">Pick and convert colors</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="flex justify-center"><div className="w-48 h-48 rounded-xl border-4 border-neutral-700" style={{backgroundColor: color}} /></div>
          <div className="flex justify-center"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer border-0" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-800 rounded-xl p-3 text-center"><div className="text-neutral-400 text-xs mb-1">HEX</div><div className="font-mono text-indigo-400">{color}</div><button onClick={() => navigator.clipboard.writeText(color)} className="text-xs text-neutral-500 hover:text-neutral-300">Copy</button></div>
            <div className="bg-neutral-800 rounded-xl p-3 text-center"><div className="text-neutral-400 text-xs mb-1">RGB</div><div className="font-mono text-indigo-400 text-xs">{rgb ? \`\${rgb.r},\${rgb.g},\${rgb.b}\` : ''}</div><button onClick={() => navigator.clipboard.writeText(rgb ? \`rgb(\${rgb.r},\${rgb.g},\${rgb.b})\` : '')} className="text-xs text-neutral-500 hover:text-neutral-300">Copy</button></div>
            <div className="bg-neutral-800 rounded-xl p-3 text-center"><div className="text-neutral-400 text-xs mb-1">Input</div><input type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full bg-neutral-700 rounded p-1 text-center font-mono text-sm" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'url-parser': `'use client';
import { useState } from 'react';
export default function UrlParserPage() {
  const [url, setUrl] = useState('');
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const parse = () => {
    try {
      const u = new URL(url);
      const params = {};
      u.searchParams.forEach((v,k) => params[k] = v);
      setParsed({ protocol: u.protocol, hostname: u.hostname, port: u.port, pathname: u.pathname, search: u.search, hash: u.hash, params });
      setError('');
    } catch(e) { setError('Invalid URL'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Parser</h1>
        <p className="text-neutral-400 text-center mb-8">Parse and analyze URLs</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-mono" placeholder="https://example.com/path?key=value#hash" />
          <button onClick={parse} disabled={!url} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Parse URL</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {parsed && <div className="space-y-2">{Object.entries(parsed).filter(([k]) => k !== 'params').map(([k,v]) => <div key={k} className="flex gap-3 bg-neutral-800 rounded-lg p-3"><span className="text-neutral-400 text-sm w-24">{k}</span><span className="font-mono text-sm text-indigo-400 break-all">{v || '—'}</span></div>)}{Object.keys(parsed.params).length > 0 && <div className="bg-neutral-800 rounded-lg p-3"><div className="text-neutral-400 text-sm mb-2">Query Params</div>{Object.entries(parsed.params).map(([k,v]) => <div key={k} className="flex gap-2 text-sm"><span className="text-green-400">{k}</span><span className="text-neutral-400">=</span><span className="text-indigo-400">{v}</span></div>)}</div>}</div>}
        </div>
      </div>
    </div>
  );
}`,

  'csv-to-json': `'use client';
import { useState } from 'react';
export default function CsvToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const lines = input.trim().split('\\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const result = lines.slice(1).map(line => { const vals = line.split(','); return Object.fromEntries(headers.map((h,i) => [h, vals[i]?.trim() || ''])); });
      setOutput(JSON.stringify(result, null, 2));
      setError('');
    } catch(e) { setError('Invalid CSV'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to JSON</h1>
        <p className="text-neutral-400 text-center mb-8">Convert CSV to JSON format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">CSV Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="name,age,city..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'json-to-csv': `'use client';
import { useState } from 'react';
export default function JsonToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data)) throw new Error('JSON must be an array');
      const headers = Object.keys(data[0]);
      const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h] ?? '').join(','))].join('\\n');
      setOutput(csv);
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to CSV</h1>
        <p className="text-neutral-400 text-center mb-8">Convert JSON to CSV format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='[{"name":"John","age":30}]' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">CSV Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'html-encoder': `'use client';
import { useState } from 'react';
export default function HtmlEncoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => setOutput(input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'));
  const decode = () => setOutput(input.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"));
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Encoder</h1>
        <p className="text-neutral-400 text-center mb-8">Encode and decode HTML entities</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'jwt-decoder': `'use client';
import { useState } from 'react';
export default function JwtDecoderPage() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');
  const decode = () => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const header = JSON.parse(atob(parts[0].replace(/-/g,'+').replace(/_/g,'/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
      setDecoded({ header, payload });
      setError('');
    } catch(e) { setError('Invalid JWT token'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JWT Decoder</h1>
        <p className="text-neutral-400 text-center mb-8">Decode and inspect JWT tokens</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-32 resize-none font-mono" placeholder="Paste JWT token here..." value={token} onChange={e => setToken(e.target.value)} />
          <button onClick={decode} disabled={!token} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Decode</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {decoded && ['header','payload'].map(k => <div key={k} className="bg-neutral-800 rounded-xl p-4"><div className="text-neutral-400 text-sm mb-2 uppercase">{k}</div><pre className="font-mono text-sm text-indigo-400 overflow-x-auto">{JSON.stringify(decoded[k], null, 2)}</pre></div>)}
        </div>
      </div>
    </div>
  );
}`,

  'markdown-editor': `'use client';
import { useState } from 'react';
export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState('# Hello World\\n\\nStart writing **markdown** here...\\n\\n- Item 1\\n- Item 2\\n- Item 3');
  const toHtml = (md) => md.replace(/^### (.*$)/gm,'<h3>$1</h3>').replace(/^## (.*$)/gm,'<h2>$1</h2>').replace(/^# (.*$)/gm,'<h1>$1</h1>').replace(/\\*\\*(.*?)\\*\\*/g,'<strong>$1</strong>').replace(/\\*(.*?)\\*/g,'<em>$1</em>').replace(/^- (.*$)/gm,'<li>$1</li>').replace(/(<li>.*<\\/li>)/gs,'<ul>$1</ul>').replace(/\\n/g,'<br>');
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown Editor</h1>
        <p className="text-neutral-400 text-center mb-8">Write and preview Markdown in real time</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-neutral-400 mb-1">Markdown</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-96 resize-none font-mono" value={markdown} onChange={e => setMarkdown(e.target.value)} /></div>
          <div><label className="block text-sm text-neutral-400 mb-1">Preview</label><div className="w-full bg-white rounded-xl p-4 h-96 overflow-y-auto text-neutral-900 prose prose-sm" dangerouslySetInnerHTML={{__html: toHtml(markdown)}} /></div>
        </div>
      </div>
    </div>
  );
}`,

  'tsv-to-csv': `'use client';
import { useState } from 'react';
export default function TsvToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => setOutput(input.split('\\n').map(line => line.split('\\t').join(',')).join('\\n'));
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TSV to CSV</h1>
        <p className="text-neutral-400 text-center mb-8">Convert TSV to CSV format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">TSV Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TSV here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">CSV Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'json-minifier': `'use client';
import { useState } from 'react';
export default function JsonMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const minify = () => { try { setOutput(JSON.stringify(JSON.parse(input))); setError(''); } catch(e) { setError('Invalid JSON'); } };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON Minifier</h1>
        <p className="text-neutral-400 text-center mb-8">Minify JSON data</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Minified Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
          {output && <p className="text-neutral-400 text-sm text-center">Saved {input.length - output.length} characters ({Math.round((1 - output.length/input.length)*100)}%)</p>}
        </div>
      </div>
    </div>
  );
}`,

  'url-encoder': `'use client';
import { useState } from 'react';
export default function UrlEncoderDevPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => { try { setOutput(encodeURIComponent(input)); } catch(e) { setOutput('Error'); } };
  const decode = () => { try { setOutput(decodeURIComponent(input)); } catch(e) { setOutput('Invalid URL encoding'); } };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Encoder</h1>
        <p className="text-neutral-400 text-center mb-8">Encode and decode URLs</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste URL here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'css-formatter': `'use client';
import { useState } from 'react';
export default function CssFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let css = input.replace(/\\s+/g,' ').replace(/;/g,';\\n  ').replace(/{/g,' {\\n  ').replace(/}/g,'\\n}\\n');
    setOutput(css.trim());
  };
  const minify = () => setOutput(input.replace(/\\s+/g,' ').replace(/\\s*{\\s*/g,'{').replace(/\\s*}\\s*/g,'}').replace(/\\s*;\\s*/g,';').trim());
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSS Formatter</h1>
        <p className="text-neutral-400 text-center mb-8">Format and beautify CSS</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'html-formatter': `'use client';
import { useState } from 'react';
export default function HtmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let indent = 0;
    const lines = input.replace(/></g,'>\\n<').split('\\n');
    const formatted = lines.map(line => {
      if (line.match(/^<\\//)) indent--;
      const result = '  '.repeat(Math.max(0,indent)) + line.trim();
      if (line.match(/^<[^/][^>]*[^/]>/) && !line.match(/^<(br|hr|img|input|link|meta)/i)) indent++;
      return result;
    });
    setOutput(formatted.join('\\n'));
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Formatter</h1>
        <p className="text-neutral-400 text-center mb-8">Format and beautify HTML</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'js-minifier': `'use client';
import { useState } from 'react';
export default function JsMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const minify = () => {
    const minified = input.replace(/\\/\\/[^\\n]*/g,'').replace(/\\/\\*[\\s\\S]*?\\*\\//g,'').replace(/\\s+/g,' ').replace(/\\s*([{}();,=+\\-*/<>!&|])\\s*/g,'$1').trim();
    setOutput(minified);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JS Minifier</h1>
        <p className="text-neutral-400 text-center mb-8">Minify JavaScript code</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Minified Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
          {output && <p className="text-neutral-400 text-sm text-center">Saved {input.length - output.length} characters</p>}
        </div>
      </div>
    </div>
  );
}`,

  'api-tester': `'use client';
import { useState } from 'react';
export default function ApiTesterPage() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [headers, setHeaders] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const send = async () => {
    setLoading(true);
    try {
      const opts = { method, headers: { 'Content-Type': 'application/json', ...(headers ? JSON.parse(headers) : {}) } };
      if (body && method !== 'GET') opts.body = body;
      const res = await fetch(url, opts);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      setResponse({ status: res.status, statusText: res.statusText, data });
    } catch(e) { setResponse({ error: e.message }); }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">API Tester</h1>
        <p className="text-neutral-400 text-center mb-8">Test REST API endpoints</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="flex gap-3">
            <select value={method} onChange={e => setMethod(e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-semibold">
              {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
            </select>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-mono" placeholder="https://api.example.com/endpoint" />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Headers (JSON)</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm h-16 resize-none font-mono" placeholder='{"Authorization": "Bearer token"}' value={headers} onChange={e => setHeaders(e.target.value)} /></div>
          {method !== 'GET' && <div><label className="block text-sm text-neutral-400 mb-1">Body</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm h-32 resize-none font-mono" placeholder='{"key": "value"}' value={body} onChange={e => setBody(e.target.value)} /></div>}
          <button onClick={send} disabled={!url || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">{loading ? 'Sending...' : 'Send Request'}</button>
          {response && <div className="bg-neutral-800 rounded-xl p-4 space-y-2"><div className={response.error ? 'text-red-400' : response.status < 400 ? 'text-green-400' : 'text-yellow-400'}>{response.error ? response.error : \`\${response.status} \${response.statusText}\`}</div><pre className="font-mono text-sm overflow-x-auto text-indigo-400">{JSON.stringify(response.data, null, 2)}</pre></div>}
        </div>
      </div>
    </div>
  );
}`,

  'number-base-converter': `'use client';
import { useState } from 'react';
export default function NumberBaseConverterDevPage() {
  const [value, setValue] = useState('');
  const [fromBase, setFromBase] = useState('10');
  const convert = (base) => { try { const d = parseInt(value, parseInt(fromBase)); return isNaN(d) ? 'Invalid' : d.toString(parseInt(base)).toUpperCase(); } catch { return 'Invalid'; } };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number Base Converter</h1>
        <p className="text-neutral-400 text-center mb-8">Convert between binary, decimal, octal and hex</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Value</label><input type="text" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-mono" placeholder="Enter value..." /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">From Base</label><select value={fromBase} onChange={e => setFromBase(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3"><option value="2">Binary</option><option value="8">Octal</option><option value="10">Decimal</option><option value="16">Hexadecimal</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['2','Binary'],['8','Octal'],['10','Decimal'],['16','Hexadecimal']].map(([base,label]) => <div key={base} className="bg-neutral-800 rounded-xl p-4"><div className="text-neutral-400 text-sm mb-1">{label}</div><div className="font-mono text-indigo-400 text-lg font-bold">{value ? convert(base) : '—'}</div></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'yaml-to-json': `'use client';
import { useState } from 'react';
export default function YamlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const lines = input.split('\\n');
      const obj = {};
      lines.forEach(line => {
        const match = line.match(/^([\\w-]+):\\s*(.*)$/);
        if (match) obj[match[1]] = isNaN(match[2]) ? match[2] : Number(match[2]);
      });
      setOutput(JSON.stringify(obj, null, 2));
      setError('');
    } catch(e) { setError('Invalid YAML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">YAML to JSON</h1>
        <p className="text-neutral-400 text-center mb-8">Convert YAML to JSON format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">YAML Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="name: John&#10;age: 30" value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'json-to-yaml': `'use client';
import { useState } from 'react';
export default function JsonToYamlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const toYaml = (o, indent = 0) => Object.entries(o).map(([k,v]) => typeof v === 'object' && v !== null ? \`\${'  '.repeat(indent)}\${k}:\\n\${toYaml(v, indent+1)}\` : \`\${'  '.repeat(indent)}\${k}: \${v}\`).join('\\n');
      setOutput(toYaml(obj));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to YAML</h1>
        <p className="text-neutral-400 text-center mb-8">Convert JSON to YAML format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name": "John"}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">YAML Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'aspect-ratio': `'use client';
import { useState } from 'react';
export default function AspectRatioPage() {
  const [w, setW] = useState('1920');
  const [h, setH] = useState('1080');
  const gcd = (a,b) => b === 0 ? a : gcd(b, a%b);
  const g = gcd(parseInt(w)||1, parseInt(h)||1);
  const ratio = \`\${(parseInt(w)||1)/g}:\${(parseInt(h)||1)/g}\`;
  const decimal = ((parseInt(w)||1)/(parseInt(h)||1)).toFixed(4);
  const presets = [['16:9','1920x1080'],['4:3','1024x768'],['1:1','1080x1080'],['21:9','2560x1080'],['9:16','1080x1920']];
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Aspect Ratio Calculator</h1>
        <p className="text-neutral-400 text-center mb-8">Calculate aspect ratios for any dimensions</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Width</label><input type="number" value={w} onChange={e => setW(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Height</label><input type="number" value={h} onChange={e => setH(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3" /></div>
          </div>
          <div className="bg-neutral-800 rounded-xl p-6 text-center space-y-2">
            <div className="text-4xl font-bold text-indigo-400">{ratio}</div>
            <div className="text-neutral-400">Decimal: {decimal}</div>
          </div>
          <div><label className="block text-sm text-neutral-400 mb-2">Common Presets</label><div className="grid grid-cols-3 gap-2">{presets.map(([r,d]) => <button key={r} onClick={() => { const [pw,ph] = d.split('x'); setW(pw); setH(ph); }} className="bg-neutral-800 hover:bg-neutral-700 rounded-lg p-2 text-sm transition"><div className="font-semibold">{r}</div><div className="text-neutral-400 text-xs">{d}</div></button>)}</div></div>
        </div>
      </div>
    </div>
  );
}`,

  'cron-expression': `'use client';
import { useState } from 'react';
export default function CronExpressionPage() {
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');
  const [weekday, setWeekday] = useState('*');
  const cron = \`\${minute} \${hour} \${day} \${month} \${weekday}\`;
  const presets = [['Every minute','* * * * *'],['Every hour','0 * * * *'],['Every day at midnight','0 0 * * *'],['Every week','0 0 * * 0'],['Every month','0 0 1 * *'],['Every year','0 0 1 1 *']];
  const applyPreset = (p) => { const parts = p.split(' '); setMinute(parts[0]); setHour(parts[1]); setDay(parts[2]); setMonth(parts[3]); setWeekday(parts[4]); };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Cron Expression Builder</h1>
        <p className="text-neutral-400 text-center mb-8">Build and validate cron expressions</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {[['Minute',minute,setMinute],['Hour',hour,setHour],['Day',day,setDay],['Month',month,setMonth],['Weekday',weekday,setWeekday]].map(([label,val,set]) => <div key={label}><label className="block text-xs text-neutral-400 mb-1">{label}</label><input type="text" value={val} onChange={e => set(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 font-mono text-center" /></div>)}
          </div>
          <div className="bg-neutral-800 rounded-xl p-4 text-center"><div className="font-mono text-2xl text-indigo-400">{cron}</div></div>
          <button onClick={() => navigator.clipboard.writeText(cron)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
          <div><label className="block text-sm text-neutral-400 mb-2">Presets</label><div className="grid grid-cols-2 gap-2">{presets.map(([label,p]) => <button key={label} onClick={() => applyPreset(p)} className="bg-neutral-800 hover:bg-neutral-700 rounded-lg p-2 text-sm text-left transition"><div className="font-semibold">{label}</div><div className="text-neutral-400 font-mono text-xs">{p}</div></button>)}</div></div>
        </div>
      </div>
    </div>
  );
}`,
};

const basePath = 'app/tools/developer-tools';

Object.entries(tools).forEach(([name, content]) => {
  const filePath = path.join(basePath, name, 'page.jsx');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Created: ${filePath}`);
});

console.log('All developer tools created!');
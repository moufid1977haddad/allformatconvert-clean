const fs = require('fs');
const path = require('path');

const basePath = 'app/tools/developer-tools';

const tools = {
  'csv-to-tsv': `'use client';
import { useState } from 'react';
export default function CsvToTsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => setOutput(input.split('\\n').map(line => line.split(',').join('\\t')).join('\\n'));
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to TSV</h1>
        <p className="text-neutral-400 text-center mb-8">Convert CSV to TSV format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">CSV Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSV here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">TSV Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'excel-to-json': `'use client';
import { useState, useRef } from 'react';
export default function ExcelToJsonPage() {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const inputRef = useRef();
  const convert = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('Converting...');
    try {
      const XLSX = (await import('xlsx')).default;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const result = {};
      workbook.SheetNames.forEach(name => { result[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]); });
      setOutput(JSON.stringify(result, null, 2));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Excel to JSON</h1>
        <p className="text-neutral-400 text-center mb-8">Convert Excel files to JSON</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click or drop an Excel file here</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={convert} />
          </div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'excel-to-csv': `'use client';
import { useState, useRef } from 'react';
export default function ExcelToCsvPage() {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const inputRef = useRef();
  const convert = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('Converting...');
    try {
      const XLSX = (await import('xlsx')).default;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      setOutput(XLSX.utils.sheet_to_csv(sheet));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Excel to CSV</h1>
        <p className="text-neutral-400 text-center mb-8">Convert Excel files to CSV</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">Click or drop an Excel file here</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={convert} />
          </div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'csv-to-excel': `'use client';
import { useState } from 'react';
export default function CsvToExcelPage() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const convert = async () => {
    if (!input) return;
    setStatus('Converting...');
    try {
      const XLSX = (await import('xlsx')).default;
      const ws = XLSX.utils.aoa_to_sheet(input.split('\\n').map(r => r.split(',')));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'converted.xlsx');
      setStatus('Downloaded!');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to Excel</h1>
        <p className="text-neutral-400 text-center mb-8">Convert CSV to Excel format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste CSV here..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={convert} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert and Download</button>
          {status && <p className="text-center text-green-400">{status}</p>}
        </div>
      </div>
    </div>
  );
}`,

  'toml-to-json': `'use client';
import { useState } from 'react';
export default function TomlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = {};
      let currentSection = obj;
      input.split('\\n').forEach(line => {
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TOML to JSON</h1>
        <p className="text-neutral-400 text-center mb-8">Convert TOML to JSON format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">TOML Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TOML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
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

  'json-to-toml': `'use client';
import { useState } from 'react';
export default function JsonToTomlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const lines = [];
      Object.entries(obj).forEach(([k,v]) => {
        if (typeof v === 'object' && v !== null) {
          lines.push('[' + k + ']');
          Object.entries(v).forEach(([k2,v2]) => {
            const val = typeof v2 === 'string' ? '"' + v2 + '"' : v2;
            lines.push(k2 + ' = ' + val);
          });
        } else {
          const val = typeof v === 'string' ? '"' + v + '"' : v;
          lines.push(k + ' = ' + val);
        }
      });
      setOutput(lines.join('\\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to TOML</h1>
        <p className="text-neutral-400 text-center mb-8">Convert JSON to TOML format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">TOML Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'javascript-formatter': `'use client';
import { useState } from 'react';
export default function JavascriptFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let indent = 0;
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === '{' || ch === '[') { result += ch + '\\n' + '  '.repeat(++indent); }
      else if (ch === '}' || ch === ']') { result += '\\n' + '  '.repeat(--indent) + ch; }
      else if (ch === ';') { result += ch + '\\n' + '  '.repeat(indent); }
      else if (ch === ',') { result += ch + '\\n' + '  '.repeat(indent); }
      else { result += ch; }
    }
    setOutput(result.trim());
  };
  const minify = () => setOutput(input.replace(/\\s+/g,' ').replace(/\\s*([{}\\[\\]();,])\\s*/g,'$1').trim());
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JavaScript Formatter</h1>
        <p className="text-neutral-400 text-center mb-8">Format and beautify JavaScript code</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
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

  'scss-to-css': `'use client';
import { useState } from 'react';
export default function ScssToCssPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => {
    let css = input.replace(/\\/\\/[^\\n]*/g,'').replace(/&:([\\w-]+)/g,':$1').replace(/&\\.([\\w-]+)/g,'.$1');
    setOutput(css.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SCSS to CSS</h1>
        <p className="text-neutral-400 text-center mb-8">Convert SCSS to CSS format</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">SCSS Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SCSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">CSS Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'typescript-to-js': `'use client';
import { useState } from 'react';
export default function TypescriptToJsPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => {
    let js = input;
    js = js.replace(/:\\s*[\\w<>\\[\\]|&,\\s]+(?=[\\s]*[=,);{])/g,'');
    js = js.replace(/interface\\s+\\w+\\s*\\{[^}]*\\}/g,'');
    js = js.replace(/type\\s+\\w+\\s*=\\s*[^;]+;/g,'');
    js = js.replace(/<[\\w,\\s]+>/g,'');
    setOutput(js.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TypeScript to JavaScript</h1>
        <p className="text-neutral-400 text-center mb-8">Strip TypeScript types from code</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">TypeScript Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TypeScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">JavaScript Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'xml-formatter': `'use client';
import { useState } from 'react';
export default function XmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const format = () => {
    try {
      let indent = 0;
      const formatted = input.replace(/></g,'>\\n<').split('\\n').map(line => {
        if (line.match(/^<\\//)) indent = Math.max(0, indent-1);
        const result = '  '.repeat(indent) + line.trim();
        if (line.match(/^<[^/!][^>]*[^/]>$/)) indent++;
        return result;
      }).join('\\n');
      setOutput(formatted);
      setError('');
    } catch(e) { setError('Error formatting XML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">XML Formatter</h1>
        <p className="text-neutral-400 text-center mb-8">Format and beautify XML</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'sql-formatter': `'use client';
import { useState } from 'react';
export default function SqlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const keywords = ['SELECT','FROM','WHERE','AND','OR','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','DROP','JOIN','LEFT','RIGHT','INNER','ON','GROUP BY','ORDER BY','HAVING','LIMIT'];
  const format = () => {
    let sql = input.trim();
    keywords.forEach(kw => { sql = sql.replace(new RegExp('\\\\b' + kw + '\\\\b','gi'),'\\n' + kw); });
    sql = sql.replace(/,/g,',\\n  ');
    setOutput(sql.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SQL Formatter</h1>
        <p className="text-neutral-400 text-center mb-8">Format and beautify SQL queries</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SQL here..." value={input} onChange={e => setInput(e.target.value)} /></div>
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

  'markdown-previewer': `'use client';
import { useState } from 'react';
export default function MarkdownPreviewerPage() {
  const [markdown, setMarkdown] = useState('# Hello World\\n\\nStart writing **markdown** here...');
  const toHtml = (md) => md.replace(/^### (.*)/gm,'<h3>$1</h3>').replace(/^## (.*)/gm,'<h2>$1</h2>').replace(/^# (.*)/gm,'<h1>$1</h1>').replace(/\\*\\*(.*?)\\*\\*/g,'<strong>$1</strong>').replace(/\\*(.*?)\\*/g,'<em>$1</em>').replace(/^- (.*)/gm,'<li>$1</li>').replace(/\\n/g,'<br>');
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown Previewer</h1>
        <p className="text-neutral-400 text-center mb-8">Write and preview Markdown in real time</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-neutral-400 mb-1">Markdown</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-96 resize-none font-mono" value={markdown} onChange={e => setMarkdown(e.target.value)} /></div>
          <div><label className="block text-sm text-neutral-400 mb-1">Preview</label><div className="w-full bg-white rounded-xl p-4 h-96 overflow-y-auto text-neutral-900 text-sm" dangerouslySetInnerHTML={{__html: toHtml(markdown)}} /></div>
        </div>
      </div>
    </div>
  );
}`,

  'markdown-to-html': `'use client';
import { useState } from 'react';
export default function MarkdownToHtmlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => {
    let html = input.replace(/^### (.*)/gm,'<h3>$1</h3>').replace(/^## (.*)/gm,'<h2>$1</h2>').replace(/^# (.*)/gm,'<h1>$1</h1>').replace(/\\*\\*(.*?)\\*\\*/g,'<strong>$1</strong>').replace(/\\*(.*?)\\*/g,'<em>$1</em>').replace(/^- (.*)/gm,'<li>$1</li>').replace(/\\n/g,'<br>');
    setOutput('<!DOCTYPE html>\\n<html>\\n<head><meta charset="utf-8"></head>\\n<body>\\n' + html + '\\n</body>\\n</html>');
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown to HTML</h1>
        <p className="text-neutral-400 text-center mb-8">Convert Markdown to HTML</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Markdown</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste Markdown here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">HTML Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'html-entity-decoder': `'use client';
import { useState } from 'react';
export default function HtmlEntityDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const decode = () => { const el = document.createElement('div'); el.innerHTML = input; setOutput(el.textContent || el.innerText || ''); };
  const encode = () => setOutput(input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'));
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Entity Decoder</h1>
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

  'unicode-converter': `'use client';
import { useState } from 'react';
export default function UnicodeConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toUnicode = () => setOutput(input.split('').map(c => '\\\\u' + c.charCodeAt(0).toString(16).padStart(4,'0')).join(''));
  const fromUnicode = () => setOutput(input.replace(/\\\\u([0-9a-fA-F]{4})/g,(_,code) => String.fromCharCode(parseInt(code,16))));
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Unicode Converter</h1>
        <p className="text-neutral-400 text-center mb-8">Convert text to Unicode escapes</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or unicode..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">To Unicode</button>
            <button onClick={fromUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">From Unicode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'hex-to-text': `'use client';
import { useState } from 'react';
export default function HexToTextPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toHex = () => setOutput(input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' '));
  const fromHex = () => { try { setOutput(input.replace(/\\s/g,'').match(/.{2}/g).map(h => String.fromCharCode(parseInt(h,16))).join('')); } catch(e) { setOutput('Invalid hex'); } };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hex to Text</h1>
        <p className="text-neutral-400 text-center mb-8">Convert between text and hexadecimal</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or hex..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Text to Hex</button>
            <button onClick={fromHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Hex to Text</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}`,

  'json-to-typescript': `'use client';
import { useState } from 'react';
export default function JsonToTypescriptPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const lines = ['interface Root {'];
      Object.entries(obj).forEach(([k,v]) => {
        const t = Array.isArray(v) ? 'any[]' : typeof v === 'object' && v !== null ? 'object' : typeof v;
        lines.push('  ' + k + ': ' + t + ';');
      });
      lines.push('}');
      setOutput(lines.join('\\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to TypeScript</h1>
        <p className="text-neutral-400 text-center mb-8">Generate TypeScript interfaces from JSON</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">TypeScript Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'json-to-go': `'use client';
import { useState } from 'react';
export default function JsonToGoPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'string', number: 'float64', boolean: 'bool' };
      const lines = ['type Root struct {'];
      Object.entries(obj).forEach(([k,v]) => {
        const goType = Array.isArray(v) ? '[]interface{}' : (typeMap[typeof v] || 'interface{}');
        const name = k.charAt(0).toUpperCase() + k.slice(1);
        lines.push('  ' + name + ' ' + goType + ' \`json:"' + k + '"\`');
      });
      lines.push('}');
      setOutput(lines.join('\\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Go Struct</h1>
        <p className="text-neutral-400 text-center mb-8">Generate Go structs from JSON</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Go Struct Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'json-to-rust': `'use client';
import { useState } from 'react';
export default function JsonToRustPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'String', number: 'f64', boolean: 'bool' };
      const lines = ['#[derive(Debug, Serialize, Deserialize)]','struct Root {'];
      Object.entries(obj).forEach(([k,v]) => {
        const rustType = Array.isArray(v) ? 'Vec<serde_json::Value>' : (typeMap[typeof v] || 'serde_json::Value');
        lines.push('  ' + k + ': ' + rustType + ',');
      });
      lines.push('}');
      setOutput(lines.join('\\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Rust Struct</h1>
        <p className="text-neutral-400 text-center mb-8">Generate Rust structs from JSON</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Rust Struct Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'json-to-python': `'use client';
import { useState } from 'react';
export default function JsonToPythonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'str', number: 'float', boolean: 'bool' };
      const lines = ['from dataclasses import dataclass','','@dataclass','class Root:'];
      Object.entries(obj).forEach(([k,v]) => {
        const pyType = Array.isArray(v) ? 'list' : (typeMap[typeof v] || 'dict');
        lines.push('  ' + k + ': ' + pyType);
      });
      setOutput(lines.join('\\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Python Class</h1>
        <p className="text-neutral-400 text-center mb-8">Generate Python dataclasses from JSON</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Python Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'json-to-php': `'use client';
import { useState } from 'react';
export default function JsonToPhpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'string', number: 'float', boolean: 'bool' };
      const lines = ['<?php','','class Root {'];
      Object.entries(obj).forEach(([k,v]) => {
        const phpType = Array.isArray(v) ? 'array' : (typeMap[typeof v] || 'mixed');
        lines.push('  public ' + phpType + ' $' + k + ';');
      });
      lines.push('}');
      setOutput(lines.join('\\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to PHP Class</h1>
        <p className="text-neutral-400 text-center mb-8">Generate PHP classes from JSON</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">PHP Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'json-to-csharp': `'use client';
import { useState } from 'react';
export default function JsonToCsharpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'string', number: 'double', boolean: 'bool' };
      const lines = ['public class Root','{'];
      Object.entries(obj).forEach(([k,v]) => {
        const csType = Array.isArray(v) ? 'List<object>' : (typeMap[typeof v] || 'object');
        const name = k.charAt(0).toUpperCase() + k.slice(1);
        lines.push('  public ' + csType + ' ' + name + ' { get; set; }');
      });
      lines.push('}');
      setOutput(lines.join('\\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to C# Class</h1>
        <p className="text-neutral-400 text-center mb-8">Generate C# classes from JSON</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">JSON Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">C# Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'csv-to-sql': `'use client';
import { useState } from 'react';
export default function CsvToSqlPage() {
  const [input, setInput] = useState('');
  const [tableName, setTableName] = useState('my_table');
  const [output, setOutput] = useState('');
  const convert = () => {
    const lines = input.trim().split('\\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));
    const create = 'CREATE TABLE ' + tableName + ' (\\n' + headers.map(h => '  ' + h + ' VARCHAR(255)').join(',\\n') + '\\n);\\n\\n';
    const inserts = rows.map(row => 'INSERT INTO ' + tableName + ' (' + headers.join(', ') + ') VALUES (' + row.map(v => "'" + v + "'").join(', ') + ');').join('\\n');
    setOutput(create + inserts);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to SQL</h1>
        <p className="text-neutral-400 text-center mb-8">Generate SQL INSERT statements from CSV</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div><label className="block text-sm text-neutral-400 mb-1">Table Name</label><input type="text" value={tableName} onChange={e => setTableName(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 font-mono" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">CSV Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="name,age,city..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">SQL Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
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

  'sql-to-csv': `'use client';
import { useState } from 'react';
export default function SqlToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const rows = [];
      const re = /INSERT INTO \\w+ \\(([^)]+)\\) VALUES \\(([^)]+)\\)/gi;
      let match;
      let headers = null;
      while ((match = re.exec(input)) !== null) {
        if (!headers) { headers = match[1].split(',').map(h => h.trim()); rows.push(headers.join(',')); }
        const values = match[2].split(',').map(v => v.trim().replace(/^'|'$/g,''));
        rows.push(values.join(','));
      }
      if (rows.length === 0) throw new Error('No INSERT statements found');
      setOutput(rows.join('\\n'));
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SQL to CSV</h1>
        <p className="text-neutral-400 text-center mb-8">Extract data from SQL to CSV</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">SQL Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="INSERT INTO..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">CSV Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
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

  'env-to-json': `'use client';
import { useState } from 'react';
export default function EnvToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toJson = () => {
    const obj = {};
    input.split('\\n').forEach(line => {
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
      setOutput(Object.entries(obj).map(([k,v]) => k + '=' + v).join('\\n'));
    } catch(e) { setOutput('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">.env to JSON</h1>
        <p className="text-neutral-400 text-center mb-8">Convert .env files to JSON and back</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="KEY=value..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={toJson} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">.env to JSON</button>
            <button onClick={toEnv} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">JSON to .env</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}`,

  'code-minifier': `'use client';
import { useState } from 'react';
export default function CodeMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('js');
  const minify = () => {
    let result = input;
    if (lang === 'js' || lang === 'ts') {
      result = result.replace(/\\/\\/[^\\n]*/g,'').replace(/\\/\\*[\\s\\S]*?\\*\\//g,'').replace(/\\s+/g,' ').trim();
    } else if (lang === 'css') {
      result = result.replace(/\\/\\*[\\s\\S]*?\\*\\//g,'').replace(/\\s+/g,' ').replace(/\\s*([{}:;,])\\s*/g,'$1').trim();
    } else if (lang === 'html') {
      result = result.replace(/<!--[\\s\\S]*?-->/g,'').replace(/\\s+/g,' ').replace(/> </g,'><').trim();
    }
    setOutput(result);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Minifier</h1>
        <p className="text-neutral-400 text-center mb-8">Minify JS, CSS, HTML and TypeScript</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="flex gap-2">{['js','ts','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-700')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Output</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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

  'diff-viewer': `'use client';
import { useState } from 'react';
export default function DiffViewerPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diff, setDiff] = useState(null);
  const compare = () => {
    const lines1 = text1.split('\\n');
    const lines2 = text2.split('\\n');
    const maxLen = Math.max(lines1.length, lines2.length);
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      const l1 = i < lines1.length ? lines1[i] : null;
      const l2 = i < lines2.length ? lines2[i] : null;
      if (l1 === l2) result.push({ type: 'same', line: l1, num: i+1 });
      else {
        if (l1 !== null) result.push({ type: 'removed', line: l1, num: i+1 });
        if (l2 !== null) result.push({ type: 'added', line: l2, num: i+1 });
      }
    }
    setDiff(result);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Diff Viewer</h1>
        <p className="text-neutral-400 text-center mb-8">Compare two texts and highlight differences</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Original</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Original text..." value={text1} onChange={e => setText1(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-400 mb-1">Modified</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Modified text..." value={text2} onChange={e => setText2(e.target.value)} /></div>
          </div>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Compare</button>
          {diff && (
            <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
              {diff.map((d, i) => (
                <div key={i} className={"px-3 py-1 rounded flex gap-3 " + (d.type==='removed'?'bg-red-900/30 text-red-400':d.type==='added'?'bg-green-900/30 text-green-400':'bg-neutral-800 text-neutral-400')}>
                  <span className="text-neutral-600 w-6">{d.num}</span>
                  <span>{d.type==='removed'?'- ':d.type==='added'?'+ ':'  '}{d.line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  'code-formatter': `'use client';
import { useState } from 'react';
export default function CodeFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('json');
  const format = () => {
    try {
      let result = input;
      if (lang === 'json') {
        result = JSON.stringify(JSON.parse(input), null, 2);
      } else if (lang === 'css') {
        result = input.replace(/\\s+/g,' ').replace(/;/g,';\\n  ').replace(/{/g,' {\\n  ').replace(/}/g,'\\n}\\n').trim();
      } else if (lang === 'html') {
        let i = 0;
        result = input.replace(/></g,'>\\n<').split('\\n').map(l => {
          if (l.match(/^<\\//)) i = Math.max(0,i-1);
          const r = '  '.repeat(i) + l.trim();
          if (l.match(/^<[^/][^>]*>$/) && !l.match(/\\//)) i++;
          return r;
        }).join('\\n');
      }
      setOutput(result);
    } catch(e) { setOutput('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Formatter</h1>
        <p className="text-neutral-400 text-center mb-8">Format and beautify code</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="flex gap-2">{['json','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-700')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-400 mb-1">Input</label><textarea className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." value={input} onChange={e => setInput(e.target.value)} /></div>
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

  'cron-expression-builder': `'use client';
import { useState } from 'react';
export default function CronExpressionBuilderPage() {
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');
  const [weekday, setWeekday] = useState('*');
  const cron = minute + ' ' + hour + ' ' + day + ' ' + month + ' ' + weekday;
  const presets = [['Every minute','* * * * *'],['Every hour','0 * * * *'],['Every day','0 0 * * *'],['Every week','0 0 * * 0'],['Every month','0 0 1 * *'],['Every year','0 0 1 1 *'],['Every weekday','0 9 * * 1-5'],['Every 15 min','*/15 * * * *']];
  const apply = (p) => { const parts = p.split(' '); setMinute(parts[0]); setHour(parts[1]); setDay(parts[2]); setMonth(parts[3]); setWeekday(parts[4]); };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Cron Expression Builder</h1>
        <p className="text-neutral-400 text-center mb-8">Build and validate cron expressions</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {[['Minute',minute,setMinute],['Hour',hour,setHour],['Day',day,setDay],['Month',month,setMonth],['Weekday',weekday,setWeekday]].map(([label,val,set]) => (
              <div key={label}><label className="block text-xs text-neutral-400 mb-1">{label}</label><input type="text" value={val} onChange={e => set(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 font-mono text-center text-sm" /></div>
            ))}
          </div>
          <div className="bg-neutral-800 rounded-xl p-4 text-center"><div className="font-mono text-2xl text-indigo-400">{cron}</div></div>
          <button onClick={() => navigator.clipboard.writeText(cron)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
          <div><label className="block text-sm text-neutral-400 mb-2">Presets</label><div className="grid grid-cols-2 gap-2">{presets.map(([label,p]) => <button key={label} onClick={() => apply(p)} className="bg-neutral-800 hover:bg-neutral-700 rounded-lg p-2 text-left transition"><div className="text-sm font-semibold">{label}</div><div className="text-neutral-400 font-mono text-xs">{p}</div></button>)}</div></div>
        </div>
      </div>
    </div>
  );
}`,
};

Object.entries(tools).forEach(([name, content]) => {
  const dir = path.join(basePath, name);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.jsx'), content, 'utf8');
  console.log('Created: ' + path.join(dir, 'page.jsx'));
});

console.log('All missing developer tools created!');
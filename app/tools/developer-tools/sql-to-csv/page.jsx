'use client';
import { useState } from 'react';
export default function SqlToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const rows = [];
      const re = /INSERT INTO \w+ \(([^)]+)\) VALUES \(([^)]+)\)/gi;
      let match;
      let headers = null;
      while ((match = re.exec(input)) !== null) {
        if (!headers) { headers = match[1].split(',').map(h => h.trim()); rows.push(headers.join(',')); }
        const values = match[2].split(',').map(v => v.trim().replace(/^'|'$/g,''));
        rows.push(values.join(','));
      }
      if (rows.length === 0) throw new Error('No INSERT statements found');
      setOutput(rows.join('\n'));
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SQL to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Extract data from SQL to CSV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">SQL Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="INSERT INTO..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
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
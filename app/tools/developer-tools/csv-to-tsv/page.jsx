'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// RFC 4180-style CSV parser: splitting on plain commas/newlines breaks the
// moment a quoted field contains one of those characters (e.g. "Smith, John")
// — the field gets sliced apart into extra columns instead of staying intact.
// This tracks quote state so commas and newlines inside a quoted field are
// treated as literal data, and a doubled "" inside a quoted field is
// unescaped to a single ".
function parseCsvRows(input) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export default function CsvToTsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => setOutput(parseCsvRows(input).map(row => row.join('\t')).join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to TSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert CSV to TSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSV here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TSV Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="CSV to TSV"
        description="CSV to TSV converts comma-separated values to tab-separated values entirely in your browser — nothing is uploaded to a server. Parsing is quote-aware: a field wrapped in double quotes can safely contain a comma (like 'Smith, John') without being split into extra columns, and a doubled double-quote inside a quoted field is unescaped to a single quote. Since TSV has no standard quoting convention of its own, a literal tab character embedded inside a quoted CSV field (rare) will still come through as a stray column separator in the output."
        howTo={[
          "Paste your CSV text into the input box (there's no file upload — paste the contents directly).",
          "Click 'Convert' to replace commas with tabs.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What's the difference between CSV and TSV?", a: "CSV separates values with commas; TSV uses tabs. TSV can be more reliable for data that itself contains commas, since tabs are less likely to appear inside a value." },
          { q: "Does it support file upload, or only pasted text?", a: "Only pasted text — there's no file picker or drag-and-drop upload." },
          { q: "Is my data uploaded to a server?", a: "No, the conversion happens entirely in your browser." },
          { q: "Does it handle quoted fields that contain commas?", a: "Yes — a field wrapped in double quotes (e.g. \"Smith, John\") is parsed as a single value and its comma is preserved intact, rather than being split into extra columns." }
        ]}
        tips={[
          "Wrap a value in double quotes if it contains a comma (e.g. \"Smith, John\") — quoted fields are parsed correctly and stay as a single column.",
          "TSV has no standard quoting mechanism, so a literal tab character embedded inside a quoted CSV field (very rare) will still show up as a stray extra column in the output.",
          "There's no file size limit enforced by the tool, but very large pastes are limited by your browser's performance.",
          "Copy the result right away, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}
'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// RFC 4180-style CSV field writer: a value that itself contains a comma,
// double quote, or newline is indistinguishable from a delimiter unless it's
// wrapped in double quotes (with any internal quote doubled), so a TSV value
// like "Smith, John" must be quoted on the way out or a spreadsheet will read
// it as two columns.
function csvField(v) {
  const s = String(v ?? '');
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export default function TsvToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => setOutput(input.split('\n').map(line => line.split('\t').map(csvField).join(',')).join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TSV to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TSV to CSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TSV here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="TSV to CSV"
        description="TSV to CSV converts tab-separated values to comma-separated values entirely in your browser — nothing is uploaded to a server. Output fields are quoted per the standard CSV convention whenever needed: a value containing a comma, a double quote, or a newline is wrapped in double quotes (with any internal quote doubled), so that value is read back as a single column rather than splitting apart in a spreadsheet."
        howTo={[
          "Paste your TSV text into the input box (there's no file upload — paste the contents directly).",
          "Click 'Convert' to replace tabs with commas.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What's the difference between TSV and CSV?", a: "TSV separates values with tabs; CSV uses commas. This tool converts the delimiter from tabs to commas." },
          { q: "Does it support file upload, or only pasted text?", a: "Only pasted text — there's no file picker or drag-and-drop upload." },
          { q: "Is my data uploaded to a server?", a: "No, the conversion happens entirely in your browser." },
          { q: "Does it handle values that already contain a comma?", a: "Yes — any value containing a comma, quote, or newline is automatically wrapped in double quotes in the output, so it's read back as a single column rather than looking like an extra one." }
        ]}
        tips={[
          "Values containing a comma, quote, or newline are quoted automatically in the output — no manual cleanup needed for those.",
          "There's no file size limit enforced by the tool, but very large pastes are limited by your browser's performance.",
          "Copy the result right away, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}
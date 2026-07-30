'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function TsvToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => setOutput(input.split('\n').map(line => line.split('\t').join(',')).join('\n'));
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
        description="TSV to CSV replaces every tab character with a comma, line by line, entirely in your browser — nothing is uploaded to a server. It's a straight text substitution: there's no file upload, only pasted text, and if any value itself contains a comma, the resulting CSV field won't be quoted, so that comma will look like an extra column when opened in a spreadsheet."
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
          { q: "Does it handle values that already contain a comma?", a: "Not safely — the output isn't quoted, so a value containing a comma will look like an extra column when the CSV is opened in a spreadsheet." }
        ]}
        tips={[
          "Works cleanly for TSV data that doesn't contain commas within individual values.",
          "If a value already contains a comma, consider wrapping that field in quotes yourself after conversion, since the tool doesn't do this automatically.",
          "There's no file size limit enforced by the tool, but very large pastes are limited by your browser's performance.",
          "Copy the result right away, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}
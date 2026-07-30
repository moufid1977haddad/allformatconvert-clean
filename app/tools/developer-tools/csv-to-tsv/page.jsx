'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function CsvToTsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => setOutput(input.split('\n').map(line => line.split(',').join('\t')).join('\n'));
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
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="CSV to TSV"
        description="CSV to TSV replaces every comma with a tab character, line by line, entirely in your browser — nothing is uploaded to a server. It's a straight text substitution, not a CSV parser: it doesn't distinguish a comma used as a delimiter from a comma inside a quoted field, so quoted values containing commas will be split incorrectly."
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
          { q: "Does it handle quoted fields that contain commas?", a: "No — every comma is replaced with a tab regardless of context, so a quoted value containing a comma will be split into extra columns instead of staying intact." }
        ]}
        tips={[
          "Works cleanly for simple CSV data without quoted or comma-containing fields.",
          "For CSV with quoted fields (e.g. addresses or names with embedded commas), clean those up first or expect extra columns in the output.",
          "There's no file size limit enforced by the tool, but very large pastes are limited by your browser's performance.",
          "Copy the result right away, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}
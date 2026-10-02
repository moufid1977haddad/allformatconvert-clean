'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import { TextDownload } from '../../../components/FileDownload';

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
  // P24 (03/10): Windows line ends gave every last column a stray quoted carriage return ("b\r"), and a quoted cell on
  // several lines (Excel's TSV export) was cut into rows. Now: CRLF / CR line ends, and a field quoted at its start
  // (as Excel writes it) may hold tabs, line breaks and doubled quotes; a quote inside an unquoted field (5" screen)
  // stays a character.
  const parseTsv = (text) => {
    const rows = []; let row = [], field = '', i = 0, quoted = false, atStart = true;
    const t = text.replace(/^\uFEFF/, '');
    while (i < t.length) {
      const c = t[i];
      if (quoted) {
        if (c === '"') { if (t[i + 1] === '"') { field += '"'; i += 2; continue; } quoted = false; i++; continue; }
        field += c; i++; continue;
      }
      if (c === '"' && atStart) { quoted = true; atStart = false; i++; continue; }
      if (c === '\t') { row.push(field); field = ''; atStart = true; i++; continue; }
      if (c === '\r' || c === '\n') { row.push(field); rows.push(row); row = []; field = ''; atStart = true; i += c === '\r' && t[i + 1] === '\n' ? 2 : 1; continue; }
      field += c; atStart = false; i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  };
  const convert = () => setOutput(parseTsv(input).map(r => r.map(csvField).join(',')).join('\r\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TSV to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TSV to CSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TSV here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><textarea aria-label="CSV Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.csv" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
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
        faqs={SEO.faqs}
        example={SEO.example}
        related={SEO.related}
        tips={[
          "Values containing a comma, quote, or newline are quoted automatically in the output — no manual cleanup needed for those.",
          "There's no file size limit enforced by the tool, but very large pastes are limited by your browser's performance.",
          "Copy the result or download it as a file; nothing is saved on a server, and leaving the page before either asks first."
        ]}
      />
    </div>
  );
}
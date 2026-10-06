'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import { TextDownload } from '../../../components/FileDownload';
import TextArea from '@/app/components/TextArea';

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
    const rows = []; let row = [], field = '', i = 0, quoted = false, atStart = true, fieldStart = 0;
    // a quoted field that never closes, or whose closing quote is not followed by a tab / line end ("Hello," she said), was
    // not quoted after all: read again from its start as plain text, quotes kept (review 03/10)
    const plain = () => { quoted = false; let j = fieldStart; field = ''; while (j < t.length && t[j] !== '\t' && t[j] !== '\r' && t[j] !== '\n') field += t[j++]; i = j; };
    const t = text.replace(/^\uFEFF/, '');
    while (i < t.length) {
      const c = t[i];
      if (quoted) {
        if (c === '"') { if (t[i + 1] === '"') { field += '"'; i += 2; continue; } if (i + 1 < t.length && !'\t\r\n'.includes(t[i + 1])) { plain(); continue; } quoted = false; i++; continue; }
        field += c; i++; if (i >= t.length) plain(); continue;
      }
      if (c === '"' && atStart) { quoted = true; atStart = false; fieldStart = i; i++; continue; }
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
            <div><label className="block text-sm text-neutral-500 mb-1">TSV Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TSV here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><TextArea aria-label="CSV Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
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
        description={"TSV to CSV turns tab-separated text into comma-separated values. Paste the text, for instance cells copied from Excel, Google Sheets or LibreOffice, which the clipboard holds as tab-separated lines. A field that starts with a double quote is read the way Excel writes it, so it can hold tabs and line breaks. In the CSV, a value with a comma, a double quote or a line break is wrapped in double quotes with inner quotes doubled, and rows end with CRLF. There is no file picker: paste the text."}
        example={SEO.example}
        howToTitle="How to convert TSV to CSV"
        howTo={[
          "Copy cells in your spreadsheet, or the text of a TSV file, and paste it into \"TSV Input\".",
          "Click \"Convert\".",
          "Check the columns in \"CSV Output\".",
          "Click \"Copy\" to paste the CSV elsewhere, or \"Download\" to save it as data.csv.",
        ]}
        specs={[
          { label: "Input", value: "pasted TSV text (no file picker)" },
          { label: "Output", value: "CSV with commas and CRLF line ends, file data.csv" },
          { label: "Line ends read", value: "CRLF, LF or CR" },
        ]}
        privacy={"The tab-separated text is converted by the page itself in your browser, and nothing you paste is uploaded. The page shows no error message; an unexpected failure, such as copying refused by the browser, is reported to us as error text with the tool name and your browser version, without your data."}
        faqs={[
          { q: "Can I paste cells straight from Excel or Google Sheets?", a: "Yes. Copied cells reach the clipboard as tab-separated text; paste them into \"TSV Input\" and click \"Convert\". A cell that holds a line break arrives in quotes and is kept as one value." },
          { q: "Will commas inside my values split the columns?", a: "No. Any value with a comma, a double quote or a line break is written in double quotes, with inner quotes doubled, so a value like Smith, John stays in one column when the CSV is opened." },
          { q: "Can I upload a .tsv file?", a: "No. This page has no file picker; open the file in a text editor or spreadsheet, copy its contents and paste them. For the opposite direction, CSV to TSV does accept files." },
        ]}
        related={SEO.related}
      />
    </div>
  );
}
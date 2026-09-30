'use client';
import { useRef, useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import { parseCsvRows, detectDelimiter, CSV_DELIMITERS } from '../../../lib/csvParser';
import { detectEncoding } from '../../../lib/csvEncoding';
import CsvReadOptions from '../../../components/CsvReadOptions';

// The shared, quote-aware parser (app/lib/csvParser.js) with the delimiter
// detected like every other CSV tool -- before 28/09 this page split on ',' only,
// so a European Excel export ("Nom;Prix", "12,5") came out as wrong columns and
// "12,5" was cut in two. Files are read with their real encoding (an Excel
// "CSV" is Windows-1252, not UTF-8), as ConvertCSV and TableConvert do.
const MAX_FILE_BYTES = 50 * 1024 * 1024;

// TSV has no quoting convention of its own (IANA text/tab-separated-values): a
// value is written as it is -- quotes included -- except one that contains a tab
// or a line break, which would split a column or a row. That one is wrapped in
// quotes (inner quotes doubled), which is how Excel and LibreOffice read it back.
const tsvField = (v) => (/[\t\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export default function CsvToTsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBytes, setFileBytes] = useState(null);
  const [delimiterChoice, setDelimiterChoice] = useState('auto');
  const [detectedDelimiter, setDetectedDelimiter] = useState(',');
  const [encodingChoice, setEncodingChoice] = useState('auto');
  const [detectedEncoding, setDetectedEncoding] = useState('utf-8');
  const [error, setError] = useState('');
  const inputRef = useRef();

  const decodeFile = (bytes, enc) => new TextDecoder(enc).decode(bytes);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError(''); setOutput('');
    if (f.size > MAX_FILE_BYTES) { setError(`This file is ${(f.size / 1048576).toFixed(0)} MB; this tool reads files up to 50 MB.`); return; }
    const bytes = new Uint8Array(await f.arrayBuffer());
    const { encoding } = detectEncoding(bytes.subarray(0, 512 * 1024));
    const text = decodeFile(bytes, encoding);
    setFileName(f.name); setFileBytes(bytes);
    setDetectedEncoding(encoding); setEncodingChoice('auto');
    setInput(text); setDelimiterChoice('auto');
    setDetectedDelimiter(detectDelimiter(text.slice(0, 8192)));
  };

  const changeEncoding = (value) => {
    setEncodingChoice(value);
    if (!fileBytes) return;
    const text = decodeFile(fileBytes, value === 'auto' ? detectedEncoding : value);
    setInput(text); setOutput('');
    setDetectedDelimiter(detectDelimiter(text.slice(0, 8192)));
  };

  const convert = () => {
    const delimiter = delimiterChoice === 'auto' ? detectedDelimiter : delimiterChoice;
    const rows = parseCsvRows(input.replace(/^﻿/, ''), delimiter);
    setOutput(rows.map((row) => row.map(tsvField).join('\t')).join('\n'));
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([output], { type: 'text/tab-separated-values;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = (fileName ? fileName.replace(/\.[^.]+$/, '') : 'converted') + '.tsv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const sel = 'bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to TSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert CSV to TSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 text-sm">{fileName || 'Click to choose a .csv file (up to 50 MB), or paste below'}</p>
            <input ref={inputRef} type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSV here..." value={input} onChange={(e) => { const v = e.target.value; setInput(v); setFileName(''); setFileBytes(null); setDelimiterChoice('auto'); setDetectedDelimiter(detectDelimiter(v.slice(0, 8192))); }} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TSV Output</label><textarea aria-label="TSV Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-2">
              <label htmlFor="csv-delimiter" className="text-neutral-500">Delimiter:</label>
              <select id="csv-delimiter" value={delimiterChoice} onChange={(e) => setDelimiterChoice(e.target.value)} className={sel}>
                <option value="auto">Auto-detected: {CSV_DELIMITERS.find((d) => d.value === detectedDelimiter)?.label || detectedDelimiter}</option>
                {CSV_DELIMITERS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </span>
          </div>
          <CsvReadOptions showEncoding={!!fileBytes} encodingChoice={encodingChoice} detectedEncoding={detectedEncoding} onEncoding={changeEncoding} />
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
            <button onClick={download} disabled={!output} className="bg-neutral-700 hover:bg-neutral-600 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Download .tsv</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="CSV to TSV"
        description="CSV to TSV converts comma-, semicolon- or pipe-separated values to tab-separated values entirely in your browser — nothing is uploaded to a server. The delimiter is detected automatically (a European Excel export uses semicolons, with commas as decimal separators), and a file's character encoding too: Excel's classic CSV export is not UTF-8, and its accents are read correctly. Parsing is quote-aware: a field wrapped in double quotes can safely contain the delimiter (like 'Smith, John'), and a value containing a tab or a line break is quoted in the TSV output, so no column or row is split."
        howTo={[
          "Choose a .csv file, or paste your CSV text into the input box.",
          "Check the detected delimiter (and, for a file, the detected encoding); change them if needed.",
          "Click 'Convert'.",
          "Copy the result or download it as a .tsv file."
        ]}
        faqs={SEO.faqs}
        example={SEO.example}
        related={SEO.related}
        tips={[
          "If a column looks split in the wrong place, switch the delimiter from the dropdown and convert again.",
          "Files up to 50 MB are read in one go in your browser; very large pastes depend on your browser's performance.",
          "Download the result as .tsv, or copy it straight into a spreadsheet."
        ]}
      />
    </div>
  );
}

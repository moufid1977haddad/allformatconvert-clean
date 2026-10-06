'use client';
import { textFileProblem } from '../../../lib/fileChecks';
import { useRef, useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import { parseCsvRows, detectDelimiter, CSV_DELIMITERS } from '../../../lib/csvParser';
import { detectEncoding } from '../../../lib/csvEncoding';
import CsvReadOptions from '../../../components/CsvReadOptions';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

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
// P24 review (03/10): a value that STARTS with a quote ("Hi" she said) is wrapped too — Excel and LibreOffice read a
// leading quote as an opening one and returned Hi she said.
const tsvField = (v) => (/[\t\n\r]/.test(v) || v.startsWith('"') ? `"${v.replace(/"/g, '""')}"` : v);

export default function CsvToTsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileBytes, setFileBytes] = useState(null);
  const [delimiterChoice, setDelimiterChoice] = useState('auto');
  const [detectedDelimiter, setDetectedDelimiter] = useState(',');
  const [encodingChoice, setEncodingChoice] = useState('auto');
  const [detectedEncoding, setDetectedEncoding] = useState('utf-8');
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const decodeFile = (bytes, enc) => new TextDecoder(enc).decode(bytes);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError(''); setOutput('');
    if (f.size > MAX_FILE_BYTES) { setError(`This file is ${(f.size / 1048576).toFixed(0)} MB; this tool reads files up to 50 MB.`); return; }
    // P21: an empty, binary or other-kind file gets a sentence, never a "conversion" (robustness bench).
    const problem = await textFileProblem(f, 'CSV');
    if (problem) { setError(problem); setFileName(''); setInput(''); setFileBytes(null); return; }
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


  const sel = 'bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to TSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert CSV to TSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 text-sm">{fileName || <><UploadPrompt what="a .csv file" /> (up to 50 MB), or paste below</>}</p>
            <input ref={inputRef} type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSV here..." value={input} onChange={(e) => { const v = e.target.value; setInput(v); setFileName(''); setFileBytes(null); setDelimiterChoice('auto'); setDetectedDelimiter(detectDelimiter(v.slice(0, 8192))); }} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TSV Output</label><TextArea aria-label="TSV Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
          <TextDownload text={output} name={(fileName ? fileName.replace(/\.[^.]+$/, '') : 'converted') + '.tsv'} type="text/tab-separated-values;charset=utf-8" />
        </div>
      </div>
      <SeoContent
        title="CSV to TSV"
        description={"CSV to TSV rewrites CSV with tabs between the values. It reads text you paste, or a .csv or .txt file, which it opens in the input box. The separator (comma, semicolon, tab or pipe) is detected, and so is the encoding of a file, including the Windows code pages Excel uses for CSV. A value that contains a tab or a line break, or begins with a double quote, is put in quotes in the TSV so it stays one cell; every other value is copied unchanged. The result can be copied or downloaded as a .tsv file."}
        example={SEO.example}
        howToTitle="How to convert CSV to TSV"
        howTo={[
          "Choose a .csv or .txt file in the upload area, or paste CSV into \"CSV Input\".",
          "Check \"Delimiter:\" and, for a file, \"Encoding:\"; choosing another encoding reads the file again.",
          "Click \"Convert\" to fill \"TSV Output\".",
          "Click \"Copy\", or \"Download\" to save a .tsv named after your file (converted.tsv for pasted text).",
        ]}
        specs={[
          { label: "Input", value: `CSV or TXT file up to ${`${MAX_FILE_BYTES / 1048576} MB`}, or pasted text` },
          { label: "Output", value: "TSV text, one row per line, except a quoted value that holds a line break" },
          { label: "Separators read", value: "comma, semicolon, tab or pipe, detected or chosen" },
        ]}
        privacy={"Your file is read in full by the browser and converted on the page itself, so the CSV is not uploaded. Errors, including one that happens without a message on screen, reach us as a report: the error text stripped of file names and quoted text, the name of this tool, and your browser and its version."}
        faqs={[
          { q: "Does it read semicolon CSV files from European Excel?", a: "Yes. The semicolon is one of the four separators detected, so Nom;Prix with 12,5 keeps its columns. Values are not changed: the decimal comma is copied as it is into the TSV." },
          { q: "Will a value with a line break split my rows?", a: "No. Inside quotes in the CSV, a line break or a tab belongs to the value, and the TSV writes that value in double quotes so Excel and LibreOffice read it back as one cell." },
          { q: "Can I choose the encoding of an old CSV file?", a: "Yes. After you open a file, \"Encoding:\" shows what was detected, and choosing another reads the file again with it. A file with a byte order mark or valid UTF-8 is recognized; otherwise the code page of your browser language is assumed." },
        ]}
        tips={[
          "To go back from tabs to commas, use TSV to CSV.",
        ]}
        related={SEO.related}
      />
    </div>
  );
}

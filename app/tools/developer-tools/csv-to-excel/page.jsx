'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_ROWS } from './config';

// Coarse defense-in-depth backstop for pathological inputs (e.g. a handful
// of enormous rows) that could slip under the row-count cap below while
// still being far too large to process reliably. MAX_ROWS, checked during
// parsing, is the limit that actually matters for realistic CSVs.
const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024; // 250 MB
const MAX_FILE_SIZE_LABEL = '250 MB';
const MAX_ROWS_LABEL = MAX_ROWS.toLocaleString();

export default function CsvToExcelPage() {
  const [file, setFile] = useState(null);
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [converting, setConverting] = useState(false);
  const inputRef = useRef();
  const workerRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    setStatus('');
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`This file is ${(f.size / (1024 * 1024)).toFixed(0)} MB, which is over the ${MAX_FILE_SIZE_LABEL} limit for this tool. Try splitting it into smaller files first.`);
      setFile(null);
      setFileName('');
      return;
    }
    setFile(f);
    setFileName(f.name);
    setInput('');
  };

  const cancel = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setConverting(false);
    setProgress(0);
    setPhase('');
    setStatus('Cancelled.');
  };

  const convert = () => {
    if (!file && !input) return;
    setError('');
    setStatus('');
    setProgress(0);
    setPhase('reading');
    setConverting(true);

    const worker = new Worker(new URL('./csvToExcel.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
        setPhase(msg.phase);
      } else if (msg.type === 'done') {
        const url = URL.createObjectURL(msg.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setProgress(100);
        setConverting(false);
        workerRef.current = null;
        setStatus(`Downloaded! ${msg.rowCount.toLocaleString()} rows.`);
      } else if (msg.type === 'row_limit') {
        setConverting(false);
        workerRef.current = null;
        setError(`This CSV has more than ${msg.limit.toLocaleString()} rows — in-browser conversion becomes unreliable beyond that point. Please split your file into smaller pieces and convert them separately.`);
      } else if (msg.type === 'error') {
        setConverting(false);
        workerRef.current = null;
        setError('Conversion failed: ' + msg.message);
      }
    };
    worker.onerror = (err) => {
      setConverting(false);
      workerRef.current = null;
      setError('Conversion failed: ' + (err?.message || 'unknown worker error'));
    };
    worker.postMessage(file ? { file } : { text: input });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">CSV to Excel</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Convert CSV to Excel format</p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center mb-8">Supports CSVs up to {MAX_ROWS_LABEL} rows (files up to {MAX_FILE_SIZE_LABEL}). Conversion runs in the background — this tab stays responsive.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || 'Click or drop a .csv file here'}</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>
          <textarea
            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-48 resize-none font-mono text-neutral-800 dark:text-neutral-200"
            placeholder="...or paste CSV here"
            value={input}
            onChange={e => { setInput(e.target.value); setFileName(''); setFile(null); }}
            disabled={converting}
          />
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {converting ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={phase === 'building' ? 'Building spreadsheet…' : 'Reading and parsing…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={!file && !input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-gray-600 dark:disabled:text-neutral-500 text-white rounded-xl py-3 font-semibold transition">Convert and Download</button>
          )}
          {status && !converting && <p className="text-center text-sm text-green-600 dark:text-green-400">{status}</p>}
        </div>
      </div>
      <SeoContent
        title="CSV to Excel"
        description="CSV to Excel builds an .xlsx workbook from a CSV file (or pasted CSV text) using the xlsx library entirely in your browser, then triggers a download — your data is never uploaded to a server. The file is read and parsed off the main thread in a Web Worker, so the page stays responsive even on large files."
        howTo={[
          "Click the upload area and select a .csv file, or paste CSV text directly into the box below it.",
          "Click 'Convert and Download' to build the workbook and save it.",
          "The file downloads automatically as converted.xlsx.",
          "Open it in Excel or any compatible spreadsheet app."
        ]}
        faqs={[
          { q: "Does it support file upload, or only pasted text?", a: "Both — upload a .csv file, or paste CSV text directly into the box." },
          { q: "What output format does it produce?", a: "Always .xlsx. There's no .xls (legacy Excel) option." },
          { q: "Is my data uploaded to a server?", a: "No, the workbook is built entirely in your browser using the xlsx library, in a background Web Worker so the page never freezes." },
          { q: "Does it handle CSV values that contain commas, like quoted fields?", a: "Yes — a value wrapped in double quotes (e.g. \"Smith, John\") is parsed as a single field and its comma is preserved intact, rather than being split into extra columns." },
          { q: "Why is there a row limit, if Excel itself allows over a million rows per sheet?", a: `Excel's own format allows up to 1,048,576 rows per sheet, but converting a file anywhere near that size in a browser tab risks running out of memory and crashing the tab rather than just being slow. ${MAX_ROWS_LABEL} rows is the limit we've measured to convert reliably; beyond that, split your CSV into smaller files first.` }
        ]}
        tips={[
          "Wrap a value in double quotes if it contains a comma (e.g. \"Smith, John\") — quoted fields are parsed correctly and stay in a single cell.",
          "The first line becomes the first row of the sheet as-is — include a header row yourself if you want column labels.",
          "Check the downloaded file's column alignment for CSVs with unusual formatting before relying on it.",
          "Only comma is recognized as a delimiter — a CSV using semicolons or tabs instead needs to be converted to commas first."
        ]}
      />
    </div>
  );
}

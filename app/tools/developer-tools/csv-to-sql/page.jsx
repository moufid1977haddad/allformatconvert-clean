'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_ROWS, MOBILE_MAX_ROWS, PASTE_MAX_ROWS } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';

const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB
const MAX_FILE_SIZE_LABEL = '150 MB';
const MAX_ROWS_LABEL = MAX_ROWS.toLocaleString();
const MOBILE_MAX_ROWS_LABEL = MOBILE_MAX_ROWS.toLocaleString();
const PASTE_MAX_ROWS_LABEL = PASTE_MAX_ROWS.toLocaleString();

// Time estimate breakpoints: [CSV size in MB, seconds], measured in Node
// (parse + CREATE TABLE/INSERT string-build) and scaled by 1.55x to match
// real Chrome production behavior (same ratio confirmed for csv-to-excel).
const TIME_ESTIMATE_BREAKPOINTS = [
  [0, 0],
  [8.1, 0.9],
  [10.6, 1.3],
  [49.5, 5.4],
  [66.0, 7.4],
];

function estimateSeconds(fileSizeBytes) {
  const mb = fileSizeBytes / (1024 * 1024);
  const pts = TIME_ESTIMATE_BREAKPOINTS;
  if (mb <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [prevMb, prevS] = pts[i - 1];
    const [curMb, curS] = pts[i];
    if (mb <= curMb) {
      const t = (mb - prevMb) / (curMb - prevMb);
      return prevS + t * (curS - prevS);
    }
  }
  const [prevMb, prevS] = pts[pts.length - 2];
  const [lastMb, lastS] = pts[pts.length - 1];
  const slope = (lastS - prevS) / (lastMb - prevMb);
  return lastS + slope * (mb - lastMb);
}

function formatEstimate(seconds) {
  if (seconds < 5) return 'a few seconds';
  const rounded = Math.round(seconds / 5) * 5;
  return `about ${rounded} seconds`;
}

export default function CsvToSqlPage() {
  const [file, setFile] = useState(null);
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [tableName, setTableName] = useState('my_table');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [converting, setConverting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState('');
  const inputRef = useRef();
  const workerRef = useRef(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const fileMaxRows = isMobile ? MOBILE_MAX_ROWS : MAX_ROWS;
  const fileMaxRowsLabel = isMobile ? MOBILE_MAX_ROWS_LABEL : MAX_ROWS_LABEL;

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    setStatus('');
    setOutput('');
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`This file is ${(f.size / (1024 * 1024)).toFixed(0)} MB, which is over the ${MAX_FILE_SIZE_LABEL} limit for this tool. Try splitting it into smaller files first.`);
      setFile(null);
      setFileName('');
      return;
    }
    setFile(f);
    setFileName(f.name);
    setInput('');
    setTimeEstimate(formatEstimate(estimateSeconds(f.size)));
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
    setOutput('');
    setProgress(0);
    setPhase('reading');
    setConverting(true);

    const mode = file ? 'file' : 'paste';
    const maxRows = file ? fileMaxRows : PASTE_MAX_ROWS;

    const worker = new Worker(new URL('./csvToSql.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
        setPhase(msg.phase);
      } else if (msg.type === 'done') {
        setProgress(100);
        setConverting(false);
        workerRef.current = null;
        if (msg.mode === 'file') {
          const url = URL.createObjectURL(msg.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'converted.sql';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setStatus(`Downloaded! ${msg.rowCount.toLocaleString()} rows.`);
        } else {
          setOutput(msg.sql);
          setStatus(`Converted! ${msg.rowCount.toLocaleString()} rows.`);
        }
      } else if (msg.type === 'row_limit') {
        setConverting(false);
        workerRef.current = null;
        const label = msg.mode === 'file' ? fileMaxRowsLabel : PASTE_MAX_ROWS_LABEL;
        const source = msg.mode === 'file' ? 'This file' : 'This pasted CSV';
        setError(`${source} has more than ${label} rows, counting the header row as row 1 — in-browser conversion becomes unreliable beyond that point. If your data itself has exactly ${label} rows plus a header, that's one row over the limit. ${msg.mode === 'file' ? 'Please split it into smaller files and convert them separately.' : 'Try uploading it as a file instead, which supports more rows, or split it into smaller pieces.'}`);
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
    worker.postMessage(file ? { file, mode, maxRows, tableName } : { text: input, mode, maxRows, tableName });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">CSV to SQL</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Generate SQL INSERT statements from CSV</p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center mb-8">Uploaded files: up to {fileMaxRowsLabel} rows{isMobile ? ' on this device' : ''} (including the header row, files up to {MAX_FILE_SIZE_LABEL}). Pasted text: up to {PASTE_MAX_ROWS_LABEL} rows. Conversion runs in the background — this tab stays responsive.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Table Name</label>
            <input type="text" value={tableName} onChange={e => setTableName(e.target.value)} disabled={converting} className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 font-mono text-neutral-800 dark:text-neutral-200" />
          </div>
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || 'Click or drop a .csv file here'}</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">...or paste CSV Input</label>
              <textarea
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-48 resize-none font-mono text-neutral-800 dark:text-neutral-200"
                placeholder="name,age,city..."
                value={input}
                onChange={e => {
                  const val = e.target.value;
                  setInput(val);
                  setFileName('');
                  setFile(null);
                  setTimeEstimate('');
                }}
                disabled={converting}
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">SQL Output</label>
              <textarea className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-48 resize-none font-mono text-neutral-800 dark:text-neutral-200" value={output} readOnly />
            </div>
          </div>
          {timeEstimate && !converting && !error && (
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">Estimated conversion time: {timeEstimate}</p>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {converting ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={phase === 'building' ? 'Building SQL…' : 'Reading and parsing…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={convert} disabled={!file && !input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-gray-600 dark:disabled:text-neutral-500 text-white rounded-xl py-3 font-semibold transition">{file ? 'Convert and Download' : 'Convert'}</button>
              <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-gray-600 dark:disabled:text-neutral-500 text-white rounded-xl py-3 font-semibold transition">Copy</button>
            </div>
          )}
          {status && !converting && <p className="text-center text-sm text-green-600 dark:text-green-400">{status}</p>}
        </div>
      </div>
      <SeoContent
        title="CSV to SQL"
        description="CSV to SQL generates a CREATE TABLE statement and one INSERT statement per row from a CSV file (or pasted CSV text), entirely in your browser — nothing is uploaded to a server. CSV parsing is quote-aware: a field wrapped in double quotes can safely contain a comma (like 'Smith, John') without being split into extra values. Values are also escaped for SQL string literals (a quote inside a value is doubled, the standard SQL escaping). Large files are read and parsed off the main thread in a Web Worker, so the page stays responsive. Column and table names typed into the Table Name field are not escaped, so avoid spaces or SQL reserved words there."
        howTo={[
          "Type your table name, or keep the default.",
          "Click the upload area and select a .csv file, or paste CSV text directly into the box below it.",
          "Click 'Convert' to generate a CREATE TABLE statement plus one INSERT per row.",
          "A file upload downloads automatically as converted.sql; pasted text appears in the output box for you to copy."
        ]}
        faqs={[
          { q: "Is CSV to SQL free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Are values safely escaped in the generated SQL?", a: "Yes — quotes inside values are doubled following standard SQL string escaping, so values containing an apostrophe (like a name such as O'Brien) produce valid, safe SQL rather than broken or exploitable statements." },
          { q: "What data types does the CREATE TABLE statement use?", a: "Every column is created as VARCHAR(255), regardless of whether the CSV data looks numeric, a date, or text — edit the generated statement if you need different types." },
          { q: "Does it support file upload, or only pasted text?", a: "Both — upload a .csv file, or paste CSV text directly into the box. No delimiter other than commas is supported (a comma inside a properly double-quoted field is treated as data, not a delimiter)." },
          { q: "Why is there a row limit, and why is it lower for pasted text?", a: `Converting a very large CSV in a browser tab risks running out of memory and crashing the tab. Uploaded files support up to ${MAX_ROWS_LABEL} rows on desktop (${MOBILE_MAX_ROWS_LABEL} on phones/tablets); pasted text is capped lower, at ${PASTE_MAX_ROWS_LABEL} rows on any device, since pasted text has to live in the page itself and be re-rendered into the input box, rather than being streamed in like a file. The count includes the header row.` }
        ]}
        tips={[
          "Values are escaped for SQL, but the table name and column headers are inserted as-is — avoid spaces, quotes, or reserved SQL keywords in the Table Name field or your CSV header row.",
          "Every column defaults to VARCHAR(255); adjust the CREATE TABLE statement afterward if you need numeric, date, or other column types.",
          "Wrap a value in double quotes if it contains a comma (e.g. \"Smith, John\") — quoted fields are parsed correctly and stay as a single value.",
          "Always review generated SQL — and test it on a development database — before running it against production."
        ]}
      />
    </div>
  );
}

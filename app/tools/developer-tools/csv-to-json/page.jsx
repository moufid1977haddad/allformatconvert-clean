'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_ROWS, MOBILE_MAX_ROWS, PASTE_MAX_ROWS } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';

// Coarse defense-in-depth backstop for pathological inputs, same role as the
// equivalent constant on csv-to-excel. MAX_ROWS, checked during parsing, is
// the limit that actually matters for realistic CSVs.
const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB
const MAX_FILE_SIZE_LABEL = '150 MB';
const MAX_ROWS_LABEL = MAX_ROWS.toLocaleString();
const MOBILE_MAX_ROWS_LABEL = MOBILE_MAX_ROWS.toLocaleString();
const PASTE_MAX_ROWS_LABEL = PASTE_MAX_ROWS.toLocaleString();

// Time estimate breakpoints: [CSV size in MB, seconds], measured in Node
// (parse + object-build + JSON.stringify) and scaled by 1.55x to match real
// Chrome production behavior (same ratio confirmed for csv-to-excel). Shown
// to the user immediately on file selection, before they click Convert.
const TIME_ESTIMATE_BREAKPOINTS = [
  [0, 0],
  [16.3, 1.6],
  [32.9, 3.3],
  [66.0, 6.5],
  [82.6, 8.1],
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

export default function CsvToJsonPage() {
  const [file, setFile] = useState(null);
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
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

    const worker = new Worker(new URL('./csvToJson.worker.js', import.meta.url), { type: 'module' });
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
          a.download = 'converted.json';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          setStatus(`Downloaded! ${msg.rowCount.toLocaleString()} rows.`);
        } else {
          setOutput(msg.json);
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
    worker.postMessage(file ? { file, mode, maxRows } : { text: input, mode, maxRows });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">CSV to JSON</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Convert CSV to JSON format</p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center mb-8">Uploaded files: up to {fileMaxRowsLabel} rows{isMobile ? ' on this device' : ''} (including the header row, files up to {MAX_FILE_SIZE_LABEL}). Pasted text: up to {PASTE_MAX_ROWS_LABEL} rows. Conversion runs in the background — this tab stays responsive.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || 'Click or drop a .csv file here'}</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">...or paste CSV Input</label>
              <textarea
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-64 resize-none font-mono text-neutral-800 dark:text-neutral-200"
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
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">JSON Output</label>
              <textarea className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-64 resize-none font-mono text-neutral-800 dark:text-neutral-200" value={output} readOnly />
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
              <ProgressBar pct={progress} label={phase === 'building' ? 'Building JSON…' : 'Reading and parsing…'} />
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
        title="CSV to JSON"
        description="CSV to JSON converts a CSV file (or pasted CSV text) into an array of JSON objects entirely in your browser — nothing is uploaded to a server. The first line is treated as the header row. Parsing is quote-aware: a field wrapped in double quotes can safely contain a comma or a newline (like 'Smith, John') without being split into extra columns. Large files are read and parsed off the main thread in a Web Worker, so the page stays responsive, and the result downloads automatically as a .json file."
        howTo={[
          "Click the upload area and select a .csv file, or paste CSV text directly into the box below it.",
          "Click 'Convert' to generate the JSON.",
          "A file upload downloads automatically as converted.json; pasted text appears in the output box for you to copy.",
          "Validate the JSON in a linter or your target application before relying on it."
        ]}
        faqs={[
          { q: "Does it support file upload, or only pasted text?", a: "Both — upload a .csv file, or paste CSV text directly into the box." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser, in a background Web Worker so the page never freezes." },
          { q: "Does it support delimiters other than commas, like semicolons or tabs?", a: "No, splitting is done on commas only — though a comma inside a properly double-quoted field is treated as data, not a delimiter." },
          { q: "Why is there a row limit?", a: `Converting a very large CSV in a browser tab risks running out of memory and crashing the tab rather than just being slow. Uploaded files support up to ${MAX_ROWS_LABEL} rows on desktop (${MOBILE_MAX_ROWS_LABEL} on phones/tablets); pasted text is capped lower, at ${PASTE_MAX_ROWS_LABEL} rows, since pasted text has to live in the page itself rather than being streamed in like a file. The count includes the header row.` },
          { q: "Why is the pasted-text limit lower than the file-upload limit?", a: "A pasted CSV sits in the page's own memory and gets re-rendered into the input box on every change, on both desktop and mobile — an uploaded file is instead streamed straight into the background worker without that overhead, so it can safely handle far more rows." }
        ]}
        tips={[
          "Include a header row as the first line — those values become the keys in each JSON object.",
          "Wrap a value in double quotes if it contains a comma (e.g. \"Smith, John\") — quoted fields are parsed correctly and won't shift into the wrong keys.",
          "Rows with fewer values than headers get empty strings for the missing fields.",
          "For a large CSV, upload it as a file rather than pasting it — the file path supports far more rows and downloads the result directly instead of rendering it on the page."
        ]}
      />
    </div>
  );
}

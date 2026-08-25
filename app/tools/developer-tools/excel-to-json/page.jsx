'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_ROWS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_ROWS, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';

const MAX_ROWS_LABEL = MAX_ROWS.toLocaleString();
const MOBILE_MAX_ROWS_LABEL = MOBILE_MAX_ROWS.toLocaleString();

// Time estimate breakpoints: [.xlsx/.xls/.csv file size in MB, seconds],
// measured in Node (file read + XLSX.read + sheet_to_json across every
// sheet) and scaled by 1.55x to match real Chrome production behavior (same
// ratio confirmed for csv-to-excel).
const TIME_ESTIMATE_BREAKPOINTS = [
  [0, 0],
  [14.6, 2.3],
  [24.4, 3.7],
  [34.2, 5.3],
  [48.9, 7.9],
  [74.1, 11.5],
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

export default function ExcelToJsonPage() {
  const [fileName, setFileName] = useState('');
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

  const maxRows = isMobile ? MOBILE_MAX_ROWS : MAX_ROWS;
  const maxRowsLabel = isMobile ? MOBILE_MAX_ROWS_LABEL : MAX_ROWS_LABEL;
  const maxFileBytes = isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const maxFileLabel = isMobile ? MOBILE_MAX_FILE_SIZE_LABEL : MAX_FILE_SIZE_LABEL;

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    setStatus('');
    if (f.size > maxFileBytes) {
      setError(`This file is ${(f.size / (1024 * 1024)).toFixed(0)} MB, which is over the ${maxFileLabel} limit${isMobile ? ' on this device' : ''}. Try splitting it into smaller files first.`);
      setFileName('');
      return;
    }
    setFileName(f.name);
    setTimeEstimate(formatEstimate(estimateSeconds(f.size)));
    convertFile(f);
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

  const convertFile = (f) => {
    setError('');
    setStatus('');
    setProgress(0);
    setPhase('reading');
    setConverting(true);

    const worker = new Worker(new URL('./excelToJson.worker.js', import.meta.url), { type: 'module' });
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
        const url = URL.createObjectURL(msg.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus(`Downloaded! ${msg.rowCount.toLocaleString()} rows.`);
      } else if (msg.type === 'row_limit') {
        setConverting(false);
        workerRef.current = null;
        setError(`This workbook has more than ${maxRowsLabel} rows across all sheets, counting each sheet's header row — in-browser conversion becomes unreliable beyond that point. Split it into smaller files and convert them separately.`);
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
    worker.postMessage({ file: f, maxRows });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">Excel to JSON</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Convert Excel files to JSON</p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center mb-8">Supports workbooks up to {maxRowsLabel} rows across all sheets{isMobile ? ' on this device' : ''} (files up to {maxFileLabel}). Conversion runs in the background — this tab stays responsive.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || 'Click or drop an Excel file here'}</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
          {timeEstimate && !converting && !error && fileName && (
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">Estimated conversion time: {timeEstimate}</p>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {converting && (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={phase === 'building' ? 'Building JSON…' : phase === 'parsing' ? 'Parsing workbook…' : 'Reading file…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          )}
          {status && !converting && <p className="text-center text-sm text-green-600 dark:text-green-400">{status}</p>}
        </div>
      </div>
      <SeoContent
        title="Excel to JSON"
        description="Excel to JSON reads an uploaded .xlsx, .xls, or .csv file using the xlsx library and converts every sheet to an array of row objects, entirely in your browser — your file is never uploaded to a server. Reading and parsing run off the main thread in a Web Worker, so the page stays responsive even on large files, and the result downloads automatically as a .json file. The result is a single JSON object keyed by sheet name, with each sheet's first row used as the property names for that sheet's rows."
        howTo={[
          "Click the upload area and select an .xlsx, .xls, or .csv file.",
          "Conversion runs automatically in the background — no button click needed.",
          "The result downloads automatically as converted.json once it's ready.",
          "Open it in a code editor or your target application."
        ]}
        faqs={[
          { q: "What file formats does it support?", a: ".xlsx, .xls, and .csv." },
          { q: "Is my file uploaded to a server?", a: "No, conversion happens entirely in your browser using the xlsx library, in a background Web Worker so the page never freezes." },
          { q: "Can I convert multiple sheets at once?", a: "Yes — every sheet in the workbook is converted automatically, each becoming its own array under a key named after the sheet. There's no option to merge sheets or select specific ones." },
          { q: "Why is there a row and file-size limit?", a: `Excel files can't be parsed incrementally the way plain text can, so converting a very large workbook risks the tab running out of memory or taking too long. Uploaded files are capped at ${maxRowsLabel} rows across all sheets combined and ${maxFileLabel}${isMobile ? ' on this device' : ' on desktop'}, measured to convert reliably.` },
          { q: "Can I download the JSON as a file, or is it only shown on the page?", a: "It downloads automatically as converted.json — there's no inline preview, since a large workbook's JSON output can be too big to safely render on the page." }
        ]}
        tips={[
          "Each sheet's first row becomes the property names for that sheet's row objects, so make sure your headers are in row 1.",
          "Empty cells are simply omitted from that row's object rather than appearing as null — account for that if your code expects every key present.",
          "For workbooks with many sheets, split it into smaller files first if it exceeds the row or size limit.",
          "Since it uses a proper spreadsheet-parsing library, formulas convert to their calculated values, not the formula text."
        ]}
      />
    </div>
  );
}

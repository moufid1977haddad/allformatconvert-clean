'use client';
import { spreadsheetProblem } from '../../../lib/fileChecks';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_ROWS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_ROWS, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { formatBytes } from '../../../lib/formatBytes';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

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
  const [error, setError] = useToolError('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [converting, setConverting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState('');
  const [sheetNames, setSheetNames] = useState(null);
  const inputRef = useRef();
  const workerRef = useRef(null);
  const [result, offer, clearResult] = useDownloadable();

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const maxRows = isMobile ? MOBILE_MAX_ROWS : MAX_ROWS;
  const maxRowsLabel = isMobile ? MOBILE_MAX_ROWS_LABEL : MAX_ROWS_LABEL;
  const maxFileBytes = isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const maxFileLabel = isMobile ? MOBILE_MAX_FILE_SIZE_LABEL : MAX_FILE_SIZE_LABEL;

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    setStatus('');
    clearResult();
    if (f.size > maxFileBytes) {
      setError(`This file is ${formatBytes(f.size)}, which is over the ${maxFileLabel} limit${isMobile ? ' on this device' : ''}. Try splitting it into smaller files first.`);
      setFileName('');
      return;
    }
    // P21: an empty file, or something that is not a workbook, gets a sentence instead of a "result" read as text.
    const problem = await spreadsheetProblem(f, { allowCsv: true });
    if (problem) { setError(problem); setFileName(''); return; }
    setFileName(f.name);
    setSheetNames(null);
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
    clearResult();
    setStatus('Cancelled.');
  };

  const convertFile = (f) => {
    setError('');
    setStatus('');
    clearResult();
    setProgress(0);
    setPhase('reading');
    setSheetNames(null);
    setConverting(true);

    const worker = new Worker(new URL('./excelToJson.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
        setPhase(msg.phase);
      } else if (msg.type === 'sheets') {
        setSheetNames(msg.sheetNames);
      } else if (msg.type === 'done') {
        setProgress(100);
        setConverting(false);
        workerRef.current = null;
        offer(msg.blob, 'converted.json');
        setStatus(
          msg.sheetNames && msg.sheetNames.length > 1
            ? `JSON ready: ${msg.sheetNames.length} sheets, ${msg.rowCount.toLocaleString()} rows total.`
            : `JSON ready: ${msg.rowCount.toLocaleString()} rows.`
        );
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
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Supports workbooks up to {maxRowsLabel} rows across all sheets{isMobile ? ' on this device' : ''} (files up to {maxFileLabel}). The conversion runs in a background worker; the Cancel button stops it.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || <UploadPrompt what="an Excel, ODS, or CSV file" />}</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden" onChange={handleFile} />
          </div>
          {timeEstimate && !converting && !error && fileName && (
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">Estimate from our tests on a desktop computer: {timeEstimate}</p>
          )}
          {sheetNames && sheetNames.length > 1 && (
            <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm rounded-lg px-4 py-3">
              {sheetNames.length} sheets detected: {sheetNames.join(', ')} — each will be a key in the JSON output.
            </div>
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
          {!converting && <DownloadReady file={result} />}
        </div>
      </div>
      <SeoContent
        title="Excel to JSON"
        description={"Excel to JSON reads an .xlsx, .xls or .ods workbook, or a .csv file, and writes one JSON object whose keys are the sheet names. Each sheet becomes an array of row objects whose keys come from the sheet's first row, and every row has the same keys: an empty cell gives null. Date cells become ISO 8601 text, formulas give their saved result, and emoji saved by pandas or openpyxl are kept. A .csv file is read as plain text, so every value stays a string and its sheet is called Sheet1. Conversion starts when you choose the file, in your browser."}
        example={{"caption":"A workbook with two sheets, Prices (date cells and formulas) and Notes (one empty cell), and the JSON the tool returns:","inputLabel":"Workbook","input":"Sheet Prices:\nItem | Price | Sold on | Total\nTea | 12.5 | 2024-01-15 (date cell) | =B2*2 → 25\nCoffee, ground | 1234.5 | 2024-02-15 (date cell) | =B3*2 → 2469\n\nSheet Notes:\nName | Note\nAnn | (empty)\nBob | call back","outputLabel":"JSON","output":"{\n  \"Prices\": [\n    {\n      \"Item\": \"Tea\",\n      \"Price\": 12.5,\n      \"Sold on\": \"2024-01-15\",\n      \"Total\": 25\n    },\n    {\n      \"Item\": \"Coffee, ground\",\n      \"Price\": 1234.5,\n      \"Sold on\": \"2024-02-15\",\n      \"Total\": 2469\n    }\n  ],\n  \"Notes\": [\n    {\n      \"Name\": \"Ann\",\n      \"Note\": null\n    },\n    {\n      \"Name\": \"Bob\",\n      \"Note\": \"call back\"\n    }\n  ]\n}"}}
        howToTitle="How to convert Excel to JSON"
        howTo={[
          "Choose an .xlsx, .xls, .ods or .csv file in the upload area; the conversion starts on its own.",
          "If the workbook has several sheets, their names appear while it is read, and \"Cancel\" stops the work.",
          "Click \"Download\" to save converted.json, indented with two spaces.",
        ]}
        specs={[
          { label: "Input", value: "XLSX, XLS, ODS or CSV file" },
          { label: "Output", value: "JSON object with one array of row objects per sheet" },
          { label: "On a computer", value: `up to ${MAX_FILE_SIZE_LABEL} and ${MAX_ROWS.toLocaleString('en-US')} rows across all sheets` },
          { label: "On phones, iPhone and iPad", value: `up to ${MOBILE_MAX_FILE_SIZE_LABEL} and ${MOBILE_MAX_ROWS.toLocaleString('en-US')} rows across all sheets` },
        ]}
        privacy={"Your spreadsheet is read by a background worker in your browser with the SheetJS library and is not uploaded. What can reach us is an error report: the error text after file names and quoted text are removed, the tool name, and the name and version of your browser."}
        faqs={[
          { q: "Are empty cells included?", a: "Yes, as null. Every row of a sheet has the same keys, so code that reads a Note property finds null instead of a missing key. Rows that are completely empty are skipped." },
          { q: "Are dates converted to text?", a: "Yes, to ISO 8601: 2024-01-15, or 2024-02-29T13:45:00 when the cell has a time, with no time zone added. Without this step an Excel date would come out as a serial number such as 45306." },
          { q: "Can I choose which sheets to convert?", a: "No. Every sheet is converted, hidden ones included, each under its own name in the JSON. Delete the arrays you do not need afterwards, or save the sheets you want as a separate workbook first." },
          { q: "Are duplicate column headers kept?", a: "Yes. When two columns share a header such as name, the second one becomes name_1 in each row object, so no value is overwritten." },
          { q: "How big can the file be?", a: `${MAX_FILE_SIZE_LABEL} and ${MAX_ROWS.toLocaleString('en-US')} rows, counting all sheets, on a computer; ${MOBILE_MAX_FILE_SIZE_LABEL} and ${MOBILE_MAX_ROWS.toLocaleString('en-US')} rows on phones, iPhone and iPad. Split a larger workbook into several files and convert them one by one.` },
        ]}
        tips={[
          "For CSV files instead of JSON, one per sheet, use Excel to CSV.",
        ]}
      />
    </div>
  );
}

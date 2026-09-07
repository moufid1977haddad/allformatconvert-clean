'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_ROWS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_ROWS, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';

const MAX_ROWS_LABEL = MAX_ROWS.toLocaleString();
const MOBILE_MAX_ROWS_LABEL = MOBILE_MAX_ROWS.toLocaleString();

// Time estimate breakpoints: [.xlsx file size in MB, seconds], measured in
// Node (file read + XLSX.read + sheet_to_csv) and scaled by 1.55x to match
// real Chrome production behavior (same ratio confirmed for csv-to-excel).
const TIME_ESTIMATE_BREAKPOINTS = [
  [0, 0],
  [14.6, 2.3],
  [24.4, 3.7],
  [34.2, 5.3],
  [48.9, 7.5],
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

export default function ExcelToCsvPage() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [converting, setConverting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState('');
  const [sheetNames, setSheetNames] = useState(null);
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
      setFile(null);
      setFileName('');
      return;
    }
    setFile(f);
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
    setStatus('Cancelled.');
  };

  const convertFile = (f) => {
    setError('');
    setStatus('');
    setProgress(0);
    setPhase('reading');
    setSheetNames(null);
    setConverting(true);

    const worker = new Worker(new URL('./excelToCsv.worker.js', import.meta.url), { type: 'module' });
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
        const url = URL.createObjectURL(msg.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = msg.isZip ? 'converted.zip' : 'converted.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus(
          msg.isZip
            ? `Downloaded! ${msg.sheetNames.length} sheets zipped as separate CSVs, ${msg.rowCount.toLocaleString()} rows total.`
            : `Downloaded! ${msg.rowCount.toLocaleString()} rows.`
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
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">Excel to CSV</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Convert Excel files to CSV</p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center mb-8">Supports workbooks up to {maxRowsLabel} rows{isMobile ? ' on this device' : ''} (including the header row, files up to {maxFileLabel}). Conversion runs in the background — this tab stays responsive.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || 'Click or drop an Excel file here'}</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>
          {timeEstimate && !converting && !error && fileName && (
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">Estimated conversion time: {timeEstimate}</p>
          )}
          {sheetNames && sheetNames.length > 1 && (
            <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm rounded-lg px-4 py-3">
              {sheetNames.length} sheets detected: {sheetNames.join(', ')} — each will be converted to its own CSV, packed into one .zip.
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {converting && (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={phase === 'building' ? 'Building CSV…' : phase === 'parsing' ? 'Parsing workbook…' : 'Reading file…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          )}
          {status && !converting && <p className="text-center text-sm text-green-600 dark:text-green-400">{status}</p>}
        </div>
      </div>
      <SeoContent
        title="Excel to CSV"
        description="Excel to CSV reads an uploaded .xlsx or .xls file using the xlsx library and converts it to comma-separated CSV text, entirely in your browser — your file is never uploaded to a server. Reading and parsing run off the main thread in a Web Worker, so the page stays responsive even on large files. A single-sheet workbook downloads as one .csv file, exactly as before; a workbook with multiple sheets downloads as a .zip containing one .csv per sheet, named after the real sheet name, so no sheet is ever silently dropped. The tool tells you up front how many sheets it found and their names."
        howTo={[
          "Click the upload area and select an .xlsx or .xls file.",
          "Conversion starts automatically in the background — no button click needed.",
          "If the workbook has more than one sheet, you'll see how many were detected and their names.",
          "The result downloads automatically — converted.csv for a single sheet, or converted.zip (one .csv per sheet) for multiple.",
          "Open the CSV(s) in a spreadsheet app or text editor."
        ]}
        faqs={[
          { q: "Is my file uploaded to a server?", a: "No, the conversion happens entirely in your browser using the xlsx library, in a background Web Worker so the page never freezes." },
          { q: "What happens with a workbook that has multiple sheets?", a: "Every sheet is converted — you get a .zip file containing one .csv per sheet, each named after the real sheet name. The tool shows you the sheet count and names before the download starts." },
          { q: "Why is there a row and file-size limit?", a: `Excel files can't be parsed incrementally the way plain text can, so converting a very large workbook risks the tab running out of memory or taking too long. Uploaded files are capped at ${maxRowsLabel} rows across all sheets combined and ${maxFileLabel}${isMobile ? ' on this device' : ' on desktop'}, measured to convert reliably.` },
          { q: "Will formatting like colors or fonts carry over?", a: "No, CSV is plain text, so only cell values transfer — formatting, formulas' calculated results (not the formulas themselves as text), and structure like merged cells don't." },
          { q: "Can I download the CSV as a file, or is it only shown on the page?", a: "It downloads automatically — there's no inline preview, since a large workbook's CSV output can be too big to safely render on the page." }
        ]}
        tips={[
          "Multi-sheet workbooks now come back as a .zip with one .csv per sheet — check the sheet names shown on the page before downloading to confirm nothing you need is missing.",
          "Merged cells and complex formatting won't survive the conversion — only the underlying values do.",
          "Since it uses a proper spreadsheet-parsing library rather than naive text splitting, values containing commas or quotes are handled correctly.",
          "For a very large workbook, split it into smaller files first if it exceeds the row or size limit."
        ]}
      />
    </div>
  );
}

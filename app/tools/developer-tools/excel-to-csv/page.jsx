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
  const [error, setError] = useToolError('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [converting, setConverting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState('');
  const [sheetNames, setSheetNames] = useState(null);
  // P24 (03/10): separator and BOM, as convertcsv.com offers (a ";" CSV is what Excel expects in most of Europe)
  const [delimiter, setDelimiter] = useState(',');
  const [bom, setBom] = useState(false);
  const [decimalComma, setDecimalComma] = useState(false); // P24 review: numbers as 3,14 for a European Excel
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
      setFile(null);
      setFileName('');
      return;
    }
    // P21: an empty file, or something that is not a workbook, gets a sentence instead of a "result" read as text.
    const problem = await spreadsheetProblem(f, { allowCsv: false });
    if (problem) { setError(problem); setFile(null); setFileName(''); return; }
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
        offer(msg.blob, msg.isZip ? 'converted.zip' : 'converted.csv');
        setStatus(
          msg.isZip
            ? `ZIP ready: ${msg.sheetNames.length} sheets zipped as separate CSVs, ${msg.rowCount.toLocaleString()} rows total.`
            : `CSV ready: ${msg.rowCount.toLocaleString()} rows.`
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
    worker.postMessage({ file: f, maxRows, delimiter, bom, decimalComma });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">Excel to CSV</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Convert Excel files to CSV</p>
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Supports workbooks up to {maxRowsLabel} rows{isMobile ? ' on this device' : ''} (including the header row, files up to {maxFileLabel}). The conversion runs in a background worker; the Cancel button stops it.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300">
            <label className="flex items-center gap-2 min-w-0 max-w-full">Separator
              <select id="x2c-delimiter" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} disabled={converting} className="border border-neutral-200 rounded px-2 py-1 bg-white dark:bg-neutral-800 min-w-0 max-w-full">
                <option value=",">Comma ,</option><option value=";">Semicolon ; (Excel in most of Europe)</option><option value="tab">Tab</option><option value="|">Pipe |</option>
              </select>
            </label>
            <label className="flex items-center gap-2"><input id="x2c-decimal" type="checkbox" checked={decimalComma} onChange={(e) => setDecimalComma(e.target.checked)} disabled={converting} /> Decimal comma (3,14 — with the semicolon, for Excel in Europe)</label>
            <label className="flex items-center gap-2"><input id="x2c-bom" type="checkbox" checked={bom} onChange={(e) => setBom(e.target.checked)} disabled={converting} /> Add a UTF-8 BOM (Excel then reads accents correctly)</label>
          </div>
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || <UploadPrompt what="an Excel or ODS file" />}</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.ods" className="hidden" onChange={handleFile} />
          </div>
          {timeEstimate && !converting && !error && fileName && (
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">Estimate from our tests on a desktop computer: {timeEstimate}</p>
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
          {!converting && <DownloadReady file={result} />}
        </div>
      </div>
      <SeoContent
        title="Excel to CSV"
        description={"Excel to CSV turns each sheet of an .xlsx, .xls or .ods workbook into CSV. A workbook with one sheet gives one .csv file; with several sheets you get a .zip holding one .csv per sheet, named after the sheet, hidden sheets included. Cells are written as values: formulas give the result saved in the file, dates become ISO text such as 2024-01-15, and numbers with a format of their own, such as a percentage or a dollar amount, are written as Excel shows them; colors and fonts are dropped. Options set the separator, a decimal comma for European Excel and a byte order mark (UTF-8 BOM). Conversion starts as soon as you choose the file, in your browser."}
        example={{"caption":"A one-sheet workbook with date cells and formulas, converted with \"Separator\" set to semicolon and \"Decimal comma\" ticked:","inputLabel":"Workbook","input":"Sheet Prices:\nItem | Price | Sold on | Total\nTea | 12.5 | 2024-01-15 (date cell) | =B2*2 → 25\nCoffee, ground | 1234.5 | 2024-02-15 (date cell) | =B3*2 → 2469","outputLabel":"CSV","output":"Item;Price;Sold on;Total\nTea;12,5;2024-01-15;25\nCoffee, ground;1234,5;2024-02-15;2469"}}
        howToTitle="How to convert Excel to CSV"
        howTo={[
          "Set \"Separator\" first, and tick \"Decimal comma\" or \"Add a UTF-8 BOM\" if you need them: they apply to the next file you choose.",
          "Choose an .xlsx, .xls or .ods file in the upload area; the conversion starts at once and \"Cancel\" stops it.",
          "If the workbook has several sheets, their names are listed while it is read.",
          "Click \"Download\" to save converted.csv, or converted.zip with one .csv per sheet.",
        ]}
        specs={[
          { label: "Input", value: "XLSX, XLS or ODS workbook" },
          { label: "Output", value: "CSV for one sheet, ZIP of CSV files for several" },
          { label: "On a computer", value: `up to ${MAX_FILE_SIZE_LABEL} and ${MAX_ROWS.toLocaleString('en-US')} rows, all sheets together` },
          { label: "On phones, iPhone and iPad", value: `up to ${MOBILE_MAX_FILE_SIZE_LABEL} and ${MOBILE_MAX_ROWS.toLocaleString('en-US')} rows, all sheets together` },
          { label: "Separators", value: "comma, semicolon, tab or pipe" },
        ]}
        privacy={"The workbook is opened and converted by a background worker in your browser, with the SheetJS library; it is not uploaded, and the CSV or ZIP is created in the page. Should an error happen, we get its text without the file name or quoted content, along with the tool name and the browser name and version."}
        faqs={[
          { q: "Do formulas come out as their results?", a: "Yes. Each formula cell is written with the result saved in the workbook, so =B2*2 gives 25 in the CSV, not the formula text. Colors, fonts and comments are dropped, but a number format such as a percentage or a currency is kept in the text." },
          { q: "Can I make a CSV for Excel in France or Germany?", a: "Yes. Choose \"Semicolon\" in \"Separator\", tick \"Decimal comma\" so numbers read 12,5, and tick \"Add a UTF-8 BOM\" so Excel opens accents correctly. Set these before choosing the file, because the conversion starts as soon as the file is picked." },
          { q: "Are all sheets converted?", a: "Yes, hidden sheets included. With more than one sheet you download converted.zip, holding one .csv per sheet named after it; characters a file name cannot hold, such as < > | or a double quote, become underscores, and a repeated name gets (2)." },
          { q: "Are dates written as numbers?", a: "No. A cell formatted as a date is written as ISO 8601 text, 2024-01-15, or 2024-02-29T13:45:00 when it has a time, also for workbooks on the 1904 date system of old Mac Excel." },
          { q: "How large can the workbook be?", a: `${MAX_FILE_SIZE_LABEL} and ${MAX_ROWS.toLocaleString('en-US')} rows across all sheets on a computer, ${MOBILE_MAX_FILE_SIZE_LABEL} and ${MOBILE_MAX_ROWS.toLocaleString('en-US')} rows on phones, iPhone and iPad. A workbook has to be read whole before any row exists, so split a bigger one into several files first.` },
        ]}
        tips={[
          "To get JSON instead, with one array of rows per sheet, use Excel to JSON.",
        ]}
      />
    </div>
  );
}

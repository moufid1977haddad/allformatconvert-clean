'use client';
import { textFileProblem } from '../../../lib/fileChecks';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_ROWS, MOBILE_MAX_ROWS } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { detectDelimiter, CSV_DELIMITERS } from '../../../lib/csvParser';
import { sniffCsvFile } from '../../../lib/csvEncoding';
import CsvReadOptions, { numbersNote } from '../../../components/CsvReadOptions';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { formatBytes } from '../../../lib/formatBytes';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

// Only the first 8KB is needed to see several rows -- detectDelimiter only
// looks at the first 10 non-empty logical lines anyway, so sampling more of
// a large paste or file would just cost time without changing the result.
const DELIMITER_SAMPLE_BYTES = 8192;
function delimiterLabel(value) {
  return CSV_DELIMITERS.find((d) => d.value === value)?.label || value;
}

// Coarse defense-in-depth backstop for pathological inputs (e.g. a handful
// of enormous rows) that could slip under the row-count cap below while
// still being far too large to process reliably. MAX_ROWS, checked during
// parsing, is the limit that actually matters for realistic CSVs.
const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024; // 250 MB
const MAX_FILE_SIZE_LABEL = '250 MB';
const MAX_ROWS_LABEL = MAX_ROWS.toLocaleString();
const MOBILE_MAX_ROWS_LABEL = MOBILE_MAX_ROWS.toLocaleString();

// Time estimate breakpoints: [CSV size in MB, seconds], measured in Node
// (parse + sheet build + xlsx write) against the new 200,000-row cap and
// scaled by 1.55x to match real Chrome production behavior -- that ratio
// was confirmed separately against a 93.3MB/500,000-row file that measured
// 30.3s in-browser vs. 19.87s in Node (a 1.525x ratio). Shown to the user
// immediately on file selection, before they click Convert.
const TIME_ESTIMATE_BREAKPOINTS = [
  [0, 0],
  [3.2, 1.1],
  [8.1, 3.3],
  [16.3, 5.7],
  [24.6, 8.7],
  [32.9, 12.5],
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
  // Beyond the last measured point: extrapolate at the last segment's slope.
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

export default function CsvToExcelPage() {
  const [file, setFile] = useState(null);
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useToolError('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [converting, setConverting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState('');
  const [bookType, setBookType] = useState('xlsx');
  const [delimiterChoice, setDelimiterChoice] = useState('auto');
  const [detectedDelimiter, setDetectedDelimiter] = useState(',');
  const [encodingChoice, setEncodingChoice] = useState('auto');
  const [detectedEncoding, setDetectedEncoding] = useState('utf-8');
  const [typeNumbers, setTypeNumbers] = useState(true);
  const inputRef = useRef();
  const workerRef = useRef(null);
  const [result, offer, clearResult] = useDownloadable();

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const effectiveMaxRows = isMobile ? MOBILE_MAX_ROWS : MAX_ROWS;
  const effectiveMaxRowsLabel = isMobile ? MOBILE_MAX_ROWS_LABEL : MAX_ROWS_LABEL;

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    setStatus('');
    clearResult();
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`This file is ${formatBytes(f.size)}, which is over the ${MAX_FILE_SIZE_LABEL} limit for this tool. Try splitting it into smaller files first.`);
      setFile(null);
      setFileName('');
      return;
    }
    // P21: an empty, binary or other-kind file gets a sentence, never a "conversion" (robustness bench).
    const problem = await textFileProblem(f, 'CSV');
    if (problem) { setError(problem); setFile(null); setFileName(''); return; }
    setFile(f);
    setFileName(f.name);
    setInput('');
    setDelimiterChoice('auto');
    setTimeEstimate(formatEstimate(estimateSeconds(f.size)));
    setEncodingChoice('auto');
    // Encoding first (an Excel "CSV" is not UTF-8), then the delimiter on correctly decoded text.
    sniffCsvFile(f).then(({ encoding, text }) => {
      setDetectedEncoding(encoding);
      setDetectedDelimiter(detectDelimiter(text.slice(0, DELIMITER_SAMPLE_BYTES)));
    }).catch(() => {});
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

  const convert = () => {
    if (!file && !input) return;
    setError('');
    setStatus('');
    clearResult();
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
        offer(msg.blob, `converted.${msg.bookType}`);
        setProgress(100);
        setConverting(false);
        workerRef.current = null;
        setStatus(`Excel file ready: ${msg.rowCount.toLocaleString()} rows.` + numbersNote(msg));
      } else if (msg.type === 'row_limit') {
        setConverting(false);
        workerRef.current = null;
        setError(`This CSV has more than ${msg.limit.toLocaleString()} rows, counting the header row as row 1 — in-browser conversion becomes unreliable beyond that point. If your data itself has exactly ${msg.limit.toLocaleString()} rows plus a header, that's one row over the limit. Please split your file into smaller pieces and convert them separately.`);
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
    const delimiter = delimiterChoice === 'auto' ? detectedDelimiter : delimiterChoice;
    const encoding = encodingChoice === 'auto' ? detectedEncoding : encodingChoice;
    worker.postMessage(file ? { file, maxRows: effectiveMaxRows, bookType, delimiter, encoding, typeNumbers } : { text: input, maxRows: effectiveMaxRows, bookType, delimiter, typeNumbers });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">CSV to Excel</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Convert CSV to Excel format</p>
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Supports CSVs up to {effectiveMaxRowsLabel} rows (including the header row){isMobile ? ' on this device' : ''} (files up to {MAX_FILE_SIZE_LABEL}). The conversion runs in a background worker; the Cancel button stops it.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || <UploadPrompt what="a .csv file" />}</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>
          <TextArea
            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-48 resize-none font-mono text-neutral-800 dark:text-neutral-200"
            placeholder="...or paste CSV here"
            value={input}
            onChange={e => {
              const val = e.target.value;
              setInput(val);
              clearResult();
              setFileName('');
              setFile(null);
              setDelimiterChoice('auto');
              setDetectedDelimiter(detectDelimiter(val.slice(0, DELIMITER_SAMPLE_BYTES)));
              setTimeEstimate(val ? formatEstimate(estimateSeconds(new Blob([val]).size)) : '');
            }}
            disabled={converting}
          />
          {timeEstimate && !converting && !error && (
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">Estimate from our tests on a desktop computer: {timeEstimate}</p>
          )}
          {!converting && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <label htmlFor="csv-delimiter" className="text-neutral-500 dark:text-neutral-400">Delimiter:</label>
                <select
                  id="csv-delimiter"
                  value={delimiterChoice}
                  onChange={e => setDelimiterChoice(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-1.5 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="auto">Auto-detected: {delimiterLabel(detectedDelimiter)}</option>
                  {CSV_DELIMITERS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="book-type" className="text-neutral-500 dark:text-neutral-400">Output format:</label>
                <select
                  id="book-type"
                  value={bookType}
                  onChange={e => setBookType(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-1.5 text-neutral-800 dark:text-neutral-200"
                >
                  <option value="xlsx">.xlsx (Excel 2007+)</option>
                  <option value="xls">.xls (legacy Excel 97-2003)</option>
                </select>
              </div>
            </div>
          )}
          {!converting && (
            <CsvReadOptions showEncoding={!!file} encodingChoice={encodingChoice} detectedEncoding={detectedEncoding} onEncoding={setEncodingChoice} numbers={typeNumbers} onNumbers={setTypeNumbers} numbersLabel="Numbers as number cells" />
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {converting ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={phase === 'building' ? 'Building spreadsheet…' : 'Reading and parsing…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={!file && !input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-gray-600 dark:disabled:text-neutral-500 text-white rounded-xl py-3 font-semibold transition">Convert to .{bookType}</button>
          )}
          {status && !converting && <p className="text-center text-sm text-green-600 dark:text-green-400">{status}</p>}
          {!converting && <DownloadReady file={result} />}
        </div>
      </div>
      <SeoContent
        title="CSV to Excel"
        description={"CSV to Excel builds an Excel workbook from a .csv file or from CSV text you paste. You choose .xlsx (Excel 2007 and later) or the older .xls format. The separator (comma, semicolon, tab or pipe) and, for a file, the character encoding are detected, and both can be changed. Columns that hold only numbers become number cells, European decimal commas included, while codes with a leading zero such as 007 stay text. The workbook has a single sheet named Sheet1 and no formatting. The CSV is parsed and the workbook written by a worker in your browser."}
        example={{"caption":"A semicolon CSV pasted into the box, and the status line and cells of the .xlsx the tool returns (read back cell by cell):","inputLabel":"CSV","input":"Product;Price;Code\nCafé;12,5;007\nThé;3;010","outputLabel":"Workbook","output":"Excel file ready: 3 rows. 1 column read as numbers (decimal comma: 12,5 → 12.5).\n\nSheet \"Sheet1\":\nA1 Product (text) · B1 Price (text) · C1 Code (text)\nA2 Café (text) · B2 12.5 (number) · C2 007 (text)\nA3 Thé (text) · B3 3 (number) · C3 010 (text)"}}
        howToTitle="How to convert CSV to Excel"
        howTo={[
          "Choose a .csv file in the upload area, or paste CSV text into the box below it.",
          "Check \"Delimiter:\" and, for a file, \"Encoding:\"; each shows what was detected and can be changed.",
          "Pick .xlsx or .xls under \"Output format:\" and keep or untick \"Numbers as number cells\".",
          "Click the \"Convert to\" button, which names the chosen format; \"Cancel\" stops a long conversion.",
          "Click \"Download\" to save converted.xlsx or converted.xls.",
        ]}
        specs={[
          { label: "Input", value: `.csv file up to ${MAX_FILE_SIZE_LABEL}, or pasted CSV text` },
          { label: "Output", value: "XLSX (Excel 2007+) or XLS (Excel 97-2003), one sheet named Sheet1" },
          { label: "Rows on a computer", value: `${MAX_ROWS.toLocaleString('en-US')}, header row included` },
          { label: "Rows on phones, iPhone and iPad", value: `${MOBILE_MAX_ROWS.toLocaleString('en-US')}, header row included` },
          { label: "Excel limits checked", value: ".xls holds 65,536 rows and 256 columns; any cell holds 32,767 characters" },
        ]}
        privacy={"The CSV is read and the workbook is written by a background worker inside your browser; the file you choose and the text you paste are not uploaded. When something goes wrong, we receive an error report: the error text with file names and quoted text removed, the tool name, and your browser name and version."}
        faqs={[
          { q: "Can I open a semicolon CSV saved by Excel in Europe?", a: "Yes. The separator is detected from the first lines, so a file such as Name;Price keeps its columns, and a decimal comma like 12,5 becomes the number 12.5 in its cell. If a column is split in the wrong place, choose the separator yourself in \"Delimiter:\"." },
          { q: "Will accents from an Excel CSV come out right?", a: "Yes, in most cases. A file in UTF-8, or one with a byte order mark, is recognised; otherwise the tool assumes the Windows code page of your browser language, which is what Excel uses when it saves CSV. If accents still look wrong, pick another code page under \"Encoding:\" and convert again." },
          { q: "Are numbers turned into real number cells?", a: "Yes, for columns where every value is a number. A column with a code that starts with zero, such as 007 or 02134, or a value with more than 15 significant digits stays text so nothing is lost. Untick \"Numbers as number cells\" to keep every cell as text." },
          { q: "How many rows can I convert?", a: `${MAX_ROWS.toLocaleString('en-US')} rows on a computer and ${MOBILE_MAX_ROWS.toLocaleString('en-US')} on phones, iPhone and iPad, counting the header row; a file can be up to ${MAX_FILE_SIZE_LABEL}, and pasted text has the same row limit. The .xls format stops at 65,536 rows and 256 columns, so choose .xlsx for larger sheets.` },
        ]}
        tips={[
          "A cell longer than 32,767 characters stops the conversion with its row and column named; shorten that value and convert again.",
          "To turn a workbook back into CSV, with a semicolon or tab separator, use Excel to CSV.",
        ]}
      />
    </div>
  );
}

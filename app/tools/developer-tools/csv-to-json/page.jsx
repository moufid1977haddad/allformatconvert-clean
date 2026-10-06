'use client';
import { textFileProblem } from '../../../lib/fileChecks';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_ROWS, MOBILE_MAX_ROWS, PASTE_MAX_ROWS } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { detectDelimiter, CSV_DELIMITERS } from '../../../lib/csvParser';
import { sniffCsvFile } from '../../../lib/csvEncoding';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import CsvReadOptions, { numbersNote } from '../../../components/CsvReadOptions';
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
  const [shape, setShape] = useState('objects'); // P24: objects / arrays / JSON Lines
  const [error, setError] = useToolError('');
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [converting, setConverting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState('');
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

  const fileMaxRows = isMobile ? MOBILE_MAX_ROWS : MAX_ROWS;
  const fileMaxRowsLabel = isMobile ? MOBILE_MAX_ROWS_LABEL : MAX_ROWS_LABEL;

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    setStatus('');
    setOutput('');
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
    setStatus('Canceled.');
  };

  const convert = () => {
    if (!file && !input) return;
    setError('');
    setStatus('');
    setOutput('');
    clearResult();
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
          offer(msg.blob, shape === 'jsonl' ? 'converted.jsonl' : 'converted.json');
          setStatus(`Converted ${msg.rowCount.toLocaleString()} rows.` + numbersNote(msg) + (msg.notes?.length ? ` Note: ${msg.notes.join('; ')}.` : ''));
        } else {
          setOutput(msg.json);
          setStatus(`Converted! ${msg.rowCount.toLocaleString()} rows.` + numbersNote(msg) + (msg.notes?.length ? ` Note: ${msg.notes.join('; ')}.` : ''));
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
    const delimiter = delimiterChoice === 'auto' ? detectedDelimiter : delimiterChoice;
    const encoding = encodingChoice === 'auto' ? detectedEncoding : encodingChoice;
    worker.postMessage(file ? { file, mode, maxRows, delimiter, encoding, typeNumbers, shape } : { text: input, mode, maxRows, delimiter, typeNumbers, shape });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">CSV to JSON</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Convert CSV to JSON format</p>
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Uploaded files: up to {fileMaxRowsLabel} rows{isMobile ? ' on this device' : ''} (including the header row, files up to {MAX_FILE_SIZE_LABEL}). Pasted text: up to {PASTE_MAX_ROWS_LABEL} rows. The conversion runs in a background worker; the Cancel button stops it.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || <UploadPrompt what="a .csv file" />}</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">...or paste CSV Input</label>
              <TextArea
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-64 resize-none font-mono text-neutral-800 dark:text-neutral-200"
                placeholder="name,age,city..."
                value={input}
                onChange={e => {
                  const val = e.target.value;
                  setInput(val);
                  clearResult();
                  setFileName('');
                  setFile(null);
                  setDelimiterChoice('auto');
                  setDetectedDelimiter(detectDelimiter(val.slice(0, DELIMITER_SAMPLE_BYTES)));
                  setTimeEstimate('');
                }}
                disabled={converting}
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">JSON Output</label>
              <TextArea aria-label="JSON Output" className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-64 resize-none font-mono text-neutral-800 dark:text-neutral-200" value={output} readOnly />
            </div>
          </div>
          {timeEstimate && !converting && !error && (
            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">Estimate from our tests on a desktop computer: {timeEstimate}</p>
          )}
          {!converting && (
            <div className="flex items-center justify-center gap-2 text-sm">
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
          )}
          {!converting && (
            <CsvReadOptions showEncoding={!!file} encodingChoice={encodingChoice} detectedEncoding={detectedEncoding} onEncoding={setEncodingChoice} numbers={typeNumbers} onNumbers={setTypeNumbers} numbersLabel="Numbers as numbers" />
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
          <label className="col-span-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">Output
            <select id="c2j-shape" value={shape} onChange={(e) => setShape(e.target.value)} disabled={converting} className="border border-neutral-200 rounded px-2 py-1 bg-white dark:bg-neutral-800">
              <option value="objects">Array of objects (one per row)</option>
              <option value="arrays">Array of arrays (header row first)</option>
              <option value="jsonl">JSON Lines (one object per line)</option>
            </select>
          </label>
              <button onClick={convert} disabled={!file && !input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-gray-600 dark:disabled:text-neutral-500 text-white rounded-xl py-3 font-semibold transition">Convert</button>
              <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-gray-600 dark:disabled:text-neutral-500 text-white rounded-xl py-3 font-semibold transition">Copy</button>
            </div>
          )}
          {status && !converting && <p className="text-center text-sm text-green-600 dark:text-green-400">{status}</p>}
          {!converting && <DownloadReady file={result} />}
        </div>
      </div>
      <SeoContent
        title="CSV to JSON"
        description={"CSV to JSON reads a .csv file or pasted CSV and writes JSON in one of three shapes: an array of objects whose keys come from the header row, an array of arrays with the header row first, or JSON Lines with one object per line. The separator and a file's encoding are detected. Columns made only of numbers become JSON numbers, while values with a leading zero stay strings. The result of a file is offered as a download; the result of pasted text appears in the output box. Excel workbooks are not read here."}
        example={SEO.example}
        howToTitle="How to convert CSV to JSON"
        howTo={[
          "Choose a .csv file in the upload area, or paste CSV into \"...or paste CSV Input\".",
          "Check \"Delimiter:\" and, for a file, \"Encoding:\".",
          "Pick a shape under \"Output\" and keep or untick \"Numbers as numbers\".",
          "Click \"Convert\".",
          "For a file, click \"Download\" to save converted.json, or converted.jsonl for JSON Lines; for pasted text, use \"Copy\".",
        ]}
        specs={[
          { label: "Input", value: `.csv file up to ${MAX_FILE_SIZE_LABEL}, or pasted CSV` },
          { label: "Output", value: "JSON array of objects, JSON array of arrays, or JSON Lines (.jsonl)" },
          { label: "Rows from a file on a computer", value: `${MAX_ROWS.toLocaleString('en-US')}, header row included` },
          { label: "Rows from a file on phones and tablets", value: `${MOBILE_MAX_ROWS.toLocaleString('en-US')}, header row included` },
          { label: "Rows of pasted text", value: `${PASTE_MAX_ROWS.toLocaleString('en-US')} on every device` },
        ]}
        privacy={"Parsing and building the JSON happen in a background worker in your browser. Your CSV file and the text you paste are not uploaded. A failure, whether shown on the page or not, sends us a short report holding the cleaned error text, this tool's name and your browser and its version, never your data itself."}
        faqs={[
          { q: "Are columns with the same header kept?", a: "Yes. With \"Array of objects\" or JSON Lines, a second column named name becomes name_2, an empty header becomes column_ followed by its position, and values beyond the last header also get a column_ key. The status line lists each rename. \"Array of arrays\" keeps the header row exactly as written." },
          { q: "Do numeric columns become JSON numbers?", a: "Yes, when every value in a column is a number; in a semicolon file a decimal comma is read too, so 12,5 becomes 12.5. Values with a leading zero, such as 02134, and numbers with more than 15 significant digits stay strings. Untick \"Numbers as numbers\" to keep all values as strings." },
          { q: "Can I get JSON Lines instead of one array?", a: "Yes. Choose \"JSON Lines (one object per line)\" under \"Output\": each row becomes one compact JSON object on its own line, the format many log and data tools read. A file converted this way downloads as converted.jsonl." },
          { q: "How large a CSV can I convert?", a: `${MAX_ROWS.toLocaleString('en-US')} rows from a file on a computer and ${MOBILE_MAX_ROWS.toLocaleString('en-US')} on phones and tablets, header row included, for files up to ${MAX_FILE_SIZE_LABEL}. Pasted text stops at ${PASTE_MAX_ROWS.toLocaleString('en-US')} rows on every device, because it is held in the page itself, so upload the file instead for more rows.` },
        ]}
        tips={[
          "To turn the JSON back into CSV, use JSON to CSV, which also flattens nested objects into dotted columns.",
        ]}
        related={SEO.related}
      />
    </div>
  );
}

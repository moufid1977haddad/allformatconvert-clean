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
  const [dialect, setDialect] = useState('standard'); // P24: quoting and escaping of the target database
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
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
    setStatus('Cancelled.');
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
          offer(msg.blob, 'converted.sql');
          setStatus(`Converted ${msg.rowCount.toLocaleString()} rows.` + numbersNote(msg));
        } else {
          setOutput(msg.sql);
          setStatus(`Converted! ${msg.rowCount.toLocaleString()} rows.` + numbersNote(msg));
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
    worker.postMessage(file ? { file, mode, maxRows, tableName, delimiter, encoding, typeNumbers, dialect } : { text: input, mode, maxRows, tableName, delimiter, typeNumbers, dialect });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">CSV to SQL</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-center mb-2">Generate SQL INSERT statements from CSV</p>
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Uploaded files: up to {fileMaxRowsLabel} rows{isMobile ? ' on this device' : ''} (including the header row, files up to {MAX_FILE_SIZE_LABEL}). Pasted text: up to {PASTE_MAX_ROWS_LABEL} rows. The conversion runs in a background worker; the Cancel button stops it.</p>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label htmlFor="sql-dialect" className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Database</label>
            <select id="sql-dialect" value={dialect} onChange={(e) => setDialect(e.target.value)} disabled={converting} className="w-full mb-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg p-2 dark:text-white">
              <option value="standard">Standard SQL — PostgreSQL, SQLite ("quoted" names)</option>
              <option value="mysql">MySQL / MariaDB (`backticks`, backslashes escaped)</option>
              <option value="sqlserver">SQL Server ([brackets], N'unicode' strings)</option>
            </select>
            <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">Table Name</label>
            <input aria-label="Table Name" type="text" value={tableName} onChange={e => setTableName(e.target.value)} disabled={converting} className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 font-mono text-neutral-800 dark:text-neutral-200" />
          </div>
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">{fileName || <UploadPrompt what="a .csv file" />}</p>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">...or paste CSV Input</label>
              <TextArea
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-48 resize-none font-mono text-neutral-800 dark:text-neutral-200"
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
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-1">SQL Output</label>
              <TextArea aria-label="SQL Output" className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-xl p-4 text-sm h-48 resize-none font-mono text-neutral-800 dark:text-neutral-200" value={output} readOnly />
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
            <CsvReadOptions showEncoding={!!file} encodingChoice={encodingChoice} detectedEncoding={detectedEncoding} onEncoding={setEncodingChoice} numbers={typeNumbers} onNumbers={setTypeNumbers} numbersLabel="Numeric columns as INTEGER / DECIMAL" />
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
              <button onClick={convert} disabled={!file && !input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-gray-600 dark:disabled:text-neutral-500 text-white rounded-xl py-3 font-semibold transition">Convert</button>
              <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-gray-600 dark:disabled:text-neutral-500 text-white rounded-xl py-3 font-semibold transition">Copy</button>
            </div>
          )}
          {status && !converting && <p className="text-center text-sm text-green-600 dark:text-green-400">{status}</p>}
          {!converting && <DownloadReady file={result} />}
        </div>
      </div>
      <SeoContent
        title="CSV to SQL"
        description={"CSV to SQL writes a CREATE TABLE statement and one INSERT statement per data row from a .csv file or pasted CSV. Pick the database first: Standard SQL (PostgreSQL, SQLite), MySQL / MariaDB, or SQL Server. Table and column names are quoted, and strings escaped, the way that database expects. Column types are sized from your data: INTEGER, BIGINT or DECIMAL for columns of numbers, VARCHAR (NVARCHAR on SQL Server) as long as the longest value for the others. The tool only writes SQL text; it never connects to a database."}
        example={SEO.example}
        howToTitle="How to convert CSV to SQL"
        howTo={[
          "Choose the target in \"Database\" and type a \"Table Name\", or keep my_table.",
          "Add the data: a .csv file through the upload area, or CSV text in \"...or paste CSV Input\".",
          "Make sure \"Delimiter:\" shows the right separator, and for a file that \"Encoding:\" shows the right character set.",
          "Click \"Convert\".",
          "For a file, click \"Download\" to save converted.sql; for pasted text, the SQL appears in \"SQL Output\" with a \"Copy\" button.",
        ]}
        specs={[
          { label: "Input", value: `a .csv file (up to ${MAX_FILE_SIZE_LABEL}) or CSV text pasted in the page` },
          { label: "Output", value: "SQL text: CREATE TABLE plus one INSERT per row" },
          { label: "Databases", value: "Standard SQL (PostgreSQL, SQLite), MySQL / MariaDB, SQL Server" },
          { label: "Rows from a file", value: `${MAX_ROWS.toLocaleString('en-US')} on a computer, ${MOBILE_MAX_ROWS.toLocaleString('en-US')} on phones, iPhone and iPad, header row included` },
          { label: "Rows of pasted text", value: `${PASTE_MAX_ROWS.toLocaleString('en-US')} on every device` },
        ]}
        privacy={"The CSV is parsed and the SQL is written in a background worker in your browser; your file and pasted data are not uploaded, and no database is contacted. If an error occurs, its wording, cleaned of file names and quoted text, is reported to us with the tool name and your browser version."}
        faqs={[
          { q: "Are the column types sized from the data?", a: "Yes. Whole numbers of up to 9 digits give INTEGER, of 10 to 15 digits BIGINT, and decimals DECIMAL with exactly the digits they need. A value with more than 15 significant digits or an exponent makes its column text: VARCHAR (NVARCHAR on SQL Server) as long as the longest value, or TEXT, LONGTEXT or NVARCHAR(MAX) beyond the limit. Untick \"Numeric columns as INTEGER / DECIMAL\" for text columns only." },
          { q: "Are names with spaces or reserved words safe?", a: "Yes. Every table and column name is quoted for the chosen database: double quotes in Standard SQL, backticks in MySQL / MariaDB, square brackets in SQL Server, with a quote character inside a name doubled. A header such as unit price or order therefore still gives valid SQL." },
          { q: "Are apostrophes in values escaped?", a: "Yes. An apostrophe is doubled, so O'Brien is written 'O''Brien'; MySQL / MariaDB also doubles backslashes, and SQL Server strings get the N prefix. An empty cell becomes NULL in a numeric column and an empty string in a text column." },
          { q: "Is pasted CSV limited to fewer rows than a file?", a: `Yes, on a computer: pasted text stops at ${PASTE_MAX_ROWS.toLocaleString('en-US')} rows because it lives in the page, while a file can have ${MAX_ROWS.toLocaleString('en-US')} rows and be up to ${MAX_FILE_SIZE_LABEL}. On phones, iPhone and iPad both limits are ${MOBILE_MAX_ROWS.toLocaleString('en-US')} rows, header row included.` },
        ]}
        tips={[
          "Dates are not detected: change their VARCHAR or NVARCHAR type to DATE or TIMESTAMP in the CREATE TABLE statement before running it.",
          "To read INSERT statements back into a spreadsheet, use SQL to CSV.",
        ]}
        related={SEO.related}
      />
    </div>
  );
}

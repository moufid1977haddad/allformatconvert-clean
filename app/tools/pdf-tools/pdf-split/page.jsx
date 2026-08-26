'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_PAGES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_PAGES, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';

export default function PdfSplitPage() {
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloads, setDownloads] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef();
  const workerRef = useRef(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    return () => { if (workerRef.current) workerRef.current.terminate(); };
  }, []);

  const maxPages = isMobile ? MOBILE_MAX_PAGES : MAX_PAGES;
  const maxFileBytes = isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const maxFileLabel = isMobile ? MOBILE_MAX_FILE_SIZE_LABEL : MAX_FILE_SIZE_LABEL;

  const startWorker = () => {
    if (workerRef.current) workerRef.current.terminate();
    const worker = new Worker(new URL('./pdfSplit.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    return worker;
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    setStatus('');
    setDownloads([]);
    setRanges('');
    setPageCount(0);
    setFileName(f.name);

    if (f.size > maxFileBytes) {
      setError(`This file is ${(f.size / (1024 * 1024)).toFixed(0)} MB, which is over the ${maxFileLabel} limit${isMobile ? ' on this device' : ''}. Try splitting it into smaller files first.`);
      setFileName('');
      return;
    }

    setLoading(true);
    const worker = startWorker();
    worker.onmessage = (ev) => {
      const msg = ev.data;
      if (msg.type === 'loaded') {
        setPageCount(msg.pageCount);
        setLoading(false);
      } else if (msg.type === 'limit') {
        setError(`${msg.message} In-browser splitting becomes unreliable beyond that point — split the file into smaller pieces first (e.g. with a desktop PDF tool) and try again.`);
        setFileName('');
        setLoading(false);
        workerRef.current = null;
      } else if (msg.type === 'error') {
        setError('Error: ' + msg.message);
        setLoading(false);
      }
    };
    worker.onerror = (err) => {
      setError('Error: ' + (err?.message || 'unknown worker error'));
      setLoading(false);
    };
    worker.postMessage({ type: 'load', file: f, maxPages });
  };

  const cancel = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    setStatus('Cancelled.');
  };

  const split = () => {
    if (!fileName || !ranges || !workerRef.current) return;
    setLoading(true);
    setStatus('');
    setError('');
    setProgress(0);
    setDownloads([]);

    const worker = workerRef.current;
    worker.onmessage = (ev) => {
      const msg = ev.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
      } else if (msg.type === 'done') {
        setProgress(100);
        setLoading(false);
        setDownloads(msg.results.map(({ blob, name }) => ({ url: URL.createObjectURL(blob), name })));
        setStatus(`Done! ${msg.results.length} file(s).`);
      } else if (msg.type === 'error') {
        setLoading(false);
        setError('Error: ' + msg.message);
      }
    };
    worker.onerror = (err) => {
      setLoading(false);
      setError('Error: ' + (err?.message || 'unknown worker error'));
    };
    worker.postMessage({ type: 'split', ranges });
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Split PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Extract specific pages or ranges from your PDF</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Supports PDFs up to {maxPages.toLocaleString()} pages{isMobile ? ' on this device' : ''} (files up to {maxFileLabel}). Splitting runs in the background — this tab stays responsive.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{fileName ? fileName + (pageCount > 0 ? ' (' + pageCount + ' pages)' : '') : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} disabled={loading} />
          </div>
          {pageCount > 0 && (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Page ranges (e.g. 1-3, 4-6, 7)</label>
              <input type="text" value={ranges} onChange={e => setRanges(e.target.value)} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="1-3, 4-6, 7" />
              <p className="text-xs text-neutral-500 mt-1">Each range creates a separate PDF. Total pages: {pageCount}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={pageCount > 0 && ranges ? 'Splitting…' : 'Reading PDF…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={split} disabled={!fileName || !ranges || pageCount === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
              Split PDF
            </button>
          )}
          {status && !loading && <p className="text-center text-yellow-500 text-sm">{status}</p>}
          {downloads.length > 0 && !loading && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-500 text-xl font-bold">Done! {downloads.length} file(s)</div>
              {downloads.map(({ url, name }, i) => (
                <a key={i} href={url} download={name} className="block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition text-white">Download {name}</a>
              ))}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Split"
        description="PDF Split creates a separate PDF file for each comma-separated range or page number you type (e.g. '1-3, 4-6, 7'), using the pdf-lib library entirely in your browser — your file is never uploaded to a server. Reading and splitting run off the main thread in a Web Worker, so the page stays responsive even on large files. There's no page-thumbnail selector or automatic equal-parts option; ranges are entered as text."
        howTo={[
          "Click the upload area and select a PDF file — the total page count appears once it's read.",
          "Type comma-separated ranges or page numbers, e.g. \"1-3, 4-6, 7\" — each one becomes its own PDF.",
          "Click 'Split PDF' to generate the files.",
          "Click each 'Download' link to save the resulting PDFs individually."
        ]}
        faqs={[
          { q: "Is PDF Split free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I click page thumbnails to select what to split?", a: "No — there's no visual page selector. You type comma-separated ranges or page numbers as text." },
          { q: "Can I split a PDF into equal-sized parts automatically?", a: "No, there's no automatic equal-parts option — you specify each range yourself." },
          { q: "Do I get one zip file, or separate downloads?", a: "Each range you specify produces its own separate PDF download link — there's no single bundled zip." },
          { q: "Is there a page or file-size limit?", a: `Yes: up to ${MAX_PAGES.toLocaleString()} pages and ${MAX_FILE_SIZE_LABEL} on desktop (${MOBILE_MAX_PAGES.toLocaleString()} pages / ${MOBILE_MAX_FILE_SIZE_LABEL} on phones and tablets) -- measured limits to keep splitting reliable in the browser tab rather than risking a crash on an extremely large PDF.` }
        ]}
        tips={[
          "Separate ranges with commas and use a hyphen for a range (e.g. \"1-3, 5, 8-10\") — each becomes its own PDF.",
          "Page numbers are 1-indexed and match the total page count shown after upload.",
          "For many output files, you'll click through multiple individual download buttons rather than getting one zip.",
          "Double-check your range syntax before splitting, since there's no preview of which pages land in each output file."
        ]}
      />
    </div>
  );
}

'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_PAGES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_PAGES, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { planSplit } from './splitPlan';

// iLovePDF's free modes (splitPlan.js): custom ranges, a file every N pages, every page, chosen pages.
const MODES = [
  { id: 'ranges', label: 'Custom ranges' },
  { id: 'every', label: 'Every N pages' },
  { id: 'all', label: 'Every page' },
  { id: 'select', label: 'Select pages' },
];

export default function PdfSplitPage() {
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState('');
  const [mode, setMode] = useState('ranges');
  const [every, setEvery] = useState(1);
  const [merge, setMerge] = useState(false);
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
  const plan = useMemo(() => (pageCount > 0 ? planSplit({ mode, spec: ranges, every, merge }, pageCount) : null), [mode, ranges, every, merge, pageCount]);
  const needsSpec = mode === 'ranges' || mode === 'select';
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
    if (!fileName || !plan || plan.error || !workerRef.current) return;
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
        setDownloads(msg.results.map(({ blob, name, pages }) => ({ url: URL.createObjectURL(blob), name, blob, pages })));
        setStatus('');
      } else if (msg.type === 'error') {
        setLoading(false);
        setError('Error: ' + msg.message);
      }
    };
    worker.onerror = (err) => {
      setLoading(false);
      setError('Error: ' + (err?.message || 'unknown worker error'));
    };
    worker.postMessage({ type: 'split', files: plan.files, originalName: fileName });
  };

  const downloadZip = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    downloads.forEach(({ name, blob }) => zip.file(name, blob));
    // STORE: PDF streams are already compressed; deflating them again would only cost time.
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName.replace(/.pdf$/i, '') + '_split.zip';
    a.click();
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
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Split mode">
                {MODES.map((m) => (
                  <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)} disabled={loading}
                    className={`rounded-lg py-2 text-sm font-medium transition ${mode === m.id ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{m.label}</button>
                ))}
              </div>
              {needsSpec && (
                <div>
                  <label htmlFor="split-spec" className="block text-sm text-neutral-500 mb-1">{mode === 'ranges' ? 'Page ranges — each becomes its own PDF (e.g. 1-3, 4-6, 8-)' : 'Pages to extract (e.g. 2, 5, 9-12)'}</label>
                  <input id="split-spec" type="text" value={ranges} onChange={e => setRanges(e.target.value)} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder={mode === 'ranges' ? '1-3, 4-6, 8-' : '2, 5, 9-12'} />
                </div>
              )}
              {mode === 'every' && (
                <div>
                  <label htmlFor="split-every" className="block text-sm text-neutral-500 mb-1">Pages per file</label>
                  <input id="split-every" type="number" min={1} max={Math.max(1, pageCount - 1)} value={every} onChange={e => setEvery(parseInt(e.target.value, 10) || 0)} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
                </div>
              )}
              {needsSpec && (
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input type="checkbox" checked={merge} onChange={e => setMerge(e.target.checked)} disabled={loading} />
                  {mode === 'ranges' ? 'Merge all ranges into one PDF' : 'Merge the extracted pages into one PDF'}
                </label>
              )}
              <p className={`text-sm ${plan?.error && (!needsSpec || ranges) ? 'text-red-600' : 'text-neutral-500'}`}>
                {plan?.error ? (needsSpec && !ranges ? `Total pages: ${pageCount}` : plan.error) : `${plan.files.length} PDF${plan.files.length > 1 ? 's' : ''} will be created from ${pageCount} pages.${plan.files.length > 500 ? ` That many files takes a while: about ${Math.max(1, Math.round(plan.files.length * 0.105 / 60))} min (measured: 2,000 one-page files in 3.5 min).` : ''}`}
              </p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={pageCount > 0 ? 'Splitting…' : 'Reading PDF…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={split} disabled={!fileName || pageCount === 0 || !plan || !!plan.error} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
              Split PDF
            </button>
          )}
          {status && !loading && <p className="text-center text-yellow-500 text-sm">{status}</p>}
          {downloads.length > 0 && !loading && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-600 text-xl font-bold">Done! {downloads.length} PDF{downloads.length > 1 ? 's' : ''}</div>
              {downloads.length > 1 && (
                <button onClick={downloadZip} className="w-full bg-green-600 hover:bg-green-500 rounded-xl px-6 py-3 font-semibold transition text-white">Download all ({downloads.length} PDFs, ZIP)</button>
              )}
              <div className="max-h-72 overflow-y-auto space-y-2">
                {downloads.map(({ url, name, pages }, i) => (
                  <a key={i} href={url} download={name} className="block bg-white border border-green-600 text-green-700 hover:bg-green-50 rounded-xl px-4 py-2 text-sm font-semibold transition break-all">{name} · {pages} page{pages > 1 ? 's' : ''}</a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Split"
        description="PDF Split cuts a PDF the ways the leading online splitter does for free: custom ranges (each its own PDF, or all merged into one), a new file every N pages, every page as its own PDF, or chosen pages — with a ZIP of all the parts. It uses the pdf-lib library entirely in your browser, so your file is never uploaded, and runs in a Web Worker so the page stays responsive on large files. A range that does not exist in your PDF is refused with the reason, before anything is created."
        howTo={[
          "Click the upload area and select a PDF file — the total page count appears once it's read.",
          "Pick a mode — Custom ranges, Every N pages, Every page or Select pages — and type the ranges or the number of pages per file; the tool says how many PDFs will be created.",
          "Click 'Split PDF' to generate the files.",
          "Download each part, or all of them at once as a ZIP."
        ]}
        faqs={[
          { q: "Is PDF Split free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I click page thumbnails to select what to split?", a: "Not yet — pages are chosen by number (for example 2, 5, 9-12). The page count is shown as soon as the file is read, and the tool tells you before splitting if a page does not exist." },
          { q: "Can I split a PDF into equal-sized parts automatically?", a: "Yes: choose \"Every N pages\" to get a new PDF every N pages (the last one holds what is left), or \"Every page\" to get one PDF per page." },
          { q: "Do I get one zip file, or separate downloads?", a: "Both: every part has its own download link, and when there are several you can download them all at once as a ZIP. Each part is named after your file and its pages, for example report_1-3.pdf." },
          { q: "Is there a page or file-size limit?", a: `Yes: up to ${MAX_PAGES.toLocaleString()} pages and ${MAX_FILE_SIZE_LABEL} on desktop (${MOBILE_MAX_PAGES.toLocaleString()} pages / ${MOBILE_MAX_FILE_SIZE_LABEL} on phones and tablets) -- measured limits to keep splitting reliable in the browser tab rather than risking a crash on an extremely large PDF.` }
        ]}
        tips={[
          "Write \"8-\" to go from page 8 to the end, and tick \"Merge\" to put several ranges or pages into a single PDF, in the order you typed them.",
          "Page numbers are 1-indexed and match the total page count shown after upload.",
          "\"Every page\" on a long document creates many files: use \"Download all (ZIP)\" instead of clicking each link.",
          "The line under the options tells you how many PDFs will be created before you click Split.",
        ]}
      />
    </div>
  );
}

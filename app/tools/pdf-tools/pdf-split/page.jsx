'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_PAGES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_PAGES, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { planSplit } from './splitPlan';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// iLovePDF's free modes (splitPlan.js): custom ranges, a file every N pages, every page, chosen pages.
const MODES = [
  { id: 'ranges', label: 'Custom ranges' },
  { id: 'every', label: 'Every N pages' },
  { id: 'all', label: 'Every page' },
  { id: 'select', label: 'Select pages' },
  { id: 'oddeven', label: 'Odd / even pages' },
  { id: 'bookmarks', label: 'By bookmarks' },
];

export default function PdfSplitPage() {
  const [fileName, setFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState('');
  const [mode, setMode] = useState('ranges');
  const [every, setEvery] = useState(1);
  const [merge, setMerge] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useToolError('');
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
  const plan = useMemo(() => (pageCount > 0 ? planSplit({ mode, spec: ranges, every, merge, bookmarks, level }, pageCount) : null), [mode, ranges, every, merge, bookmarks, level, pageCount]);
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
    setBookmarks([]);
    setFileName(f.name);

    if (f.size > maxFileBytes) {
      setError(`This file is ${formatBytes(f.size)}, which is over the ${maxFileLabel} limit${isMobile ? ' on this device' : ''}. Try splitting it into smaller files first.`);
      setFileName('');
      return;
    }

    setLoading(true);
    const worker = startWorker();
    worker.onmessage = (ev) => {
      const msg = ev.data;
      if (msg.type === 'loaded') {
        setPageCount(msg.pageCount);
        setBookmarks(msg.bookmarks || []);
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
    setStatus('Canceled.');
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

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Split PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Extract specific pages or ranges from your PDF</p>
        <p className="text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Supports PDFs up to {maxPages.toLocaleString()} pages{isMobile ? ' on this device' : ''} (files up to {maxFileLabel}). Splitting runs in the background — this tab stays responsive.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{fileName ? fileName + (pageCount > 0 ? ' (' + pageCount + ' pages)' : '') : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} disabled={loading} />
          </div>
          {pageCount > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Split mode">
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
              {mode === 'bookmarks' && (
                <div className="text-sm text-neutral-600 space-y-1">
                  <label className="flex items-center gap-2">Split at
                    <select id="split-level" value={level} onChange={(e) => setLevel(Number(e.target.value))} disabled={loading} className="border border-neutral-200 rounded px-2 py-1 bg-white">
                      <option value={1}>top-level bookmarks (chapters)</option><option value={2}>two levels (chapters and sections)</option>
                    </select>
                  </label>
                  {plan?.files && <ol className="text-xs text-neutral-500 max-h-40 overflow-auto list-none" data-bookmark-plan>{plan.files.map((f, k) => <li key={k}>{f.label} — page{f.pages.length > 1 ? 's' : ''} {f.pages[0] + 1}{f.pages.length > 1 ? '–' + (f.pages[f.pages.length - 1] + 1) : ''}</li>)}</ol>}
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
            <button onClick={split} disabled={!fileName || pageCount === 0 || !plan || !!plan.error} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
              Split PDF
            </button>
          )}
          {status && !loading && <p className="text-center text-yellow-500 text-sm">{status}</p>}
          {downloads.length > 0 && !loading && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-600 text-xl font-bold">Done! {downloads.length} PDF{downloads.length > 1 ? 's' : ''}</div>
              <DownloadGroup zipName={fileName.replace(/\.pdf$/i, '') + '_split.zip'}>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {downloads.map(({ url, blob, name, pages }, i) => (
                    <FileDownload key={i} href={url} blob={blob} name={name} note={`${pages} page${pages > 1 ? 's' : ''}`} />
                  ))}
                </div>
              </DownloadGroup>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Split"
        description={`PDF Split turns one PDF into several. There are six modes: custom ranges (each its own file, or merged into one), a new file every N pages, every page on its own, selected pages, odd and even pages in two files, or one file per bookmark at one or two levels. Before you split, a line tells you how many PDFs will be created, and a range that does not exist is refused with the reason. Each part keeps its form fields, title and author, and the bookmarks of its pages. Parts are made by a background worker in your browser with pdf-lib, then offered one by one or as a ZIP.`}
        howToTitle="How to split a PDF into several files"
        howTo={[
          `Choose the PDF; its page count appears once it has been read.`,
          `Pick "Custom ranges", "Every N pages", "Every page", "Select pages", "Odd / even pages" or "By bookmarks", and fill in the ranges or the pages per file when asked.`,
          `Click "Split PDF".`,
          `Click "Download" for a single part, or "Download all" to get every part in one ZIP.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF` },
          { label: 'Modes', value: `Custom ranges, Every N pages, Every page, Select pages, Odd / even pages, By bookmarks` },
          { label: 'Part names', value: `Your file name plus the pages (report_1-3.pdf), plus odd or even, or plus a number and the bookmark title` },
          { label: 'Several parts', value: `One ZIP built in your browser` },
          { label: 'Size limit', value: `Shown under the title before you choose a file; smaller on phones and tablets` },
        ]}
        privacy={`Splitting happens in a Web Worker inside your browser, and the ZIP of all the parts is assembled there too; your PDF is not uploaded to our servers. A PDF with print or copy restrictions is decrypted there first, and one that asks for a password to open is refused with a pointer to PDF Unlock.`}
        faqs={[
          { q: "Can I split a PDF by chapters?", a: `Yes, if it has bookmarks. Choose By bookmarks: each top-level bookmark starts a new file, or pick two levels to cut at sections too. Pages before the first bookmark get their own file, and each part is named after its bookmark.` },
          { q: "Can I extract only some pages into one PDF?", a: `Yes. Choose Select pages, type them, for example 2, 5, 9-12, and tick Merge the extracted pages into one PDF. Without that box, each selected page becomes a file of its own.` },
          { q: "Can I split into parts of equal size?", a: `Yes, by page count. Every N pages makes a new PDF every N pages and the last one holds what is left; the number must be smaller than the page count. Splitting by size in megabytes is not offered.` },
          { q: "Do I have to download each part separately?", a: `No. When there are two or more parts, Download all saves them in one ZIP named after your file; each part also keeps its own Download button.` },
        ]}
        tips={[
          `Every page on a long PDF creates many files: take them as one ZIP rather than one by one.`,
        ]}
      />
    </div>
  );
}

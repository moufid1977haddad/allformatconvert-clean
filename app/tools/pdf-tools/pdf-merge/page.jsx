'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_TOTAL_PAGES, MAX_TOTAL_SIZE_BYTES, MAX_TOTAL_SIZE_LABEL, MOBILE_MAX_TOTAL_PAGES, MOBILE_MAX_TOTAL_SIZE_BYTES, MOBILE_MAX_TOTAL_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';
import { addImagePage } from '../../../lib/pdfImages';
import { convertOffice } from '../../../lib/officeUpload';

// P21 (02/10), format coverage: Smallpdf's Merge PDF "combine[s] PDF documents with other PDFs, Word, Excel, and
// image files like JPG and PNG" and converts them first. Here: images become a page in the browser (pdfImages: HEIC,
// WebP, GIF, BMP, TIFF, AVIF too, upright); Office documents go through the same conversion as Word / Excel /
// PowerPoint to PDF (our server; .docx through ConvertAPI) and only those are uploaded — PDFs and images never are.
const OFFICE_RE = /\.(docx?|docm|dotx?|dotm|odt|ott|rtf|wpd|xlsx?|xlsm|xlsb|xltx?|xltm|ods|ots|csv|pptx?|pptm|ppsx?|ppsm|potx?|potm|odp|otp)$/i;
const isPdf = (f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf';
const isOffice = (f) => OFFICE_RE.test(f.name);
const MERGE_ACCEPT = '.pdf,application/pdf,image/*,.heic,.heif,.tif,.tiff,.doc,.docx,.docm,.dotx,.dot,.odt,.rtf,.xls,.xlsx,.xlsm,.xlsb,.ods,.csv,.ppt,.pptx,.pptm,.ppsx,.pps,.odp';

export default function PdfMergePage() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef();
  const workerRef = useRef(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const maxPages = isMobile ? MOBILE_MAX_TOTAL_PAGES : MAX_TOTAL_PAGES;
  const maxSizeBytes = isMobile ? MOBILE_MAX_TOTAL_SIZE_BYTES : MAX_TOTAL_SIZE_BYTES;
  const maxSizeLabel = isMobile ? MOBILE_MAX_TOTAL_SIZE_LABEL : MAX_TOTAL_SIZE_LABEL;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const overSizeLimit = totalSize > maxSizeBytes;

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(prev => [...prev, ...newFiles]);
    setStatus('');
    setError('');
    setDownloadUrl(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setFiles(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  // Drag a row to a new place (computers; iLovePDF and Smallpdf reorder by dragging). The arrows stay for touch
  // screens and the keyboard.
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const moveTo = (from, to) => {
    if (from === null || from === to) return;
    setFiles(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  };

  const moveDown = (index) => {
    setFiles(prev => {
      if (index === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const cancel = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    setPhase('');
    setStatus('Cancelled.');
  };

  // Images and Office documents become PDFs first; returns the list in the same order, or null after an error.
  const prepare = async () => {
    const out = [];
    for (const f of files) {
      if (isPdf(f)) { out.push(f); continue; }
      try {
        if (isOffice(f)) {
          setStatus(`Converting ${f.name} to PDF on our server…`);
          const { blob } = await convertOffice({ file: f, endpoint: '/api/convert-to-pdf' });
          out.push(new File([blob], f.name.replace(/\.[^.]+$/, '') + '.pdf', { type: 'application/pdf' }));
        } else {
          setStatus(`Turning ${f.name} into a page…`);
          const { PDFDocument } = await import('pdf-lib');
          const doc = await PDFDocument.create();
          await addImagePage(doc, f);
          out.push(new File([await doc.save()], f.name.replace(/\.[^.]+$/, '') + '.pdf', { type: 'application/pdf' }));
        }
      } catch (e) {
        const m = String((e && e.message) || e);
        setError(m.startsWith(`${f.name}:`) ? m : `${f.name}: ${m}`);
        return null;
      }
    }
    setStatus('');
    return out;
  };

  const merge = async () => {
    if (files.length < 2) { setError('Add at least 2 files.'); return; }
    if (overSizeLimit) { setError(`These files add up to ${formatBytes(totalSize)}, over the ${maxSizeLabel} limit${isMobile ? ' on this device' : ''}. Remove a file or merge in smaller batches.`); return; }
    setLoading(true);
    setStatus('');
    setError('');
    setProgress(0);
    setPhase('merging');
    setDownloadUrl(null);
    const ready = await prepare();
    if (!ready) { setLoading(false); setPhase(''); return; }

    const worker = new Worker(new URL('./pdfMerge.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
        setPhase(msg.phase);
      } else if (msg.type === 'done') {
        setProgress(100);
        setLoading(false);
        workerRef.current = null;
        setDownloadUrl(URL.createObjectURL(msg.blob));
        setStatus(`Merged ${msg.pageCount.toLocaleString()} pages.`);
      } else if (msg.type === 'limit') {
        setLoading(false);
        workerRef.current = null;
        setError(`${msg.message} In-browser merging becomes unreliable beyond that point — split into smaller batches and merge separately.`);
      } else if (msg.type === 'error') {
        setLoading(false);
        workerRef.current = null;
        setError('Error: ' + msg.message);
      }
    };
    worker.onerror = (err) => {
      setLoading(false);
      workerRef.current = null;
      setError('Error: ' + (err?.message || 'unknown worker error'));
    };
    worker.postMessage({ files: ready, maxPages });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">Merge PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Combine PDFs — and images or Word, Excel, PowerPoint files — into one PDF. Free, no signup</p>
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Supports up to {maxPages.toLocaleString()} pages combined{isMobile ? ' on this device' : ''} (files up to {maxSizeLabel} total). Merging runs in the background — this tab stays responsive.</p>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add PDFs, images or Office files</p>
            <input ref={inputRef} type="file" accept={MERGE_ACCEPT} multiple className="hidden" onChange={handleFiles} disabled={loading} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} data-merge-row draggable={!loading}
                  onDragStart={(e) => { dragFrom.current = index; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); }}
                  onDragOver={(e) => { if (dragFrom.current === null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(index); }}
                  onDragLeave={() => setDragOver(o => (o === index ? null : o))}
                  onDrop={(e) => { e.preventDefault(); moveTo(dragFrom.current, index); dragFrom.current = null; setDragOver(null); }}
                  onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                  className={`flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border p-3 ${loading ? '' : 'cursor-grab'} ${dragOver === index ? 'border-indigo-500' : 'border-neutral-200 dark:border-neutral-700'}`}>
                  <span className="text-neutral-500 text-sm w-6">{index + 1}.</span>
                  <span className="flex-1 text-sm truncate text-neutral-700 dark:text-neutral-200">{file.name}</span>
                  <button onClick={() => moveUp(index)} disabled={loading} aria-label={`Move ${file.name} up`} className="text-neutral-500 hover:text-indigo-500 px-2">↑</button>
                  <button onClick={() => moveDown(index)} disabled={loading} aria-label={`Move ${file.name} down`} className="text-neutral-500 hover:text-indigo-500 px-2">↓</button>
                  <button onClick={() => removeFile(index)} disabled={loading} aria-label={`Remove ${file.name}`} className="text-red-400 hover:text-red-600 px-2">✕</button>
                </div>
              ))}
              <p className={`text-xs text-right ${overSizeLimit ? 'text-red-500' : 'text-neutral-400'}`}>{formatBytes(totalSize)} total</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={status || (phase === 'saving' ? 'Saving merged PDF…' : 'Merging pages…')} />
              <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={merge} disabled={files.length < 2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
              Merge PDFs
            </button>
          )}
          {status && !loading && <p className="text-center text-green-600 dark:text-green-400 text-sm">{status}</p>}
          {files.some(isOffice) && <p className="text-center text-neutral-500 text-xs">Word, Excel and PowerPoint files are converted to PDF on our server first (deleted after conversion; .docx through ConvertAPI). PDFs and images are not sent to our server: only those Office files are.</p>}
          {downloadUrl && !loading && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name="merged.pdf" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Merge PDF"
        description="Merge PDF is a free online tool that lets you combine multiple PDF files into a single document instantly. No software installation required and no signup; PDFs and images are merged in your browser, in a background Web Worker so the page stays responsive, and only a Word, Excel or PowerPoint file you add is sent to our server, to be converted to PDF first. Perfect for combining reports, contracts, invoices, scans and photos into one PDF."
        howTo={[
          "Click the upload area and select two or more files: PDFs, images (JPG, PNG, HEIC, WebP…) or Word, Excel and PowerPoint documents.",
          "Put the files in order: drag a file to its new place in the list, or use the ↑ and ↓ arrows next to it.",
          "Click the Merge PDFs button to combine all files into one.",
          "Download your merged PDF file once it's ready."
        ]}
        faqs={[
          { q: "Is Merge PDF free to use?", a: "Yes, completely free with no signup required." },
          { q: "Are my files safe?", a: "PDFs and images are merged directly in your browser, in a background Web Worker, and are never uploaded; only a Word, Excel or PowerPoint file you add is sent to our server first, to be converted to PDF (a .docx through our provider ConvertAPI, with file storage turned off), and deleted after conversion — the page says so when you add one." },
          { q: "Can I merge images or Word files with PDFs?", a: "Yes. Each image (JPG, PNG, HEIC, WebP, GIF, BMP, TIFF, AVIF) becomes a page at its own size, upright; each Word, Excel or PowerPoint document is converted to PDF first, then everything is merged in the order of the list." },
          { q: "How many PDF files can I merge at once?", a: `Up to ${MAX_TOTAL_PAGES.toLocaleString()} pages combined and ${MAX_TOTAL_SIZE_LABEL} total on desktop (${MOBILE_MAX_TOTAL_PAGES.toLocaleString()} pages / ${MOBILE_MAX_TOTAL_SIZE_LABEL} on phones and tablets) -- measured limits to keep merging reliable in the browser tab, rather than risking a crash on a very large combined document. Split larger jobs into batches and merge the results together.` },
          { q: "Does merging PDFs reduce quality?", a: "No. The merged PDF retains the full quality of all original files including images, fonts, and formatting." }
        ]}
        tips={[
          "On a phone or tablet, use the ↑ and ↓ arrows to reorder the files; dragging a file works with a mouse.",
          "You can merge scanned PDFs, form PDFs, and regular text PDFs together.",
          "For large files, the merge may take a few seconds — the progress bar tracks each file as it's added.",
          "After merging, use our PDF Compress tool to reduce the file size if needed."
        ]}
      />
    </div>
  );
}

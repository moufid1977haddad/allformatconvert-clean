'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_TOTAL_PAGES, MAX_TOTAL_SIZE_BYTES, MAX_TOTAL_SIZE_LABEL, MOBILE_MAX_TOTAL_PAGES, MOBILE_MAX_TOTAL_SIZE_BYTES, MOBILE_MAX_TOTAL_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';
import { addImagePage } from '../../../lib/pdfImages';
import { convertOffice, checkOfficeSize, officeMaxLabel } from '../../../lib/officeUpload';
import { MAX_OFFICE_STAGED_BYTES, MAX_SPREADSHEET_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import { useToolError } from '../../../lib/useToolError';

// P21 (02/10), format coverage: Smallpdf's Merge PDF "combine[s] PDF documents with other PDFs, Word, Excel, and
// image files like JPG and PNG" and converts them first. Here: images become a page in the browser (pdfImages: HEIC,
// WebP, GIF, BMP, TIFF, AVIF too, upright); Office documents go through the same conversion as Word / Excel /
// PowerPoint to PDF (our server; .docx through ConvertAPI) and only those are uploaded — PDFs and images never are.
const OFFICE_RE = /\.(docx?|docm|dotx?|dotm|odt|ott|rtf|wpd|xlsx?|xlsm|xlsb|xltx?|xltm|ods|ots|csv|pptx?|pptm|ppsx?|ppsm|potx?|potm|odp|otp)$/i;
const isPdf = (f) => /\.pdf$/i.test(f.name) || f.type === 'application/pdf';
const isOffice = (f) => OFFICE_RE.test(f.name);
// P31 (03/10): each Office file is checked against the server's own ceiling for it (app/api/convert-to-pdf/route.ts:
// spreadsheets 60 MB, other documents 100 MB, under ConvertAPI's 200 MB for .docx) BEFORE anything is uploaded; it was
// refused by the server only after the upload. The 700 MB total is the in-browser merge of PDFs and images.
const SHEET_RE = /\.(xlsx|xls|csv|ods|ots|xlsm|xlsb|xltx|xltm|xlt)$/i;
const officeCapFor = (f) => (SHEET_RE.test(f.name) ? MAX_SPREADSHEET_STAGED_BYTES : MAX_OFFICE_STAGED_BYTES);
const MERGE_ACCEPT = '.pdf,application/pdf,image/*,.heic,.heif,.tif,.tiff,.doc,.docx,.docm,.dotx,.dot,.odt,.rtf,.xls,.xlsx,.xlsm,.xlsb,.ods,.csv,.ppt,.pptx,.pptm,.ppsx,.pps,.odp';

export default function PdfMergePage() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useToolError('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  // P30: .docx files our backup converter (LibreOffice) made because the usual one (ConvertAPI) was unavailable.
  const [backupNames, setBackupNames] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [bookmarkPerFile, setBookmarkPerFile] = useState(true); // P24: one bookmark per merged file (Sejda, PDF24)
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
    const backup = [];
    // Every Office file first, so a too-large third file never lets the first two be uploaded for nothing.
    for (const f of files) {
      if (isPdf(f) || !isOffice(f)) continue;
      const size = checkOfficeSize(f, officeCapFor(f));
      if (!size.ok) { setError(`${f.name}: ${size.message}`); return null; }
    }
    for (const f of files) {
      if (isPdf(f)) { out.push(f); continue; }
      try {
        if (isOffice(f)) {
          setStatus(`Converting ${f.name} to PDF on our server…`);
          const { blob, engineFallback } = await convertOffice({ file: f, endpoint: '/api/convert-to-pdf', fields: { engineFallback: 'allowed' } });
          if (engineFallback) backup.push(f.name);
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
    setBackupNames(backup);
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
    setBackupNames([]);
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
        setStatus(`Merged ${msg.pageCount.toLocaleString()} pages.${msg.renamed?.length ? ` ${msg.renamed.length} form field${msg.renamed.length > 1 ? 's were' : ' was'} renamed because two files used the same name (${msg.renamed.slice(0, 3).map(([a, b]) => `${a} → ${b}`).join(', ')}${msg.renamed.length > 3 ? '…' : ''}), so each keeps its own value.` : ''}`);
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
    worker.postMessage({ files: ready, maxPages, bookmarkPerFile });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">Merge PDF</h1>
        <p className="text-neutral-500 text-center mb-2">Combine PDFs — and images or Word, Excel, PowerPoint files — into one PDF</p>
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Supports up to {maxPages.toLocaleString()} pages combined{isMobile ? ' on this device' : ''} (files up to {maxSizeLabel} total). PDFs and images are merged by a background worker in this tab.</p>
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
            <>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200"><input id="merge-bookmarks" type="checkbox" checked={bookmarkPerFile} onChange={(e) => setBookmarkPerFile(e.target.checked)} disabled={loading} /> Add a bookmark for each file (its own bookmarks are kept under it)</label>
            <button onClick={merge} disabled={files.length < 2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">
              Merge PDFs
            </button>
            </>
          )}
          {status && !loading && <p className="text-center text-green-600 dark:text-green-400 text-sm">{status}</p>}
          {files.some(isOffice) && <p className="text-center text-neutral-500 text-xs">Word, Excel and PowerPoint files are converted to PDF on our server first (deleted after conversion; .docx through ConvertAPI, or our own LibreOffice server when ConvertAPI is unavailable, said under the result), up to {officeMaxLabel(MAX_OFFICE_STAGED_BYTES)} per document and {officeMaxLabel(MAX_SPREADSHEET_STAGED_BYTES)} per spreadsheet. PDFs and images are not sent to our server: only those Office files are.</p>}
          {downloadUrl && !loading && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name="merged.pdf" />
              {backupNames.length > 0 && (
                <p className="text-amber-700 dark:text-amber-400 text-sm mt-3" role="status" data-engine-fallback>
                  {backupNames.join(', ')}: made by our backup converter. The engine we normally use for .docx files is unavailable right now, so our own LibreOffice server converted {backupNames.length > 1 ? 'these files' : 'this file'}. The text is all there, but fonts, line and page breaks and equation spacing can differ from Word, and an image stored in a non-standard way can be missing. For the usual conversion, try again later.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Merge PDF"
        description={`Merge PDF joins files into one PDF in the order of the list. PDF files are combined page by page and keep their own bookmarks and form fields; an image (JPG, PNG, HEIC, WebP, GIF, BMP, TIFF, AVIF) becomes one page at its own size, turned upright, and a multi-page TIFF one page per image; a Word, Excel or PowerPoint file is first converted to PDF on our server. By default each file gets a bookmark named after it, and two form fields with the same name in different files are renamed so each keeps its value. Except for those Office files, everything is merged by a background worker in your browser.`}
        howToTitle="How to merge PDF files"
        howTo={[
          `Click the upload area and add two or more files: PDFs, images, or Word, Excel and PowerPoint documents.`,
          `Drag a row to reorder it with a mouse, or use the ↑ and ↓ arrows next to it.`,
          `Untick "Add a bookmark for each file" if you do not want them, then click "Merge PDFs".`,
          `Take the combined file, merged.pdf, with the "Download" button.`,
        ]}
        specs={[
          { label: 'Input formats', value: `PDF; JPG, PNG, HEIC, WebP, GIF, BMP, TIFF, AVIF; DOC, DOCX, ODT, RTF; XLS, XLSX, CSV, ODS; PPT, PPTX, ODP` },
          { label: 'Files at once', value: `Two or more, in the order of the list` },
          { label: 'Office files', value: `Up to ${officeMaxLabel(MAX_OFFICE_STAGED_BYTES)} per document and ${officeMaxLabel(MAX_SPREADSHEET_STAGED_BYTES)} per spreadsheet` },
          { label: 'Total size', value: `The combined cap of all listed files is printed above the upload area; smaller on phones, iPhone and iPad` },
          { label: 'Usage limits', value: `.docx conversions are limited per network per hour and per day within a monthly budget for the whole site; any Office file over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB also counts against a per-network hourly and daily upload limit` },
          { label: 'Result', value: `merged.pdf, with one bookmark per file if you keep the option` },
        ]}
        privacy={`Only the Office files you add are sent to our server; PDFs and images are merged in your browser and are not uploaded. Each Word, Excel or PowerPoint file you add is sent to our server to be converted to PDF: a .docx goes to ConvertAPI with file storage turned off, or to our own LibreOffice service when ConvertAPI is unavailable (the page tells you), and other Office formats go to our LibreOffice service (Gotenberg). An Office file over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB first travels through our media service.`}
        faqs={[
          { q: "Can I merge PDF and JPG files together?", a: `Yes. Each image becomes one page sized to the picture and turned upright from its orientation tag, placed between your PDFs in list order, and a multi-page TIFF gives one page per image. Besides JPG, the tool reads PNG, HEIC, WebP, GIF, BMP, TIFF and AVIF.` },
          { q: "Can I merge Word or Excel files with PDFs?", a: `Yes. Each Office document is converted to PDF on our server first, up to ${officeMaxLabel(MAX_OFFICE_STAGED_BYTES)} per document and ${officeMaxLabel(MAX_SPREADSHEET_STAGED_BYTES)} per spreadsheet; a file over its limit is refused before anything is sent. Conversions of .docx files, and uploads of any Office file over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB, are limited per network per hour and per day.` },
          { q: "Does merging lower the quality?", a: `No for PDF files: their pages are copied as they are. JPEG and PNG pictures go in without re-encoding; a TIFF, or a HEIC your browser cannot open itself, becomes a lossless PNG; WebP, GIF, BMP, AVIF, mirrored JPEGs and HEIC photos your browser opens are re-encoded as JPEG, or PNG when transparent. A .docx made by our backup LibreOffice service can differ from Word.` },
          { q: "Are bookmarks and form fields kept?", a: `Yes. With the bookmark option on, each file gets a bookmark named after it, with its own bookmarks underneath. Form fields from every file still work; when two files use the same field name, one is renamed and the result message lists the change.` },
        ]}
        tips={[
          `After merging several scans, PDF Compress can make the combined file smaller.`,
        ]}
      />
    </div>
  );
}

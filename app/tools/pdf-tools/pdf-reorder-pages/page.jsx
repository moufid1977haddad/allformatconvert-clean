'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { FileDownload } from '../../../components/FileDownload';
import { parsePageOrder } from '../../../lib/pageRange';
import { carryOver, carryOutline } from '../../../lib/pdfCarryOver';
import { reportShownMessage } from '../../../lib/useToolError';

export default function PdfReorderPagesPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const [note, setNote] = useState('');
  // P24 (03/10): what the order leaves out is said before saving, never discovered in the file
  const preview = (() => { if (!pageCount || !order.trim()) return null; try { const o = parsePageOrder(order, pageCount); const used = new Set(o); return { o, missing: Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => !used.has(p)), dup: o.length - used.size }; } catch (e) { return { error: e.message }; } })();
  const setPreset = (kind) => { const all = Array.from({ length: pageCount }, (_, i) => i + 1); setOrder((kind === 'reverse' ? all.reverse() : [...all.filter((p) => p % 2), ...all.filter((p) => !(p % 2))]).join(', ')); };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDownloadUrl(null);
    setOrder('');
    setPageCount(0);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer), { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      setPageCount(count);
      setOrder(Array.from({ length: count }, (_, i) => i + 1).join(', '));
    } catch (err) {
      reportShownMessage(err);
      setStatus('Error: ' + err.message);
      setPageCount(0);
      setOrder('');
    }
  };

  const reorder = async () => {
    if (!file || !order) return;
    setLoading(true);
    setStatus('Processing...');
    setDownloadUrl(null);
    try {
      const newOrder = parsePageOrder(order, pageCount).map((p) => p - 1);
      const arrayBuffer = await file.arrayBuffer();
      const lib = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const { PDFDocument } = lib;
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer), { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();
      for (const pageIndex of newOrder) {
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
        newPdf.addPage(copiedPage);
      }
      // form fields, title / author and bookmarks follow their pages, as in Organize (lib/pdfCarryOver.js)
      carryOver(lib, pdfDoc, newPdf);
      carryOutline(lib, pdfDoc, newPdf, newOrder.map((i) => i + 1));
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      reportShownMessage(err);
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Reorder PDF Pages</h1>
        <p className="text-neutral-500 text-center mb-8">Change the order of pages in your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name + ' (' + pageCount + ' pages)' : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          {pageCount > 0 && (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">New page order (e.g. 3, 1, 2)</label>
              <input aria-label="New page order (e.g. 3, 1, 2)" type="text" value={order} onChange={e => setOrder(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
              <p className="text-xs text-neutral-500 mt-1">Total pages: {pageCount}. Ranges keep their direction: 5-1 is 5, 4, 3, 2, 1.</p>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setPreset('reverse')} className="text-xs px-2 py-1 rounded border border-neutral-300">Reverse order</button>
                <button type="button" onClick={() => setPreset('oddeven')} className="text-xs px-2 py-1 rounded border border-neutral-300">Odd pages, then even</button>
              </div>
              {preview?.error && <p role="alert" className="text-sm text-red-600 mt-1" data-order-error>{preview.error}</p>}
              {preview && !preview.error && preview.missing.length > 0 && <p className="text-sm text-amber-700 mt-1" data-order-missing>{preview.missing.length === pageCount ? '' : `Left out of the new PDF: page${preview.missing.length > 1 ? 's' : ''} ${preview.missing.slice(0, 20).join(', ')}${preview.missing.length > 20 ? '…' : ''}.`}</p>}
              {preview && !preview.error && preview.dup > 0 && <p className="text-sm text-neutral-600 mt-1">{preview.dup} page{preview.dup > 1 ? 's' : ''} used twice or more (kept as written).</p>}
            </div>
          )}
          <button onClick={reorder} disabled={!file || !order || !!preview?.error || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Reorder Pages'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file.name.replace(/\.pdf$/i, '-reordered.pdf')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Reorder Pages"
        description="PDF Reorder Pages lets you rearrange a PDF's pages by typing the new page order as a comma-separated list, using the pdf-lib library entirely in your browser — your file is never uploaded to a server. There are no page thumbnails or drag-and-drop; the field is pre-filled with the original order for you to edit."
        howTo={[
          "Click the upload area and select a PDF file — the total page count and a pre-filled order field appear.",
          "Edit the comma-separated list of page numbers into your desired order (e.g. 3, 1, 2).",
          "Click 'Reorder Pages' to build the PDF in that order.",
          "Click 'Download' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Reorder Pages free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I drag and drop page thumbnails to reorder them?", a: "Not here: you type the new order (3, 1, 2), ranges included (5-1 reverses five pages), or use Reverse order / Odd pages, then even. For thumbnails you drag, use Organize PDF." },
          { q: "Can I leave out pages I don't want in the final PDF?", a: "Yes — a page you don't include is left out, and the page lists the left-out pages before you save. Form fields, the title and author, and bookmarks follow their pages." },
          { q: "Is my file uploaded to a server?", a: "No, everything happens locally in your browser using the pdf-lib library." }
        ]}
        tips={[
          "The order field starts pre-filled with the original sequence (1, 2, 3, ...) — edit only the numbers you want to move.",
          "Leaving a page number out of the list removes that page from the output, so double-check the list includes every page you want to keep.",
          "Page numbers are 1-indexed and must reference valid pages in the source document; invalid ones are skipped.",
          "Since there's no preview, download and check the result on a short document before relying on it for something important."
        ]}
      />
    </div>
  );
}
'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { FileDownload } from '../../../components/FileDownload';
import { parsePageOrder } from '../../../lib/pageRange';
import { carryOver, carryOutline } from '../../../lib/pdfCarryOver';
import { reportShownMessage } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

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
            <p className="text-neutral-500">{file ? file.name + ' (' + pageCount + ' pages)' : <UploadPrompt what="a PDF" />}</p>
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
        description={`PDF Reorder Pages builds a new PDF from the page order you type. The field starts with every page in its current order; edit it to 3, 1, 2, use a range such as 5-1 to run backwards, or click a preset for reverse order or odd pages followed by even ones. A page can appear twice, and a page you leave out is dropped, which the page lists before you save. A number that does not exist stops the tool with a message. Form fields, title, author and bookmarks follow their pages. Your browser copies the pages into the new file in that order.`}
        howToTitle="How to change the order of PDF pages"
        howTo={[
          `Choose the PDF; the order field fills with every page in its current order.`,
          `Edit "New page order (e.g. 3, 1, 2)", or click "Reverse order" or "Odd pages, then even".`,
          `Check the notes under the field for left-out or repeated pages, then click "Reorder Pages".`,
          `The "Download" button then gives the -reordered.pdf copy in your new order.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF` },
          { label: 'Order', value: `Pages and ranges in either direction, such as 3, 1, 2 or 10-1` },
          { label: 'Presets', value: `Reverse order; Odd pages, then even` },
          { label: 'Missing pages', value: `Left out of the result and listed before saving` },
          { label: 'Result', value: `Your file name followed by -reordered.pdf` },
        ]}
        privacy={`pdf-lib copies the pages into a new document in the order you typed, inside this browser tab; your PDF is not sent anywhere. A PDF that only restricts printing or copying is decrypted locally first, and one that asks for a password to open is refused with a pointer to PDF Unlock.`}
        faqs={[
          { q: "Can I reverse the page order of a PDF?", a: `Yes. Click Reverse order and the field lists the pages from last to first, or type a backwards range such as 9-1. Then click Reorder Pages to build the reversed PDF and download it.` },
          { q: "Can I type a page number that does not exist?", a: `No. Nothing is built: a number past the last page, or text that is not a page or a range, shows a message under the field, and the button stays disabled until the order is valid.` },
          { q: "Can I put the same page in twice?", a: `Yes. A page listed more than once is copied each time, and the note under the field counts the repeats so you can check them before saving.` },
          { q: "Is there a thumbnail view for reordering?", a: `No, not on this page. The PDF Editor shows a thumbnail of every page with up and down arrows, and PDF Organize moves pages in a numbered list with buttons.` },
        ]}
        tips={[]}
      />
    </div>
  );
}
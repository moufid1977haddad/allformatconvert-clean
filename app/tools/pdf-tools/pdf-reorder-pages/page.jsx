'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import SeoContent from '../../../components/SeoContent';

export default function PdfReorderPagesPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [order, setOrder] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

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
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      setPageCount(count);
      setOrder(Array.from({ length: count }, (_, i) => i + 1).join(', '));
    } catch (err) {
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
      const newOrder = order.split(',').map(p => parseInt(p.trim()) - 1).filter(p => p >= 0);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();
      for (const pageIndex of newOrder) {
        if (pageIndex < pdfDoc.getPageCount()) {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
          newPdf.addPage(copiedPage);
        }
      }
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
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
              <input type="text" value={order} onChange={e => setOrder(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
              <p className="text-xs text-neutral-500 mt-1">Total pages: {pageCount}</p>
            </div>
          )}
          <button onClick={reorder} disabled={!file || !order || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Reorder Pages'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace(/\.pdf$/i, '-reordered.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
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
          { q: "Can I drag and drop page thumbnails to reorder them?", a: "No — there are no visual thumbnails. You type the new page order as a comma-separated list of page numbers." },
          { q: "Can I leave out pages I don't want in the final PDF?", a: "Yes — any page number you don't include in the list is simply left out of the reordered file." },
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
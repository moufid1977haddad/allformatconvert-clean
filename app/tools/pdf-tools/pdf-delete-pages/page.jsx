'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { FileDownload } from '../../../components/FileDownload';
import { parsePageRange } from '../../../lib/pageRange';

export default function PdfDeletePagesPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pagesToDelete, setPagesToDelete] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDownloadUrl(null);
    setPagesToDelete('');
    setPageCount(0);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer), { ignoreEncryption: true });
      setPageCount(pdfDoc.getPageCount());
    } catch (err) {
      setStatus('Error: ' + err.message);
      setPageCount(0);
    }
  };

  const deletePages = async () => {
    if (!file || !pagesToDelete) return;
    setLoading(true);
    setStatus('Processing...');
    setDownloadUrl(null);
    try {
      setError('');
      const arrayBuffer = await file.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer), { ignoreEncryption: true });
      // P24: ranges ("2-4" removed page 2 only), and any word or page past the end is said, never dropped silently
      const total = pdfDoc.getPageCount();
      const pages = parsePageRange(pagesToDelete, total);
      if (pages.length >= total) throw new Error(`That is every page of this PDF (${total}): at least one page must stay.`);
      [...pages].reverse().forEach(p => pdfDoc.removePage(p - 1));
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus(`Deleted ${pages.length} page${pages.length > 1 ? 's' : ''}; ${total - pages.length} left.`);
    } catch (err) {
      setStatus(''); setError(err?.message || 'The pages could not be deleted.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Delete PDF Pages</h1>
        <p className="text-neutral-500 text-center mb-8">Remove specific pages from your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name + ' (' + pageCount + ' pages)' : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          {pageCount > 0 && (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Pages to delete (e.g. 1, 3, 5-7)</label>
              <input type="text" value={pagesToDelete} onChange={e => setPagesToDelete(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="1, 3, 5-7" />
              <p className="text-xs text-neutral-500 mt-1">Total pages: {pageCount}</p>
            </div>
          )}
          <button onClick={deletePages} disabled={!file || !pagesToDelete || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Delete Pages'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {error && <p role="alert" className="text-center text-red-600 text-sm">{error}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file.name.replace(/\.pdf$/i, '-edited.pdf')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Delete Pages"
        description="PDF Delete Pages removes the page numbers you specify from a PDF entirely in your browser using the pdf-lib library — your file is never uploaded to a server. There's no visual page preview or thumbnails; you type the page numbers to remove into a text field."
        howTo={[
          "Click the upload area and select a PDF file — the total page count appears once it loads.",
          "Type the page numbers to delete into the text field, separated by commas, with ranges (e.g. 1, 3, 5-7).",
          "Click 'Delete Pages' to remove them.",
          "Click 'Download' to save the edited PDF."
        ]}
        faqs={[
          { q: "Is PDF Delete Pages free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is there a visual preview to click on pages?", a: "No — there are no page thumbnails. You enter the page numbers as text, based on their position in the document." },
          { q: "Is my PDF file uploaded to a server?", a: "No. Pages are removed entirely in your browser using the pdf-lib library." },
          { q: "Can I delete multiple pages at once?", a: "Yes, list page numbers and ranges separated by commas (1, 3, 5-7, or 10- for page 10 to the end) and they're all removed in one pass." }
        ]}
        tips={[
          "Page numbers are 1-indexed and match the total page count shown after you upload the file.",
          "Double-check page numbers against the original document, since there's no visual preview before deleting.",
          "A page number past the end of the document, or text that is not a page, is pointed out instead of being ignored.",
          "Keep your original file until you've confirmed the downloaded result looks right — the tool can't undo a deletion."
        ]}
      />
    </div>
  );
}
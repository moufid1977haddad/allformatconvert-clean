'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { FileDownload } from '../../../components/FileDownload';
import { parsePageRange } from '../../../lib/pageRange';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function PdfDeletePagesPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pagesToDelete, setPagesToDelete] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useToolError('');
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
            <p className="text-neutral-500">{file ? file.name + ' (' + pageCount + ' pages)' : <UploadPrompt what="a PDF" />}</p>
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
        description={`PDF Delete Pages removes the pages you list from a PDF and saves the others as a new file named after yours with -edited at the end. Type single pages and ranges separated by commas: 5-7 is a range and 10- runs to the last page. The page count appears once the file is read; there are no thumbnails, and at least one page must remain. A page number past the end, or a word that is not a page, is pointed out instead of being skipped. Pages are removed in your browser with pdf-lib.`}
        howToTitle="How to delete pages from a PDF"
        howTo={[
          `Choose the PDF; its total page count appears under the field.`,
          `Type the pages to remove in "Pages to delete (e.g. 1, 3, 5-7)".`,
          `Click "Delete Pages"; the line under it says how many pages were deleted and how many are left.`,
          `Take the copy without those pages with the "Download" button.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF` },
          { label: 'Page list', value: `Single pages and ranges separated by commas, spaces or semicolons; 10- means up to the end` },
          { label: 'Kept', value: `At least one page must stay` },
          { label: 'Result', value: `Your file name followed by -edited.pdf` },
        ]}
        privacy={`Your PDF is read and rewritten in your browser with pdf-lib, and no page of it is uploaded. A file that only restricts printing or copying is decrypted locally before the pages are removed; a PDF that asks for a password to open is refused.`}
        faqs={[
          { q: "Can I remove several pages at once?", a: `Yes. Type them all in one go, separated by commas: 2, 4, 9-12 removes pages 2, 4 and 9 to 12, and 20- removes page 20 and every page after it. They are removed in a single pass, and the remaining pages keep their original order.` },
          { q: "Can I see thumbnails of the pages before deleting?", a: `No. This page works from page numbers only. PDF Organize lists the pages with a Remove button for each, and the PDF Editor shows a thumbnail of every page with its own delete button.` },
          { q: "Can I delete every page except one?", a: `Yes, as long as one page remains. If your list covers every page of the file, the tool refuses with a message saying at least one page must stay, so you never get an empty PDF.` },
        ]}
        tips={[
          `To keep only a few pages out of many, PDF Split in Select pages mode needs less typing.`,
        ]}
      />
    </div>
  );
}
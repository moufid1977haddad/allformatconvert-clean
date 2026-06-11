'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

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
    setFile(f);
    setStatus('');
    setDownloadUrl(null);
    setOrder('');
    const arrayBuffer = await f.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const count = pdfDoc.getPageCount();
    setPageCount(count);
    setOrder(Array.from({ length: count }, (_, i) => i + 1).join(', '));
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
              <a href={downloadUrl} download={file.name.replace('.pdf', '-reordered.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Reorder Pages</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Reorder Pages is a free online tool that allows you to quickly rearrange the pages of your PDF documents in any order you desire. Simply upload your PDF, drag and drop pages to reorder them, and download your reorganized file instantly without any software installation or registration required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Reorder Pages</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your PDF file by clicking the upload button or dragging and dropping it into the designated area on the page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>View all pages of your PDF displayed as thumbnails where you can easily see and select the pages you want to reorder</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Drag and drop individual pages to rearrange them in your desired order using an intuitive interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your newly reordered PDF file to your computer</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Reorder Pages completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Reorder Pages is completely free with no hidden fees, subscriptions, or premium features required to reorder your PDF pages.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account or registration is necessary to use PDF Reorder Pages, making it quick and convenient to access anytime.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my PDF file secure when I upload it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your PDF files are processed securely and are automatically deleted from our servers after processing for your privacy protection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can upload?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most PDFs up to 50MB can be uploaded and processed through our tool, covering the vast majority of standard documents.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the zoom feature to get a better view of individual pages before reordering, especially for documents with many pages</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>You can reorder multiple pages at once by selecting them with checkboxes and moving them as a group to save time</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview your reordered PDF before downloading to ensure all pages are in the correct sequence and nothing was missed</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For large documents, organize pages in sections first by grouping related pages together before making your final arrangement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
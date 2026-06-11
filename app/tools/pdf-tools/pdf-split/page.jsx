'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PdfSplitPage() {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState([]);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    setStatus('');
    setDownloadUrls([]);
    setRanges('');
    const arrayBuffer = await f.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    setPageCount(pdfDoc.getPageCount());
  };

  const split = async () => {
    if (!file || !ranges) return;
    setLoading(true);
    setStatus('Splitting...');
    setDownloadUrls([]);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const parts = ranges.split(',').map(r => r.trim());
      const urls = [];
      for (const part of parts) {
        const newPdf = await PDFDocument.create();
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
          const pageIndices = [];
          for (let i = start; i <= end && i < pdfDoc.getPageCount(); i++) pageIndices.push(i);
          const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach(p => newPdf.addPage(p));
        } else {
          const pageIndex = parseInt(part) - 1;
          if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
            newPdf.addPage(copiedPage);
          }
        }
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        urls.push({ url: URL.createObjectURL(blob), name: 'part-' + part.replace('-', '_') + '.pdf' });
      }
      setDownloadUrls(urls);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Split PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Extract specific pages or ranges from your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name + ' (' + pageCount + ' pages)' : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          {pageCount > 0 && (
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Page ranges (e.g. 1-3, 4-6, 7)</label>
              <input type="text" value={ranges} onChange={e => setRanges(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="1-3, 4-6, 7" />
              <p className="text-xs text-neutral-500 mt-1">Each range creates a separate PDF. Total pages: {pageCount}</p>
            </div>
          )}
          <button onClick={split} disabled={!file || !ranges || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Splitting...' : 'Split PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrls.length > 0 && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-400 text-xl font-bold">Done! {downloadUrls.length} file(s)</div>
              {downloadUrls.map(({ url, name }, i) => (
                <a key={i} href={url} download={name} className="block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download {name}</a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Split</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Split is a free online tool that allows you to easily divide PDF documents into separate files or extract specific pages without any software installation. Simply upload your PDF, select the pages you want to split, and download your new files instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Split</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Split website and click the 'Upload PDF' button to select your document from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select the pages you want to split by clicking on page numbers or using the range selection feature</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose your splitting method: split by page, extract specific pages, or divide into equal parts</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Split' button and download your newly created PDF files instantly</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Split free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Split is completely free with no hidden charges, registration requirements, or premium features locked behind a paywall.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, PDF Split is a web-based tool that works directly in your browser, so there is no software to download or install.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my PDF file secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your uploaded files are processed securely and automatically deleted from our servers after processing is complete.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the file size limit?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Split can handle most standard PDF files, typically up to 100MB, allowing you to split large documents without issues.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to see your pages before splitting to ensure you select the correct ones</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For large PDFs, consider splitting into sections rather than individual pages for easier management</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark important pages in your original PDF before uploading to quickly identify which pages to extract</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Download your split files immediately as temporary files may be cleared periodically from the server</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
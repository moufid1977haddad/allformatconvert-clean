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
    </div>
  );
}

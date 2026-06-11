'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const n = pdf.numPages;
    setNumPages(n);
    setOrder(Array.from({ length: n }, (_, i) => i + 1));
  };

  const moveUp = (i) => {
    if (i === 0) return;
    const newOrder = [...order];
    [newOrder[i-1], newOrder[i]] = [newOrder[i], newOrder[i-1]];
    setOrder(newOrder);
  };

  const moveDown = (i) => {
    if (i === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[i], newOrder[i+1]] = [newOrder[i+1], newOrder[i]];
    setOrder(newOrder);
  };

  const removePage = (i) => setOrder(order.filter((_, idx) => idx !== i));

  const reorganize = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();
      for (const pageNum of order) {
        const [page] = await newDoc.copyPages(srcDoc, [pageNum - 1]);
        newDoc.addPage(page);
      }
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Organize PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Reorder and remove PDF pages</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name} ({numPages} pages)</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          {order.length > 0 && (
            <div className="space-y-2">
              {order.map((pageNum, i) => (
                <div key={i} className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-neutral-700 flex-1">Page {pageNum}</span>
                  <button onClick={() => moveUp(i)} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Up</button>
                  <button onClick={() => moveDown(i)} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Down</button>
                  <button onClick={() => removePage(i)} className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition">Remove</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={reorganize} disabled={!file || loading || order.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Apply Changes'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="organized.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download PDF</a>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Organize</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Organize is a free online tool that helps you efficiently manage, arrange, and optimize your PDF files without any cost or software installation. With intuitive features for splitting, merging, reordering, and compressing PDFs, you can organize your documents in minutes.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Organize</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Organize website and select the PDF management task you want to perform from the main menu.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your PDF file(s) by clicking the upload button or dragging and dropping them into the designated area.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Use the editing tools to rearrange pages, remove unwanted pages, merge multiple PDFs, or compress file size as needed.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your organized PDF to your device by clicking the download button when you're satisfied with the changes.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Organize really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Organize is completely free with no hidden charges, watermarks, or premium subscriptions required for basic document organization.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software to use PDF Organize?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, PDF Organize is a web-based tool that works directly in your browser, so no installation or downloads are necessary.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe when uploading PDFs to PDF Organize?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your files are processed securely and automatically deleted from servers after processing, ensuring your privacy and data protection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What PDF operations can I perform with PDF Organize?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can split PDFs, merge multiple files, reorder pages, remove pages, rotate pages, and compress files to reduce file size.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress your PDFs before uploading multiple files to speed up processing and reduce storage space on your device.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the reorder feature to arrange pages logically before merging multiple PDFs for better document flow.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove blank or unnecessary pages to create cleaner, more professional documents that are easier to share.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Download your organized PDF immediately after completion, as files are automatically deleted from the server within hours.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
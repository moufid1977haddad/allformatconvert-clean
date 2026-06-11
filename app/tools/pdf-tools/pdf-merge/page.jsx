'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import SeoContent from '../../../components/SeoContent';

export default function PdfMergePage() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
    setStatus('');
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

  const moveDown = (index) => {
    setFiles(prev => {
      if (index === prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const merge = async () => {
    if (files.length < 2) { setStatus('Add at least 2 PDF files.'); return; }
    setLoading(true);
    setStatus('Merging...');
    setDownloadUrl(null);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">Merge PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Combine multiple PDF files into one — free, fast, no signup</p>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add PDF files</p>
            <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFiles} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                  <span className="text-neutral-500 text-sm w-6">{index + 1}.</span>
                  <span className="flex-1 text-sm truncate text-neutral-700 dark:text-neutral-200">{file.name}</span>
                  <button onClick={() => moveUp(index)} className="text-neutral-500 hover:text-indigo-500 px-2">↑</button>
                  <button onClick={() => moveDown(index)} className="text-neutral-500 hover:text-indigo-500 px-2">↓</button>
                  <button onClick={() => removeFile(index)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={merge} disabled={files.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">
            {loading ? 'Merging...' : 'Merge PDFs'}
          </button>
          {status && <p className="text-center text-yellow-500 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download="merged.pdf" className="inline-block bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Merge PDF"
        description="Merge PDF is a free online tool that lets you combine multiple PDF files into a single document instantly. No software installation required, no signup, and your files are processed locally in your browser for maximum privacy. Perfect for combining reports, contracts, invoices, and any other PDF documents."
        howTo={[
          "Click the upload area and select two or more PDF files from your device.",
          "Reorder the files by clicking the up and down arrows next to each file.",
          "Click the Merge PDFs button to combine all files into one.",
          "Download your merged PDF file instantly."
        ]}
        faqs={[
          { q: "Is Merge PDF free to use?", a: "Yes, completely free with no limits. You can merge as many PDFs as you want without creating an account." },
          { q: "Are my files safe?", a: "Yes. All processing happens directly in your browser — your files are never uploaded to any server." },
          { q: "How many PDF files can I merge at once?", a: "There is no hard limit. You can merge as many PDF files as your browser can handle." },
          { q: "Does merging PDFs reduce quality?", a: "No. The merged PDF retains the full quality of all original files including images, fonts, and formatting." }
        ]}
        tips={[
          "Drag files in the list to reorder them before merging.",
          "You can merge scanned PDFs, form PDFs, and regular text PDFs together.",
          "For large files, the merge may take a few seconds — be patient.",
          "After merging, use our PDF Compress tool to reduce the file size if needed."
        ]}
      />
    </div>
  );
}
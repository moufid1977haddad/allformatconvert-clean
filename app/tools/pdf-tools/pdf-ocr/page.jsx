'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setOutput(''); };

  const ocr = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += `--- Page ${i} ---\n`;
        text += content.items.map(item => item.str).join(' ') + '\n\n';
      }
      setOutput(text || 'No text found in this PDF.');
    } catch(e) { setError('OCR failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">PDF OCR</h1>
        <p className="text-neutral-500 text-center mb-8">Extract text from scanned PDFs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <button onClick={ocr} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Extracting text...' : 'Extract Text (OCR)'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Extracted Text</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy Text</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Ocr</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF OCR is a free online tool that converts scanned PDF documents and images into editable, searchable text using advanced optical character recognition technology. Extract text from PDFs instantly without downloading software or paying subscription fees.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Ocr</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF OCR website and click the 'Upload PDF' button to select your document from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your preferred output format (text, Word document, or searchable PDF) and select the language of your document</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button and wait for the OCR engine to process and extract text from your PDF</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted file immediately or copy the extracted text directly to use in your projects</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does PDF OCR support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF OCR supports PDF files, PNG, JPG, JPEG, TIFF, and BMP image formats for text extraction and conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploads?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF OCR accepts files up to 50MB in size, allowing you to process large documents and multi-page PDFs without restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How accurate is the text recognition?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF OCR uses advanced machine learning to achieve 95%+ accuracy for most documents, though quality depends on image clarity and document condition.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my uploaded files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, PDF OCR automatically deletes all uploaded files within 24 hours and does not store or share your documents for privacy protection.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, upload high-resolution scans (300 DPI or higher) with clear text and minimal background noise</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If your document contains multiple languages, specify all languages used to improve OCR accuracy and text extraction</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview the extracted text before downloading to verify accuracy and make quick edits directly in the editor</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the searchable PDF output format to maintain document formatting while making text fully indexed and searchable</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
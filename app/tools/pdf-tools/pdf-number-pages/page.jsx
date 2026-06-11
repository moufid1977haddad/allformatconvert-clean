'use client';
import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default function PdfNumberPagesPage() {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDownloadUrl(null);
  };

  const addNumbers = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Processing...');
    setDownloadUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = (i + 1) + ' / ' + total;
        const fontSize = 12;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        let x, y;
        if (position === 'bottom-center') { x = (width - textWidth) / 2; y = 20; }
        else if (position === 'bottom-right') { x = width - textWidth - 20; y = 20; }
        else if (position === 'bottom-left') { x = 20; y = 20; }
        else if (position === 'top-center') { x = (width - textWidth) / 2; y = height - 30; }
        else if (position === 'top-right') { x = width - textWidth - 20; y = height - 30; }
        else { x = 20; y = height - 30; }
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      });
      const pdfBytes = await pdfDoc.save();
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
        <h1 className="text-3xl font-bold text-center mb-2">Number PDF Pages</h1>
        <p className="text-neutral-500 text-center mb-8">Add page numbers to your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {['top-left','top-center','top-right','bottom-left','bottom-center','bottom-right'].map(pos => (
                <button key={pos} onClick={() => setPosition(pos)} className={`py-2 rounded-lg text-sm font-semibold transition ${position === pos ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>{pos}</button>
              ))}
            </div>
          </div>
          <button onClick={addNumbers} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Add Page Numbers'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace('.pdf', '-numbered.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Number Pages</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Number Pages is a free online tool that automatically adds page numbers to your PDF documents without requiring any software installation or registration. Simply upload your PDF file and customize the numbering style, position, and format to create professionally numbered documents in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Number Pages</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your PDF file by clicking the upload button or dragging and dropping your document into the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your numbering preferences including position (top, bottom, left, right), format (1, i, a, etc.), and starting number</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your changes to ensure the page numbers appear exactly where you want them</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click download to save your numbered PDF file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Number Pages completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Number Pages is 100% free with no hidden fees, subscriptions, or premium versions required to access all features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, PDF Number Pages is a web-based tool that works directly in your browser, so no installation or downloads are necessary.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my PDF file be kept private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your uploaded files are processed securely and are not stored on our servers after processing is complete for your privacy protection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I add page numbers to large PDF files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Number Pages can handle PDF files of various sizes, though very large files may take slightly longer to process.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Start numbering from a specific page by using the start number option to skip the cover page or introduction</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different numbering formats like roman numerals for front matter and regular numbers for the main content</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Position page numbers consistently by choosing a single location, such as bottom center, for a professional appearance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your settings on a small section first by adjusting the preview before downloading the final numbered PDF</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
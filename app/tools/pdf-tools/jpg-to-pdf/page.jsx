'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { PDFDocument } from 'pdf-lib';

export default function Page() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFiles = (e) => { setFiles(Array.from(e.target.files)); setResult(null); };

  const convert = async () => {
    if (!files.length) return;
    setLoading(true);
    setError('');
    try {
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop().toLowerCase();
        let image;
        if (ext === 'jpg' || ext === 'jpeg') image = await pdfDoc.embedJpg(arrayBuffer);
        else if (ext === 'png') image = await pdfDoc.embedPng(arrayBuffer);
        else continue;
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Conversion failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">JPG to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JPG/PNG images to PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {files.length > 0 ? <p className="text-neutral-700 font-medium">{files.length} image(s) selected</p> : <p className="text-neutral-400 text-sm">Click to upload JPG or PNG images</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleFiles} />
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => <div key={i} className="text-xs text-neutral-600 bg-neutral-50 rounded p-2 truncate border border-neutral-200">{f.name}</div>)}
            </div>
          )}
          <button onClick={convert} disabled={!files.length || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="converted.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download PDF</a>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Jpg To Pdf</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Jpg To Pdf is a free online tool that converts JPEG images into PDF documents instantly without requiring any software installation or account creation. Perfect for students, professionals, and anyone needing to combine or convert image files into a portable PDF format.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Jpg To Pdf</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Jpg To Pdf tool website and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select one or multiple JPG files from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust settings such as page size, orientation, or image quality if desired</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Convert button and download your PDF file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Jpg To Pdf really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Jpg To Pdf is completely free with no hidden fees, subscriptions, or premium upgrades required for basic conversions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple JPG images at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, most Jpg To Pdf tools allow batch conversion, enabling you to upload and convert multiple JPEG files simultaneously.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my files be deleted after conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">For security and privacy, files are typically deleted from servers within 24 hours, though it's recommended to delete them immediately after download.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats besides JPG can be converted?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most Jpg To Pdf tools support additional formats including PNG, BMP, GIF, and TIFF for conversion to PDF.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure your JPG images are clear and properly scanned before uploading to the converter</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Arrange multiple images in the correct order before conversion if creating a multi-page PDF document</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress large image files before upload to ensure faster conversion processing times</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to verify the PDF output quality before finalizing your download</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
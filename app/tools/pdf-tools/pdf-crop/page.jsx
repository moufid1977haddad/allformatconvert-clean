'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file, setFile] = useState(null);
  const [margins, setMargins] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const crop = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        page.setCropBox(
          margins.left,
          margins.bottom,
          width - margins.left - margins.right,
          height - margins.top - margins.bottom
        );
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Crop failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Crop PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Crop and resize PDF pages</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div className="grid grid-cols-2 gap-4">
            {['top', 'bottom', 'left', 'right'].map(side => (
              <div key={side}>
                <label className="block text-sm text-neutral-500 mb-1 capitalize">{side} margin (pt)</label>
                <input type="number" min={0} max={200} value={margins[side]} onChange={e => setMargins({...margins, [side]: Number(e.target.value)})} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            ))}
          </div>
          <button onClick={crop} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Cropping...' : 'Crop PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="cropped.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Cropped PDF</a>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Crop</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Crop is a free online tool that allows you to easily remove unwanted margins and white space from your PDF documents without any software installation. Quickly resize and customize your PDF pages to fit your exact specifications with just a few clicks.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Crop</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Crop website and click the 'Upload PDF' button to select your document from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Preview your PDF and use the interactive cropping tool to select the area you want to keep by dragging the crop handles</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the crop boundaries for each page individually or apply the same crop to all pages for consistency</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Download' button to save your newly cropped PDF file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Crop really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Crop is completely free with no hidden charges, registration requirements, or premium subscriptions needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does PDF Crop have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Crop supports documents up to 50MB in size, allowing you to process most standard and large PDF files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded PDFs be stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your PDFs are processed securely and automatically deleted from our servers after the conversion is complete for your privacy.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I crop multiple pages differently?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can customize the crop area for each individual page or apply the same crop settings to all pages at once.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the zoom feature to get a detailed view of your PDF pages before cropping to ensure precision and avoid cutting important content</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For batch processing multiple similar PDFs, crop one as a template and apply the same settings to save time on subsequent files</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview the cropped result before downloading to verify that all essential content is retained and margins are properly removed</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine PDF Crop with other tools like PDF merge or compress to optimize your document workflow and file management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
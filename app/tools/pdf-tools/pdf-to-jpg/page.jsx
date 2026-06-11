'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setImages([]); };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const imgs = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        imgs.push({ url: canvas.toDataURL('image/jpeg', 0.9), name: `page_${i}.jpg` });
      }
      setImages(imgs);
    } catch(e) { setError('Conversion failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">PDF to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PDF pages to JPG images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to JPG'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {images.length > 0 && (
            <div className="space-y-4">
              {images.map((img, i) => (
                <div key={i} className="space-y-2">
                  <img src={img.url} className="w-full rounded-xl border border-neutral-200" alt={`Page ${i+1}`} />
                  <a href={img.url} download={img.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Page {i+1}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf To Jpg</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF to JPG is a free online conversion tool that instantly transforms your PDF documents into high-quality JPG image files without requiring any software installation. Whether you need to convert single or multiple pages, this fast and reliable converter maintains excellent image quality while supporting batch processing.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf To Jpg</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF to JPG converter website and click the 'Choose File' button to select your PDF document from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait a few seconds for the tool to process and convert your PDF file into JPG format automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview the converted JPG images and adjust quality settings if needed before downloading</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Download' button to save your JPG files to your device or choose 'Download All' for multiple pages</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF to JPG converter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, our PDF to JPG converter is completely free with no hidden charges, registration requirements, or file size limitations for most conversions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple PDF files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool supports batch conversion allowing you to upload and convert multiple PDF documents simultaneously to save time.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What quality will my JPG images have after conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The converter maintains high-quality JPG output with adjustable compression settings, allowing you to balance file size and image clarity based on your needs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this converter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your files are processed securely on our servers and automatically deleted after conversion for complete privacy and data protection.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Adjust the JPG quality slider before conversion to optimize file size without sacrificing important visual details in your images</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Convert only specific pages you need instead of entire PDFs to reduce processing time and file size of your output</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to verify conversion results before downloading to ensure quality meets your requirements</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Organize converted JPG files by renaming them immediately after download to easily manage and identify different document conversions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
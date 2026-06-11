'use client';
import { useState, useRef } from 'react';

export default function PdfToImagePage() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setImages([]);
    setStatus('');
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setImages([]);
    setStatus('Converting...');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const urls = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        urls.push({ url: canvas.toDataURL('image/png'), page: i });
      }
      setImages(urls);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF to Image</h1>
        <p className="text-neutral-500 text-center mb-8">Convert each PDF page to a PNG image</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to Images'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="text-green-400 text-xl font-bold text-center">Done! {images.length} page(s)</div>
              {images.map(({ url, page }) => (
                <div key={page} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center">
                  <img src={url} alt={'Page ' + page} className="max-w-full rounded mb-3" />
                  <a href={url} download={'page-' + page + '.png'} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download Page {page}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf To Image</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF to Image is a free online tool that converts your PDF documents into high-quality image files in seconds without requiring any software installation. Transform single or multiple pages into JPG, PNG, or other image formats while maintaining excellent clarity and resolution.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf To Image</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF to Image converter tool on our website</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your PDF file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose your desired image format (JPG, PNG, etc.) and quality settings</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click Convert and download your image files instantly</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF to Image completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, our PDF to Image tool is 100% free with no hidden charges, registration required, or premium features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats can I convert PDFs to?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can convert PDFs to multiple formats including JPG, PNG, GIF, BMP, and TIFF with customizable quality settings.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many PDF files can I convert at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can convert multiple PDF files simultaneously, and there are no limits on the number of conversions per day.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded files be stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your files are processed securely and deleted automatically after conversion. We never store or share your documents.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results with scanned documents, adjust the DPI settings to 300 for crisp, clear images</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Convert PDFs in batch mode to save time when you have multiple documents to process</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Choose PNG format if you need transparent backgrounds, or JPG for smaller file sizes with good quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If your PDF has multiple pages, select which pages to convert to avoid unnecessary image files</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
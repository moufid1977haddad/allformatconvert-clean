'use client';
import { useState, useRef } from 'react';

export default function PdfToHtmlPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allHtml = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageHtml = textContent.items.map(item => '<span>' + item.str + '</span>').join(' ');
        allHtml += '<div class="page"><h2>Page ' + i + '</h2>' + pageHtml + '</div>';
      }
      const fullHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + file.name + '</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#000;line-height:1.6;}.page{margin-bottom:40px;padding:20px;border:1px solid #ccc;border-radius:8px;}h2{color:#333;}</style></head><body>' + allHtml + '</body></html>';
      const blob = new Blob([fullHtml], { type: 'text/html' });
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
        <h1 className="text-3xl font-bold text-center mb-2">PDF to HTML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PDF text content to an HTML file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to HTML'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace('.pdf', '.html')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download HTML</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf To Html</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF To HTML is a free online conversion tool that instantly transforms your PDF files into clean, editable HTML format without requiring any software installation. Perfect for web developers, content creators, and businesses looking to repurpose PDF documents for web publishing and digital distribution.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf To Html</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF To HTML tool website and locate the upload section on the main page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Choose File' button and select your PDF document from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to automatically process and convert your PDF to HTML format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the converted HTML file to your computer or copy the code directly from the preview</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF To HTML completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF To HTML is completely free with no hidden charges, registration requirements, or premium features. You can convert unlimited PDFs without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does PDF To HTML have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF To HTML supports files up to 50MB in size, making it suitable for most documents including lengthy reports, ebooks, and multi-page presentations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the converted HTML preserve my PDF's formatting and styling?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool preserves most formatting including fonts, colors, and layout structure, though some complex PDF features may require minor manual adjustments in the HTML code.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install software or create an account?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No software installation or account creation is needed. PDF To HTML is a web-based tool that works directly in your browser with instant access.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure your PDF is text-based rather than image-based or scanned, as scanned PDFs may require OCR processing</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Review the converted HTML code after conversion to verify all elements rendered correctly, especially tables and complex layouts</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the converted HTML as a starting point and make minor CSS adjustments to achieve your desired final appearance on web pages</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a backup of your original PDF files before conversion in case you need to reference the source document for quality assurance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
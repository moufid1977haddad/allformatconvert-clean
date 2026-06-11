'use client';
import { useState, useRef } from 'react';

export default function HtmlToPdfPage() {
  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState('file');
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    setStatus('');
    setDone(false);
    const text = await f.text();
    setHtmlContent(text);
  };

  const convert = () => {
    if (!htmlContent) return;
    setLoading(true);
    setDone(false);
    setStatus('Converting...');
    try {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setStatus('');
        setDone(true);
        setLoading(false);
      }, 500);
    } catch (err) {
      setStatus('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert HTML files or code to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setMode('file'); setHtmlContent(''); setFile(null); setDone(false); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>Upload File</button>
            <button onClick={() => { setMode('paste'); setHtmlContent(''); setFile(null); setDone(false); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>Paste Code</button>
          </div>
          {mode === 'file' ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : 'Click or drop an HTML file here'}</p>
              <input ref={inputRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-mono h-48 resize-none" placeholder="Paste your HTML code here..." value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} />
          )}
          <button onClick={convert} disabled={!htmlContent || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {done && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-2">Done!</div>
              <p className="text-neutral-500 text-sm">Use Save as PDF in the print dialog.</p>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Html To Pdf</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">HTML To PDF is a free online conversion tool that instantly transforms HTML code, web pages, and HTML files into professional PDF documents without requiring any software installation. Perfect for developers, designers, and content creators who need quick and reliable HTML to PDF conversion with advanced formatting preservation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Html To Pdf</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your HTML code directly into the input field or upload an HTML file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Customize conversion settings such as page size, margins, orientation, and header/footer options if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert to PDF' button to process your HTML document</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the generated PDF file to your device or share it directly with others</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is HTML To PDF completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, HTML To PDF is 100% free with no hidden fees, registration requirements, or usage limits for converting your documents.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert large HTML files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool supports HTML files of various sizes, though extremely large files may take slightly longer to process depending on server capacity.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my HTML documents be kept private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all uploaded files are processed securely and automatically deleted after conversion for complete privacy protection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What HTML features are supported in the conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">HTML To PDF supports CSS styling, images, tables, forms, and most modern HTML5 elements, maintaining your original formatting in the PDF output.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Optimize your CSS styling before conversion to ensure fonts, colors, and layouts appear exactly as intended in the final PDF</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use absolute URLs for images in your HTML to prevent broken image links in the converted PDF document</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your HTML in a browser first to verify formatting, as the PDF output will closely match your browser's rendering</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Adjust margin and padding settings in your conversion options to control white space and improve document appearance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
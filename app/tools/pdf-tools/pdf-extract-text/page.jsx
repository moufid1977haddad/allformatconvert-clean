'use client';
import { useState, useRef } from 'react';

export default function PdfExtractTextPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setText('');
    setStatus('');
  };

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    setText('');
    setStatus('Extracting...');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += 'Page ' + i + ':\n' + pageText + '\n\n';
      }
      setText(fullText);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  const download = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.pdf', '.txt');
    a.click();
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Extract Text from PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Extract all text content from your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={extract} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Extracting...' : 'Extract Text'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {text && (
            <div className="space-y-3">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={text} readOnly />
              <div className="flex gap-3">
                <button onClick={() => navigator.clipboard.writeText(text)} className="flex-1 bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Copy</button>
                <button onClick={download} className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download .txt</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Extract Text</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Extract Text is a free online tool that allows you to quickly extract text from PDF documents without requiring any software installation or registration. Simply upload your PDF file and instantly retrieve all the text content in an easy-to-copy format.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Extract Text</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Extract Text tool website and locate the upload button on the main page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your PDF file from your computer or drag and drop it into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to process your PDF file and extract all the text content automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the extracted text to your clipboard or download it as a text file for later use</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Extract Text completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Extract Text is 100% free with no hidden charges, registration requirements, or premium upgrades needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does PDF Extract Text support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool primarily supports PDF files of all sizes and can extract text from both scanned and digital PDFs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my uploaded PDF file secure and private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your privacy is protected as uploaded files are processed securely and automatically deleted after extraction without being stored on our servers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I extract text from scanned or image-based PDFs?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Extract Text works best with text-based PDFs; scanned PDFs may require OCR technology which is not available in the basic free version.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For faster extraction, try breaking down large PDF files into smaller sections before uploading</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the extracted text directly to your clipboard and paste it into your preferred document editor or application</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the extracted text for content repurposing, data analysis, or creating searchable documents from image-heavy PDFs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the extracted text for formatting accuracy and manually correct any OCR errors if you're working with scanned documents</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
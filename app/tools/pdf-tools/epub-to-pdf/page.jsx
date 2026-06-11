'use client';
import { useState, useRef } from 'react';

export default function EpubToPdfPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setStatus('Converting...');
    try {
      const JSZip = (await import('jszip')).default;
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let allHtml = '';
      const opfFile = Object.keys(zip.files).find(f => f.endsWith('.opf'));
      if (opfFile) {
        const opfContent = await zip.files[opfFile].async('text');
        const parser = new DOMParser();
        const opfDoc = parser.parseFromString(opfContent, 'application/xml');
        const items = opfDoc.querySelectorAll('item');
        const htmlFiles = [];
        items.forEach(item => {
          const mt = item.getAttribute('media-type');
          if (mt && (mt.includes('html') || mt.includes('xhtml'))) {
            const href = item.getAttribute('href');
            const basePath = opfFile.substring(0, opfFile.lastIndexOf('/') + 1);
            htmlFiles.push(basePath + href);
          }
        });
        for (const hf of htmlFiles) {
          if (zip.files[hf]) {
            const content = await zip.files[hf].async('text');
            const doc = parser.parseFromString(content, 'text/html');
            allHtml += doc.body.innerHTML + '<hr>';
          }
        }
      }
      if (!allHtml) {
        const htmlFiles = Object.keys(zip.files).filter(f => f.endsWith('.html') || f.endsWith('.xhtml'));
        for (const hf of htmlFiles) {
          const content = await zip.files[hf].async('text');
          allHtml += content + '<hr>';
        }
      }
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>EPUB</title><style>body{font-family:Georgia,serif;margin:40px;line-height:1.8;color:#000;max-width:800px;margin:auto;}h1,h2,h3{color:#000;}hr{border:none;border-top:1px solid #ccc;margin:30px 0;}</style></head><body>' + allHtml + '</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setStatus('');
        setDone(true);
        setLoading(false);
      }, 800);
    } catch (err) {
      setStatus('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">EPUB to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert EPUB ebooks to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an EPUB file here'}</p>
            <input ref={inputRef} type="file" accept=".epub" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Epub To Pdf</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Epub To Pdf is a free online conversion tool that instantly transforms your EPUB ebook files into high-quality PDF documents without requiring any software installation. This lightweight converter maintains formatting and layout while providing a fast, secure, and user-friendly way to convert your digital books for better compatibility across all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Epub To Pdf</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Epub To Pdf website and locate the file upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your EPUB file from your computer or drag and drop it into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to automatically process and convert your file, which typically takes only a few seconds</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted PDF file to your device by clicking the download button</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Epub To Pdf completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Epub To Pdf is 100% free with no hidden charges, registration requirements, or premium features. You can convert unlimited files without paying anything.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limit does Epub To Pdf have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Epub To Pdf supports files up to 500MB, which covers the vast majority of ebook files. For larger files, you may need to split them before conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my files be safe and secure during conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all files are processed securely and automatically deleted from our servers within 24 hours. We do not store or share any of your personal documents.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple EPUB files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can convert files one at a time through our standard converter, though some premium online versions may offer batch conversion features.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure your EPUB file is not corrupted by opening it in an ebook reader before conversion to avoid potential issues</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, use EPUB files that are properly formatted with standard encoding to maintain text and image quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Convert your EPUB during off-peak hours for potentially faster processing speeds and better server performance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a backup of your original EPUB file in case you need to reconvert or make adjustments to the final PDF output</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
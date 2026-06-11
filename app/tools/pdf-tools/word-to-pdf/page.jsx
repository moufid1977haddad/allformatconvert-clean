'use client';
import { useState, useRef } from 'react';

export default function WordToPdfPage() {
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
      const mammoth = (await import('mammoth/mammoth.browser')).default;
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + file.name + '</title><style>body{font-family:Arial,sans-serif;margin:40px;line-height:1.6;color:#000;}h1,h2,h3{color:#000;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>' + html + '</body></html>');
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
        <h1 className="text-3xl font-bold text-center mb-2">Word to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert .docx files to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a .docx file here'}</p>
            <input ref={inputRef} type="file" accept=".docx" className="hidden" onChange={handleFile} />
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Word To Pdf</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Word To Pdf is a free online conversion tool that instantly transforms your Microsoft Word documents into professional PDF files without requiring any software installation. Simply upload your .doc or .docx file and download the converted PDF in seconds while maintaining perfect formatting and layout.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Word To Pdf</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Word To Pdf tool website and click the 'Upload File' button to select your Word document from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait for the file to upload and the conversion process to complete, which typically takes only a few seconds</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted PDF preview to ensure all formatting, images, and text appear correctly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Download' button to save your PDF file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Word To Pdf completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Word To Pdf is completely free with no hidden charges, registration requirements, or premium plans. You can convert as many documents as you want without any limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Word To Pdf support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Word To Pdf supports all Microsoft Word formats including .doc, .docx, .dot, and .dotx files for conversion to PDF format.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my documents be kept private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your documents are processed securely and deleted automatically from our servers after conversion. We do not store or share any of your files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use Word To Pdf?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Word To Pdf is a completely online tool that works directly in your web browser. No software installation or downloads are required.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure your Word document is properly formatted before conversion to maintain consistent spacing, fonts, and page breaks in the resulting PDF</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove any tracked changes or comments from your Word document before uploading to ensure a clean, professional PDF output</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test the converted PDF on different devices and platforms to verify that all elements display correctly across various screens and applications</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use descriptive file names for your Word documents before conversion to make it easier to organize and locate your converted PDF files</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
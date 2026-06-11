'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const unlock = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Could not unlock PDF. Wrong password?'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Unlock PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Remove password protection from PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a protected PDF</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Password (if required)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter PDF password" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <button onClick={unlock} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Unlocking...' : 'Unlock PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="unlocked.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Unlocked PDF</a>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Unlock</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Unlock is a free online tool that removes password protection and restrictions from PDF files in seconds without requiring software installation. Whether your PDF is encrypted with user or owner passwords, this simple solution lets you regain full access to edit, copy, and print your documents.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Unlock</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Unlock website and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your password-protected PDF file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to process and automatically remove the password protection</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your unlocked PDF file and open it with any PDF reader to verify access</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Unlock safe to use with my sensitive documents?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Unlock uses secure SSL encryption and automatically deletes all uploaded files after processing. Your documents are never stored or shared with third parties.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of PDF passwords can PDF Unlock remove?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Unlock can remove user passwords that restrict opening files and owner passwords that restrict editing, copying, and printing. However, it cannot bypass 256-bit AES encryption or military-grade security.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use PDF Unlock?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, PDF Unlock is completely web-based and works directly in your browser. There is no software to download or install, making it accessible from any device with internet access.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Are there any file size limitations or fees for using PDF Unlock?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Unlock is completely free with no hidden costs or subscriptions. Most files process quickly, though very large PDFs may take slightly longer to unlock.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your original PDF file as a backup before unlocking in case you need to reference the original protected version</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If the unlock fails on the first attempt, try uploading the PDF again as temporary processing issues can occur</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use PDF Unlock when you own the document or have permission from the copyright holder to remove restrictions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Clear your browser cache after unlocking sensitive documents to ensure no temporary files remain on your device</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
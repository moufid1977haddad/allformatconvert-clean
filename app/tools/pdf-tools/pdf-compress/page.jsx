'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PdfCompressPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Processing...');
    setResult(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const compressed = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
      const originalSize = file.size;
      const newSize = compressed.byteLength;
      const ratio = (((originalSize - newSize) / originalSize) * 100).toFixed(1);
      const blob = new Blob([compressed], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResult({ url, originalSize, newSize, ratio, name: file.name });
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF Compression</h1>
        <p className="text-neutral-500 text-center mb-8">Reduce PDF file size in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            {file && <p className="text-xs text-neutral-500 mt-1">Original: {formatSize(file.size)}</p>}
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Compress PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-400 text-xl font-bold">Done!</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><div className="text-neutral-500">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div><div className="text-neutral-500">After</div><div className="font-bold text-indigo-400">{formatSize(result.newSize)}</div></div>
                <div><div className="text-neutral-500">Saved</div><div className="font-bold text-green-400">{result.ratio}%</div></div>
              </div>
              <a href={result.url} download={result.name.replace('.pdf', '-compressed.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Compress</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Compress is a free online tool that reduces PDF file sizes without compromising quality, making it easy to share and store large documents. Simply upload your PDF and instantly download a compressed version that's perfect for email attachments and cloud storage.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Compress</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Compress website and click the 'Upload PDF' button to select your file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically compresses your PDF while maintaining readable quality and formatting</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview the compressed file to ensure it meets your needs before downloading</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click 'Download' to save your compressed PDF to your device instantly</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Compress really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Compress is completely free with no hidden fees, registration required, or download limits.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How much can I reduce my PDF file size?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Compression rates vary depending on your PDF content, but most users experience 30-70% file size reduction while maintaining quality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my PDF file secure when I upload it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, files are processed securely and automatically deleted from our servers after compression is complete.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What's the maximum file size I can compress?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Compress supports files up to 100MB, making it suitable for most document types and multi-page PDFs.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For scanned documents with images, compression is most effective and can significantly reduce file size</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check your compressed PDF on different devices to ensure text remains clear and readable after compression</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use PDF Compress before sending files via email to avoid attachment size limitations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress PDFs regularly when managing large document libraries to save storage space and improve backup efficiency</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
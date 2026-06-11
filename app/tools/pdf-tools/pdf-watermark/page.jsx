'use client';
import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export default function PdfWatermarkPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDownloadUrl(null);
  };

  const addWatermark = async () => {
    if (!file || !text) return;
    setLoading(true);
    setStatus('Adding watermark...');
    setDownloadUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        const { width, height } = page.getSize();
        const fontSize = Math.min(width, height) / 8;
        page.drawText(text, {
          x: width / 2 - (text.length * fontSize * 0.3),
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity,
          rotate: degrees(45),
        });
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
        <h1 className="text-3xl font-bold text-center mb-2">PDF Watermark</h1>
        <p className="text-neutral-500 text-center mb-8">Add a text watermark to your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Watermark text</label>
            <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="CONFIDENTIAL" />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Opacity: {Math.round(opacity * 100)}%</label>
            <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full" />
          </div>
          <button onClick={addWatermark} disabled={!file || !text || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Add Watermark'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace('.pdf', '-watermarked.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Watermark</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Watermark is a free online tool that allows you to add text or image watermarks to your PDF documents instantly without requiring any software installation. Protect your intellectual property, brand your documents, or mark files as confidential with ease using our user-friendly watermarking solution.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Watermark</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your PDF file by clicking the upload button or dragging and dropping it into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose whether you want to add a text watermark or image watermark and customize your watermark content and styling</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the size, opacity, rotation, and position of your watermark to achieve your desired appearance</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your watermarked PDF to your computer</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Watermark completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Watermark is completely free with no hidden charges or premium features. You can watermark unlimited PDF files without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my PDF files be secure when I upload them?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your privacy is important to us. All uploaded files are processed securely and automatically deleted from our servers after processing is complete.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I watermark multiple PDF files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can watermark multiple PDF files by uploading them one at a time or using our batch processing feature if available in your region.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats can I use for image watermarks?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can use common image formats such as PNG, JPG, and GIF for image watermarks. PNG format is recommended as it supports transparency.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use semi-transparent watermarks to ensure your document content remains readable while protecting your intellectual property</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Place watermarks diagonally across pages for maximum visibility and to prevent easy removal or obscuring of the mark</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your watermark settings on a single page before applying to the entire document to ensure the desired appearance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use high-resolution images for image watermarks to maintain quality when scaled across your PDF pages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import SeoContent from '../../../components/SeoContent';

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
      <SeoContent
        title="PDF Watermark"
        description="PDF Watermark stamps a diagonal, semi-transparent text watermark across the center of every page, using the pdf-lib library entirely in your browser — your file is never uploaded to a server. You can customize the text and its opacity; there's no image watermark option, and the rotation (45°), color (gray), and position (page center) are fixed."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Type the watermark text (defaults to \"CONFIDENTIAL\").",
          "Adjust the opacity slider to your preference.",
          "Click 'Add Watermark', then 'Download' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Watermark free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I add an image watermark, like a logo?", a: "No — only text watermarks are supported; there's no option to upload an image." },
          { q: "Can I change the watermark's color, angle, or position?", a: "No — the watermark is always gray, rotated 45°, and centered on the page. Only the text and opacity are adjustable." },
          { q: "Can I watermark multiple PDFs at once?", a: "No, only one file at a time — upload and process additional files separately." }
        ]}
        tips={[
          "Lower opacity values (around 20-30%) keep the underlying content easy to read while still visibly marking the page.",
          "Since the position and angle are fixed, try a few different lengths of watermark text to see what looks best on your document.",
          "The font size automatically scales to the page dimensions, so the watermark looks proportionate across different page sizes.",
          "For a logo or image watermark, you'll need a different tool, since only text is supported here."
        ]}
      />
    </div>
  );
}
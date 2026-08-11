'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import SeoContent from '../../../components/SeoContent';

export default function PdfCompressPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
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
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
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
              <a href={result.url} download={result.name.replace(/\.pdf$/i, '-compressed.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Compress"
        description="PDF Compress rewrites your PDF's internal structure entirely in your browser using the pdf-lib library, condensing its objects into compact object streams — your file is never uploaded to a server. It does not re-encode or downsample images, so savings are typically modest and depend heavily on the source file."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Compress PDF' to rewrite the file's internal structure.",
          "Review the before/after size and percentage saved.",
          "Click 'Download' to save the compressed PDF."
        ]}
        faqs={[
          { q: "Is PDF Compress free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How much can I reduce my PDF's file size?", a: "It varies widely. PDFs with many pages, fonts, or objects tend to benefit most from the streamlined internal structure; already-optimized or small PDFs may shrink only slightly." },
          { q: "Does it reduce image quality?", a: "No — images are left untouched rather than re-encoded, so visual quality is unaffected. That also means it won't meaningfully shrink files whose size mostly comes from large embedded images." },
          { q: "Is my PDF uploaded to a server?", a: "No. Compression happens entirely in your browser using the pdf-lib library." }
        ]}
        tips={[
          "Works best on PDFs with many pages, embedded fonts, or form fields, where restructuring internal objects saves the most space.",
          "Won't meaningfully shrink scanned or image-heavy PDFs, since embedded images aren't recompressed.",
          "Check the before/after sizes shown after compressing — if savings are minimal, your file is likely already well-optimized.",
          "There's no fixed file-size limit, but very large files are bound by your browser's available memory."
        ]}
      />
    </div>
  );
}
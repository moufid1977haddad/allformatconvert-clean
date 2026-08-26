'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_PAGES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_PAGES, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';

export default function PdfCompressPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef();
  const workerRef = useRef(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const maxPages = isMobile ? MOBILE_MAX_PAGES : MAX_PAGES;
  const maxFileBytes = isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const maxFileLabel = isMobile ? MOBILE_MAX_FILE_SIZE_LABEL : MAX_FILE_SIZE_LABEL;

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setResult(null);
    setStatus('');
    setError('');
    if (f.size > maxFileBytes) {
      setError(`This file is ${(f.size / (1024 * 1024)).toFixed(0)} MB, which is over the ${maxFileLabel} limit${isMobile ? ' on this device' : ''}.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const cancel = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    setStatus('Cancelled.');
  };

  const compress = () => {
    if (!file) return;
    setLoading(true);
    setStatus('');
    setError('');
    setProgress(0);
    setResult(null);

    const worker = new Worker(new URL('./pdfCompress.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
      } else if (msg.type === 'done') {
        setProgress(100);
        setLoading(false);
        workerRef.current = null;
        const url = URL.createObjectURL(msg.blob);
        setResult({ url, originalSize: msg.originalSize, newSize: msg.newSize, ratio: msg.ratio, name: msg.name });
      } else if (msg.type === 'limit') {
        setLoading(false);
        workerRef.current = null;
        setError(`${msg.message} In-browser compression becomes unreliable beyond that point — split the file into smaller pieces first and try again.`);
      } else if (msg.type === 'error') {
        setLoading(false);
        workerRef.current = null;
        setError('Error: ' + msg.message);
      }
    };
    worker.onerror = (err) => {
      setLoading(false);
      workerRef.current = null;
      setError('Error: ' + (err?.message || 'unknown worker error'));
    };
    worker.postMessage({ file, maxPages });
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
        <p className="text-neutral-500 text-center mb-2">Reduce PDF file size in your browser</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Supports PDFs up to {maxPages.toLocaleString()} pages{isMobile ? ' on this device' : ''} (files up to {maxFileLabel}). Compression runs in the background — this tab stays responsive.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            {file && <p className="text-xs text-neutral-500 mt-1">Original: {formatSize(file.size)}</p>}
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} disabled={loading} />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Compressing…" />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={compress} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
              Compress PDF
            </button>
          )}
          {status && !loading && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && !loading && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-500 text-xl font-bold">Done!</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><div className="text-neutral-500">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div><div className="text-neutral-500">After</div><div className="font-bold text-indigo-500">{formatSize(result.newSize)}</div></div>
                <div><div className="text-neutral-500">Saved</div><div className="font-bold text-green-500">{result.ratio}%</div></div>
              </div>
              <a href={result.url} download={result.name.replace(/\.pdf$/i, '-compressed.pdf')} className="inline-block bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Compress"
        description="PDF Compress rewrites your PDF's internal structure entirely in your browser using the pdf-lib library, condensing its objects into compact object streams — your file is never uploaded to a server. Compression runs in a background Web Worker so the page stays responsive. It does not re-encode or downsample images, so savings are typically modest and depend heavily on the source file."
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
          { q: "Is my PDF uploaded to a server?", a: "No. Compression happens entirely in your browser using the pdf-lib library, in a background Web Worker." },
          { q: "Is there a page or file-size limit?", a: `Yes: up to ${MAX_PAGES.toLocaleString()} pages and ${MAX_FILE_SIZE_LABEL} on desktop (${MOBILE_MAX_PAGES.toLocaleString()} pages / ${MOBILE_MAX_FILE_SIZE_LABEL} on phones and tablets) -- measured limits to keep compression reliable in the browser tab rather than risking a crash on an extremely large PDF.` }
        ]}
        tips={[
          "Works best on PDFs with many pages, embedded fonts, or form fields, where restructuring internal objects saves the most space.",
          "Won't meaningfully shrink scanned or image-heavy PDFs, since embedded images aren't recompressed.",
          "Check the before/after sizes shown after compressing — if savings are minimal, your file is likely already well-optimized.",
          "For a PDF over the size or page limit, split it first with our PDF Split tool, then compress each piece."
        ]}
      />
    </div>
  );
}

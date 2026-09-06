'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';

const LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'fra', label: 'French' },
];

export default function Page() {
  const [file, setFile] = useState(null);
  const [lang, setLang] = useState('eng');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadPct, setDownloadPct] = useState(0);
  const [downloadLabel, setDownloadLabel] = useState('');
  const [pagePct, setPagePct] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setOutput('');
    setError('');
  };

  const ocr = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setOutput('');
    setDownloadPct(0);
    setDownloadLabel('');
    setPagePct(0);
    setCurrentPage(0);
    setTotalPages(0);
    const langLabel = LANGUAGES.find((l) => l.code === lang)?.label || lang;
    let worker = null;
    try {
      // Every page is rendered to a canvas and treated purely as an image --
      // this tool never reads getTextContent()/the PDF's text layer, which is
      // exactly what lets it read scanned/image-only pages that have no text
      // layer at all (unlike PDF Extract Text, which only reads that layer).
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const { createWorker } = await import('tesseract.js');

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);

      // The logger callback is the only signal the user gets during the
      // (first-run only, then browser-cached) OCR engine + language data
      // download, and during each page's recognition -- surfaced as two
      // separate progress bars so there's never a silent multi-second gap.
      worker = await createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === 'loading tesseract core') {
            setDownloadLabel('Downloading OCR engine...');
            setDownloadPct(Math.round(m.progress * 100));
          } else if (/loading.*(traineddata|language)/i.test(m.status)) {
            setDownloadLabel(`Downloading ${langLabel} language data...`);
            setDownloadPct(Math.round(m.progress * 100));
          } else if (m.status === 'recognizing text') {
            setPagePct(Math.round(m.progress * 100));
          }
        },
      });

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setCurrentPage(i);
        setPagePct(0);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const { data: { text } } = await worker.recognize(canvas);
        fullText += `--- Page ${i} ---\n${text.trim()}\n\n`;
      }

      setOutput(fullText.trim() ? fullText.trim() : 'No text was recognized in this PDF.');
    } catch (e) {
      setError('OCR failed: ' + e.message);
    } finally {
      if (worker) {
        try { await worker.terminate(); } catch { /* worker already gone */ }
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">PDF OCR</h1>
        <p className="text-neutral-500 text-center mb-8">Read text from scanned PDFs and photographed pages, powered by Tesseract.js, entirely in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Language</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} disabled={loading} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="space-y-3">
              {downloadLabel && downloadPct < 100 && (
                <ProgressBar pct={downloadPct} label={downloadLabel} />
              )}
              {totalPages > 0 && (
                <>
                  <p className="text-xs text-neutral-500 text-center">Page {currentPage} of {totalPages}</p>
                  <ProgressBar pct={pagePct} label="Recognizing text..." />
                </>
              )}
            </div>
          ) : (
            <button onClick={ocr} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
              Run OCR
            </button>
          )}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Recognized Text</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy Text</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF OCR"
        description="PDF OCR renders each page of your PDF onto a canvas and runs real optical character recognition on it with Tesseract.js, entirely in your browser -- this is what lets it read scanned documents and photographed pages that have no underlying text layer at all, unlike our PDF Extract Text tool, which only reads a text layer that's already embedded in the file. Pick English or French before running. It works best on a straight, clean, high-contrast scan; a skewed, angled, or low-quality photo will produce visibly garbled text in places that needs proofreading -- OCR mistakes show up as recognizable garbage, not silently wrong words. The OCR engine and language data are downloaded once (browser-cached afterward) and your file is never uploaded to a server."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Choose English or French from the Language dropdown.",
          "Click 'Run OCR'. The first run downloads the OCR engine and language data, then recognizes text page by page.",
          "Watch the progress bars for the download and for each page (\"Page X of Y\").",
          "Read the result, grouped by page number, and click 'Copy Text' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Does this actually perform OCR now?", a: "Yes. Every page is rendered to a canvas and recognized as an image using Tesseract.js -- it no longer just reads an existing text layer, so scanned and photographed pages work." },
          { q: "Which languages are supported?", a: "English and French for now. Pick one before running; only the selected language's data is downloaded." },
          { q: "How accurate is the text recognition?", a: "It's real OCR, not a flawless one -- expect a meaningful error rate (roughly 4-16% of characters, depending on scan quality), especially on skewed, angled, or low-contrast images. Errors are visibly garbled, not silently wrong, so proofread the output before relying on it." },
          { q: "Why is the first run slower than later ones?", a: "The first OCR run on a given language downloads the Tesseract engine and that language's training data. Your browser caches both, so later runs are faster." },
          { q: "Is there a file size limit?", a: "There's no fixed limit -- it's bound by your browser's available memory, and multi-page PDFs will simply take longer since each page is recognized in turn." },
          { q: "Do you store my uploaded files?", a: "No, everything happens locally in your browser. Your file is never uploaded to a server." }
        ]}
        tips={[
          "A straight, clean, high-contrast scan gives noticeably better results than a photo taken at an angle or in poor lighting.",
          "If a page comes out garbled, try re-scanning it straighter or with better lighting rather than assuming the tool is broken -- that's how real OCR fails, visibly.",
          "Multi-page PDFs show a \"Page X of Y\" counter and a per-page progress bar so you can see how much is left.",
          "Always proofread OCR output before using it for anything important -- no OCR engine, including this one, is error-free."
        ]}
      />
    </div>
  );
}

'use client';
import { useMemo, useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { itemsToText } from '../../../lib/pdfTextLayout';
import { reportToolError } from '../../../lib/reportError';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';
import { parsePageRange } from '../../../lib/pageRange';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

export default function PdfExtractTextPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  // P24 (03/10): some pages only, and with or without the "Page N:" headings (iLovePDF, CloudConvert: pages)
  const [range, setRange] = useState('');
  const [headings, setHeadings] = useState(true);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setText('');
    setStatus('');
  };

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    setText('');
    setStatus('Extracting...');
    try {
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      let pages;
      try { pages = parsePageRange(range, pdf.numPages); } catch (e) { setStatus(e.message); setLoading(false); return; } // the visitor's typing, not a file error: not reported
      for (const i of pages) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Line breaks and spaces from the text positions: the old one-space
        // join put a whole page on a single line (29/09).
        const pageText = itemsToText(textContent.items);
        fullText += (headings ? 'Page ' + i + ':\n' : '') + pageText + '\n\n';
      }
      // P24 review (03/10): a scanned PDF gave 'Page 1:', 'Page 2:'… with nothing under them and no explanation
      if (!fullText.replace(/Page \d+:\n/g, '').trim()) { setText(''); setStatus((range.trim() ? 'These pages have no text layer: they are pictures (a scan).' : 'This PDF has no text layer: its pages are pictures (a scan).') + ' Use PDF OCR to read the text from the pictures.'); setLoading(false); return; }
      setText(fullText);
      setStatus('');
    } catch (err) {
      // Only the pdfjs decode/parse error is reported here -- never `text`
      // (the extracted content), which is exactly the file content this
      // feature must never transmit.
      reportToolError({ tool: 'pdf-extract-text', file, error: err });
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  const textBlob = useMemo(() => (text ? new Blob([text], { type: 'text/plain;charset=utf-8' }) : null), [text]);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Extract Text from PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Extract all text content from your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-neutral-600">
            <label>Pages (empty: all)
              <input id="et-range" type="text" value={range} onChange={(e) => setRange(e.target.value)} placeholder="e.g. 1-3, 5, 8-" className="w-full border border-neutral-200 rounded-lg px-2 py-1.5" />
            </label>
            <label className="flex items-center gap-2 sm:pt-5"><input id="et-headings" type="checkbox" checked={headings} onChange={(e) => setHeadings(e.target.checked)} /> Start each page with "Page N:"</label>
          </div>
          <button onClick={extract} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Extracting...' : 'Extract Text'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {text && (
            <div className="space-y-3">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={text} readOnly />
              <button onClick={() => navigator.clipboard.writeText(text)} className="w-full bg-neutral-200 hover:bg-neutral-300 rounded-xl py-2 font-semibold transition">Copy</button>
              <FileDownload blob={textBlob} name={file.name.replace(/\.pdf$/i, '.txt')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Extract Text"
        description="PDF Extract Text pulls the text layer out of your PDF page by page, entirely in your browser using the PDF.js library — your file is never uploaded to a server. It only reads text that's actually embedded in the PDF; scanned or image-only pages have no text layer, and since no OCR is performed, those pages come out blank."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Extract Text' to pull the text content from every page.",
          "Read the result in the text box, grouped and labeled by page number.",
          "Click 'Copy' to copy it, or 'Download' to save it as a .txt file."
        ]}
        faqs={[
          { q: "Is PDF Extract Text completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does it support?", a: "PDF files only." },
          { q: "Can I extract only some pages?", a: "Yes: type them in Pages (for example 1-3, 5, 8-); leave it empty for the whole document. Untick \"Start each page with Page N:\" for plain text without page headings." },
          { q: "Is my uploaded PDF file secure and private?", a: "Yes — text extraction happens entirely in your browser using the PDF.js library, so your file is never uploaded to a server." },
          { q: "Can I extract text from scanned or image-based PDFs?", a: "No. This tool doesn't perform OCR — it only reads a PDF's existing text layer, so scanned pages without embedded text come out blank." }
        ]}
        tips={[
          "Output is grouped by page (\"Page 1:\", \"Page 2:\", etc.) so you can tell where each chunk of text came from.",
          "Works only on PDFs that already have a text layer — scanned or image-only pages won't produce any text.",
          "Copy the text directly to your clipboard if you just need to paste it elsewhere, without downloading a file.",
          "Line breaks and word spaces are rebuilt from the position of the text on the page; multi-column layouts are read line by line across the columns."
        ]}
      />
    </div>
  );
}
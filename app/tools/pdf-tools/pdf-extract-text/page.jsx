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
import { withActualTextUnicode } from '../../../lib/pdfActualText';

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
      const pdf = await pdfjsLib.getDocument({ data: await withActualTextUnicode(arrayBuffer) }).promise;
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
        <p className="text-neutral-500 text-center mb-8">Extract the selectable text of your PDF, page by page</p>
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
        description={`PDF Extract Text reads the text layer of a PDF, the text you could select in a viewer, and gives it back as plain text, with line breaks and spaces rebuilt from the positions on the page. Take every page or only the pages you list, with or without a heading naming each page, then copy the text or save it as a .txt file. It does not read pictures: a scanned page has no text layer, and the tool then suggests PDF OCR. The file is read in your browser with PDF.js.`}
        howToTitle="How to extract text from a PDF"
        howTo={[
          `Choose the PDF.`,
          `Optionally list pages in "Pages (empty: all)", and untick the page-heading checkbox for plain text.`,
          `Click "Extract Text".`,
          `Copy the result with "Copy", or click "Download" to save it as a .txt file named after your PDF.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF with a text layer` },
          { label: 'Output', value: `Plain text on the page and a .txt file in UTF-8` },
          { label: 'Pages', value: `All, or a list such as 1-3, 5, 8-` },
          { label: 'Scanned pages', value: `No text to read; use PDF OCR` },
        ]}
        privacy={`PDF.js reads your file inside the browser, and neither the PDF nor the extracted text is uploaded. If extraction fails, a cleaned error message is reported to us with the tool's name, the file type, an approximate size and your browser's name and version, never the file name or any text. For files up to 25 MB, accents drawn as separate glyphs are repaired in the copy given to PDF.js, never in your file.`}
        faqs={[
          { q: "Can I extract text from a scanned PDF?", a: `No. A scan stores each page as a picture, so there is no text layer to read. When no page has text, the tool says so and suggests PDF OCR, which recognizes the letters in the pictures and can also give you a searchable PDF.` },
          { q: "Will multi-column pages come out in the right order?", a: `No, not always. Line breaks and spaces are rebuilt from the positions of the text, but the order is the order in which the PDF stores its text. When a PDF stores its columns interleaved, lines of different columns alternate in the result.` },
          { q: "Can I get the text without the page headings?", a: `Yes. Untick the page-heading checkbox above the button and the pages are separated by a blank line only. Leave it ticked when you need to know which page each passage came from.` },
        ]}
        tips={[
          `For a file that mixes typed and scanned pages, PDF OCR reads both and leaves the pages that already have text without a second layer.`,
        ]}
      />
    </div>
  );
}
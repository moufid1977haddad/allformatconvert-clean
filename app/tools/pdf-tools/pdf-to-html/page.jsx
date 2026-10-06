'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import { withActualTextUnicode } from '../../../lib/pdfActualText';

// Audit 2 (29/09): the PDF's text was pasted into the HTML unescaped -- "a < b" vanished, "&copy;" became (c), text
// such as "<b>" turned into markup -- and every item was joined with a space on one line, so line breaks were lost
// and words split by the PDF ("Hel" "lo") gained a space. Now the text is escaped, lines follow pdf.js's end-of-line
// marks, and a vertical gap larger than 1.5 lines starts a new paragraph.
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function pageToHtml(items) {
  const lines = [];
  let cur = { text: '', y: null, h: 0 };
  for (const it of items) {
    if (typeof it.str !== 'string') continue;
    if (cur.y === null && it.str.trim()) { cur.y = it.transform[5]; cur.h = Math.hypot(it.transform[2], it.transform[3]) || it.height || 12; }
    cur.text += it.str;
    if (it.hasEOL) { lines.push(cur); cur = { text: '', y: null, h: 0 }; }
  }
  if (cur.text.trim()) lines.push(cur);
  const paras = [];
  let prev = null;
  for (const l of lines) {
    if (!l.text.trim()) { prev = null; continue; }
    const gap = prev && prev.y !== null && l.y !== null ? prev.y - l.y : 0;
    if (!prev || gap > 1.5 * Math.max(prev.h, l.h) || gap < 0) paras.push([]);
    paras[paras.length - 1].push(esc(l.text.trim()));
    prev = l;
  }
  return paras.map((p) => '<p>' + p.join('<br>\n') + '</p>').join('\n');
}

export default function PdfToHtmlPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    try {
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: await withActualTextUnicode(arrayBuffer) }).promise;
      let allHtml = '';
      const empty = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageHtml = pageToHtml(textContent.items);
        if (!pageHtml) empty.push(i);
        allHtml += '<div class="page"><h2>Page ' + i + '</h2>' + pageHtml + '</div>\n';
      }
      const fullHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + esc(file.name) + '</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#000;line-height:1.6;}.page{margin-bottom:40px;padding:20px;border:1px solid #ccc;border-radius:8px;}h2{color:#333;}</style></head><body>' + allHtml + '</body></html>';
      const blob = new Blob([fullHtml], { type: 'text/html' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus(empty.length ? `No text found on page${empty.length > 1 ? 's' : ''} ${empty.join(', ')} (a scan or an image has no text layer: run PDF OCR first).` : '');
    } catch (err) {
      reportShownMessage(err);
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF to HTML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PDF text content to an HTML file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Converting...' : 'Convert to HTML'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file.name.replace(/\.pdf$/i, '.html')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to HTML"
        description={`PDF to HTML takes the text layer of a PDF and writes it into a basic .html file: one bordered section per page with a page-number heading, line breaks and paragraphs kept, and characters such as < and & escaped so they show as written. It does not copy fonts, colors, images, tables or columns; tables and multi-column text become lines in the order the PDF stores them. Scanned pages have no text and stay empty.`}
        howToTitle="How to convert PDF to HTML"
        howTo={[
          `Pick or drop the PDF whose text you want as HTML.`,
          `Click "Convert to HTML" to extract the text of every page.`,
          `When "Done!" appears, "Download" gives you the text as one .html page.`,
        ]}
        specs={[
          { label: 'Input format', value: `PDF with a text layer` },
          { label: 'Output format', value: `HTML file, one section per page` },
          { label: 'Kept', value: `Text, line breaks and paragraphs` },
          { label: 'Not kept', value: `Fonts, colors, images, tables and columns` },
        ]}
        privacy={`The PDF is read by PDF.js inside this browser tab, and the HTML is written there too; the file is not uploaded. If an error message appears, the cleaned message, the tool's name and your browser's name and version may be sent to us, never your file.`}
        faqs={[
          { q: `Does it keep the layout and images?`, a: `No. Only the text is extracted, and the HTML uses one simple style: Arial-type text in bordered page sections. Fonts, colors, images and the original positions are not carried over.` },
          { q: `Can it read scanned pages?`, a: `No. A scan has no text layer, so its section stays empty, and the page lists those page numbers after the conversion. Run PDF OCR on the file first, then convert the result.` },
          { q: `Can I see the HTML before downloading?`, a: `No. There is no preview on the page: open the downloaded .html file in a browser to view it, or in a code editor to change it.` },
        ]}
        tips={[
          `To get the text without any HTML tags, use PDF Extract Text.`,
        ]}
      />
    </div>
  );
}
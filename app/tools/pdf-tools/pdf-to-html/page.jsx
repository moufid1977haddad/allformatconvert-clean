'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

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
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
        description="PDF to HTML extracts each page's plain text using the PDF.js library and wraps it in a simple generic HTML page — a bordered box with a page-number heading for each page, the text's line breaks and paragraphs kept, special characters such as < and & escaped so they display as written — entirely in your browser. Your file is never uploaded to a server. It does not preserve your original PDF's fonts, colors, layout, images, or tables; only the raw text is carried over."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Convert to HTML' to extract text from every page.",
          "Click 'Download' to save the generated .html file.",
          "Open the file in a browser or code editor to view or edit it."
        ]}
        faqs={[
          { q: "Is PDF to HTML completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Will the converted HTML preserve my PDF's fonts, colors, and layout?", a: "No — only the raw text is extracted. The HTML uses a simple generic style; your original fonts, colors, images, and layout aren't carried over." },
          { q: "Can I preview or copy the HTML code before downloading?", a: "No, there's no in-page preview. The file downloads directly, and you'd open it in a text editor or browser to view the code." },
          { q: "Is my PDF uploaded to a server?", a: "No, extraction happens entirely in your browser using the PDF.js library." }
        ]}
        tips={[
          "Works best on text-based PDFs; scanned or image-only pages have no text layer: the tool lists them after conversion, and PDF OCR can add the missing text first.",
          "Treat the output as a plain-text starting point, not a visual copy — you'll need to add your own CSS for anything beyond the default styling.",
          "Tables and multi-column layouts are flattened into lines of text in the order the PDF stores them; columns are not rebuilt.",
          "Open the downloaded .html file in a code editor if you plan to restyle or restructure it further."
        ]}
      />
    </div>
  );
}
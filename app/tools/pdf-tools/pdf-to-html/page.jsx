'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

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
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allHtml = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageHtml = textContent.items.map(item => '<span>' + item.str + '</span>').join(' ');
        allHtml += '<div class="page"><h2>Page ' + i + '</h2>' + pageHtml + '</div>';
      }
      const fullHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + file.name + '</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#000;line-height:1.6;}.page{margin-bottom:40px;padding:20px;border:1px solid #ccc;border-radius:8px;}h2{color:#333;}</style></head><body>' + allHtml + '</body></html>';
      const blob = new Blob([fullHtml], { type: 'text/html' });
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
        <h1 className="text-3xl font-bold text-center mb-2">PDF to HTML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PDF text content to an HTML file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to HTML'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace(/\.pdf$/i, '.html')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download HTML</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to HTML"
        description="PDF to HTML extracts each page's plain text using the PDF.js library and wraps it in a simple generic HTML page — a bordered box with a page-number heading for each page — entirely in your browser. Your file is never uploaded to a server. It does not preserve your original PDF's fonts, colors, layout, images, or tables; only the raw text is carried over."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Convert to HTML' to extract text from every page.",
          "Click 'Download HTML' to save the generated .html file.",
          "Open the file in a browser or code editor to view or edit it."
        ]}
        faqs={[
          { q: "Is PDF to HTML completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Will the converted HTML preserve my PDF's fonts, colors, and layout?", a: "No — only the raw text is extracted. The HTML uses a simple generic style; your original fonts, colors, images, and layout aren't carried over." },
          { q: "Can I preview or copy the HTML code before downloading?", a: "No, there's no in-page preview. The file downloads directly, and you'd open it in a text editor or browser to view the code." },
          { q: "Is my PDF uploaded to a server?", a: "No, extraction happens entirely in your browser using the PDF.js library." }
        ]}
        tips={[
          "Works best on text-based PDFs; scanned or image-only pages have no text layer and will produce an empty page section.",
          "Treat the output as a plain-text starting point, not a visual copy — you'll need to add your own CSS for anything beyond the default styling.",
          "Tables and multi-column layouts are flattened into a single run of text per page, since only extracted words are wrapped in spans.",
          "Open the downloaded .html file in a code editor if you plan to restyle or restructure it further."
        ]}
      />
    </div>
  );
}
'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function HtmlToPdfPage() {
  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState('file');
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDone(false);
    const text = await f.text();
    setHtmlContent(text);
  };

  const convert = () => {
    if (!htmlContent) return;
    setLoading(true);
    setDone(false);
    setStatus('Converting...');
    try {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setStatus('');
        setDone(true);
        setLoading(false);
      }, 500);
    } catch (err) {
      setStatus('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert HTML files or code to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setMode('file'); setHtmlContent(''); setFile(null); setDone(false); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>Upload File</button>
            <button onClick={() => { setMode('paste'); setHtmlContent(''); setFile(null); setDone(false); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>Paste Code</button>
          </div>
          {mode === 'file' ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : 'Click or drop an HTML file here'}</p>
              <input ref={inputRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-mono h-48 resize-none" placeholder="Paste your HTML code here..." value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} />
          )}
          <button onClick={convert} disabled={!htmlContent || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {done && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-2">Done!</div>
              <p className="text-neutral-500 text-sm">Use Save as PDF in the print dialog.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="HTML to PDF"
        description="HTML to PDF opens your HTML code or file — including its CSS — in a new browser tab, entirely on your device, and never uploads it to a server. It doesn't generate a PDF file directly: instead, it opens your browser's print dialog, where you choose 'Save as PDF' to produce the actual file, so the output matches how your browser renders the page."
        howTo={[
          "Choose 'Upload File' to select an .html file, or 'Paste Code' to type or paste HTML directly.",
          "Click 'Convert to PDF' — a new tab renders your HTML and the browser's print dialog appears.",
          "In the print dialog, choose 'Save as PDF' (or your OS equivalent) as the destination.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is HTML to PDF completely free to use?", a: "Yes, it's completely free with no signup or usage limits." },
          { q: "Can I customize page size, margins, or headers/footers?", a: "Not in this tool directly — those options come from your browser's print dialog, which appears after conversion, rather than from settings on this page." },
          { q: "Will my HTML documents be uploaded to a server?", a: "No. The HTML is rendered entirely in your browser — it's never uploaded anywhere." },
          { q: "What HTML features are supported?", a: "Whatever your browser can render: CSS styling, images, tables, and most modern HTML5 elements. Since it's just your browser's own rendering engine, the PDF looks like the page would look printed from that browser." }
        ]}
        tips={[
          "Use absolute image URLs (starting with https://) rather than relative paths, since a relative path may not resolve correctly in the print preview.",
          "Preview your HTML in a normal browser tab first — the PDF output will closely match what you see there.",
          "Use the print dialog's margin and page size options to fine-tune the final layout.",
          "For pasted code, make sure to include a full HTML document (with <html> and <body> tags) for the most reliable rendering."
        ]}
      />
    </div>
  );
}
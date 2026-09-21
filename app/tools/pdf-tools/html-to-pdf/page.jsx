'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';

export default function HtmlToPdfPage() {
  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('file');
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setDone(false);
    // Checked on selection: the HTML is uploaded as-is, so its size is the upload size.
    const sizeCheck = checkOfficeSize(f);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    const text = await f.text();
    setHtmlContent(text);
  };

  const convert = async () => {
    if (!htmlContent) return;
    const uploadBlob = new Blob([htmlContent], { type: 'text/html' });
    const sizeCheck = checkOfficeSize(uploadBlob);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setDone(false);
    setError('');
    try {
      setStage(null);
      const result = await convertOffice({ file: new File([uploadBlob], 'document.html', { type: 'text/html' }), endpoint: '/api/convert-html-to-pdf', onStage: setStage });
      const pdfBlob = result.blob;
      const filename = (file?.name ? file.name.replace(/\.[^.]+$/, '') : 'document') + '.pdf';
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
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
            <button onClick={() => { setMode('file'); setHtmlContent(''); setFile(null); setDone(false); setError(''); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Upload File</button>
            <button onClick={() => { setMode('paste'); setHtmlContent(''); setFile(null); setDone(false); setError(''); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Paste Code</button>
          </div>
          {mode === 'file' ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : 'Click or drop an HTML file here'}</p>
              <input ref={inputRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-mono h-48 resize-none" placeholder="Paste your HTML code here..." value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} />
          )}
          <p className="text-neutral-400 text-xs text-center -mt-2">Max {officeMaxLabel()} of HTML</p>
          <button onClick={convert} disabled={!htmlContent || loading || new Blob([htmlContent]).size > officeMaxBytes()} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? officeStageLabel(stage) : 'Convert to PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-2">PDF downloaded!</div>
              <p className="text-neutral-500 text-sm">Check your browser&apos;s downloads for the converted file.</p>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="HTML to PDF"
        description="HTML to PDF uploads your HTML code or file — including its CSS — to our conversion service, which renders it with a real browser engine (Chromium via Gotenberg) and returns a PDF that downloads automatically. We tested a page with CSS grid, flexbox, a gradient with a shadow, a table with a merged cell, two-column text, an inline SVG, print-only CSS and French accents: it matched what Chrome prints for the same page. The one difference: a font that isn't installed on our servers (Georgia in our test) is replaced by a similar one (Liberation Serif), so line breaks can shift slightly."
        howTo={[
          "Choose 'Upload File' to select an .html file, or 'Paste Code' to type or paste HTML directly.",
          "Click 'Convert to PDF'. Your HTML is uploaded and rendered by a real browser engine into a PDF.",
          "Wait for the download to start automatically.",
          "Open the downloaded PDF to confirm it looks right."
        ]}
        faqs={[
          { q: "Is HTML to PDF completely free to use?", a: "Yes, it's completely free with no signup or usage limits." },
          { q: "Can I customize page size, margins, or headers/footers?", a: "Not in this tool directly — the PDF is rendered using the conversion service's default page settings, rather than options exposed on this page." },
          { q: "Will my HTML documents be uploaded to a server?", a: "Yes. Your HTML code or file is uploaded to our conversion service, purely to render the final PDF with a real browser engine, and it's discarded immediately afterward." },
          { q: "What HTML features are supported?", a: "Whatever a modern Chromium browser can render: CSS styling, images, tables, and most modern HTML5 elements. In our test the PDF matched Chrome's print output, except that fonts missing from our servers are replaced by similar ones." }
        ]}
        tips={[
          "Use absolute image URLs (starting with https://) rather than relative paths, since a relative path won't resolve on the conversion service.",
          "Check your HTML with your browser's Print preview first — in our test the PDF matched Chrome's print output, and print-only CSS (@media print) applies.",
          "For pasted code, make sure to include a full HTML document (with <html> and <body> tags) for the most reliable rendering.",
          "Very large or complex HTML files may take a little longer to convert — keep the tab open until the download starts."
        ]}
      />
    </div>
  );
}
'use client';
import { textFileProblem, decodedText } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_HTML_STAGED_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import PageSetup, { PAGE_SETUP_DEFAULT, withPageSetup } from '../../../components/PageSetup';
import { useToolError } from '../../../lib/useToolError';

export default function HtmlToPdfPage() {
  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useToolError('');
  const [mode, setMode] = useState('file');
  const [setup, setSetup] = useState(PAGE_SETUP_DEFAULT);
  const inputRef = useRef();
  const [pdf, offer, clearPdf] = useDownloadable();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setDone(false);
    clearPdf();
    // P21 (robustness): an empty file or a non-text file (a PDF or an image renamed .html) is said at once.
    const problem = await textFileProblem(f, 'HTML');
    if (problem) { setFile(null); setHtmlContent(''); setError(problem); return; }
    setFile(f);
    // Checked on selection: the HTML is uploaded as-is, so its size is the upload size.
    const sizeCheck = checkOfficeSize(f, MAX_HTML_STAGED_BYTES);
    setError(sizeCheck.ok ? '' : sizeCheck.message);
    // P24: decoded as written (UTF-16, Windows ANSI…); f.text() read everything as UTF-8
    // a legacy page declaring its charset (<meta charset=windows-1252>, Shift_JIS…) is decoded with it; the upload is
    // UTF-8, so the declaration is rewritten to utf-8 (review 03/10: it still said 1252 and Chromium showed "Ã©")
    const head = new TextDecoder('latin1').decode(new Uint8Array(await f.slice(0, 4096).arrayBuffer()));
    const declared = (/<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i.exec(head) || [])[1];
    let text;
    try { text = declared && !/^utf-?8$/i.test(declared) ? new TextDecoder(declared).decode(await f.arrayBuffer()) : await decodedText(f); } catch { text = await decodedText(f); }
    text = text.replace(/(<meta[^>]+charset\s*=\s*["']?\s*)[\w-]+/i, '$1utf-8');
    setHtmlContent(text);
  };

  const convert = async () => {
    if (!htmlContent) return;
    const uploadBlob = new Blob([withPageSetup(htmlContent, setup)], { type: 'text/html' });
    const sizeCheck = checkOfficeSize(uploadBlob, MAX_HTML_STAGED_BYTES);
    if (!sizeCheck.ok) { setError(sizeCheck.message); return; }
    setLoading(true);
    setDone(false);
    clearPdf();
    setError('');
    try {
      setStage(null);
      const result = await convertOffice({ file: new File([uploadBlob], 'document.html', { type: 'text/html' }), endpoint: '/api/convert-html-to-pdf', onStage: setStage });
      const pdfBlob = result.blob;
      const filename = (file?.name ? file.name.replace(/\.[^.]+$/, '') : 'document') + '.pdf';
      offer(pdfBlob, filename);
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
        <p className="text-neutral-500 text-center mb-8">Convert HTML files or code to PDF with a real browser engine</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setMode('file'); setHtmlContent(''); setFile(null); setDone(false); clearPdf(); setError(''); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Upload File</button>
            <button onClick={() => { setMode('paste'); setHtmlContent(''); setFile(null); setDone(false); clearPdf(); setError(''); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Paste Code</button>
          </div>
          {mode === 'file' ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : 'Click or drop an HTML file here'}</p>
              <input ref={inputRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-mono h-48 resize-none" placeholder="Paste your HTML code here..." value={htmlContent} onChange={(e) => { setHtmlContent(e.target.value); setDone(false); clearPdf(); }} />
          )}
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_HTML_STAGED_BYTES)} of HTML</p>
          <PageSetup value={setup} onChange={setSetup} />
          <button onClick={convert} disabled={!htmlContent || loading || new Blob([htmlContent]).size > officeMaxBytes(MAX_HTML_STAGED_BYTES)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? officeStageLabel(stage) : 'Convert to PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-2">PDF ready</div>
              <DownloadReady file={pdf} className="mt-3" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="HTML to PDF"
        description="HTML to PDF uploads your HTML code or file — including its CSS — to our conversion service, which renders it with a real browser engine (Chromium via Gotenberg) and returns a PDF for you to download. We tested a page with CSS grid, flexbox, a gradient with a shadow, a table with a merged cell, two-column text, an inline SVG, print-only CSS and French accents: it matched what Chrome prints for the same page. The one difference: a font that isn't installed on our servers (Georgia in our test) is replaced by a similar one (Liberation Serif), so line breaks can shift slightly."
        howTo={[
          "Choose 'Upload File' to select an .html file, or 'Paste Code' to type or paste HTML directly.",
          "Click 'Convert to PDF'. Your HTML is uploaded and rendered by a real browser engine into a PDF.",
          "Once the PDF is ready, click 'Download'.",
          "Open the downloaded PDF to confirm it looks right."
        ]}
        faqs={[
          { q: "Is HTML to PDF completely free to use?", a: "Yes, it's completely free with no signup. It runs on our server, which allows a set number of conversions per connection each hour and day." },
          { q: "Can I customize page size, margins, or headers/footers?", a: "Page size (A4, Letter, Legal, A3, A5), orientation and margins: yes, with the three choices above the button — or leave them on 'As in the document' to keep the page's own CSS. Headers and footers: not offered." },
          { q: "Will my HTML documents be uploaded to a server?", a: "Yes. Your HTML code or file is uploaded to our conversion service, purely to render the final PDF with a real browser engine, and it's discarded immediately afterward." },
          { q: "What HTML features are supported?", a: "Whatever a modern Chromium browser can render: CSS styling, images, tables, and most modern HTML5 elements. In our test the PDF matched Chrome's print output, except that fonts missing from our servers are replaced by similar ones." }
        ]}
        tips={[
          "Use absolute image URLs (starting with https://) rather than relative paths, since a relative path won't resolve on the conversion service.",
          "Check your HTML with your browser's Print preview first — in our test the PDF matched Chrome's print output, and print-only CSS (@media print) applies.",
          "For pasted code, make sure to include a full HTML document (with <html> and <body> tags) for the most reliable rendering.",
          "Very large or complex HTML files may take a little longer to convert — keep the tab open until the Download button appears."
        ]}
      />
    </div>
  );
}
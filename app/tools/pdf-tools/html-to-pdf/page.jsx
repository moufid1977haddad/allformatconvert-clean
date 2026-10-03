'use client';
import { textFileProblem, decodedText } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_HTML_STAGED_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeMaxBytes, officeMaxLabel, officeStageLabel } from '../../../lib/officeUpload';
import PageSetup, { PAGE_SETUP_DEFAULT, withPageSetup } from '../../../components/PageSetup';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

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
  // P25 (03/10, E4): from a URL, as iLovePDF offers it (screen size, page size, orientation, margins, one long page).
  const [url, setUrl] = useState('');
  const [view, setView] = useState('1440');
  const [singlePage, setSinglePage] = useState(false);
  const [printCss, setPrintCss] = useState(false);
  const [urlSetup, setUrlSetup] = useState({ size: 'A4', landscape: false, margin: '10mm' });
  const [notice, setNotice] = useState('');

  const convertUrl = async () => {
    const address = /^[a-z][a-z0-9+.-]*:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setLoading(true); setDone(false); clearPdf(); setError(''); setNotice(''); setStage('url');
    try {
      const res = await fetch('/api/convert-url-to-pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: address, ...urlSetup, view: Number(view), singlePage, media: printCss ? 'print' : 'screen' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `The conversion failed (HTTP ${res.status}).`);
      }
      const blob = await res.blob();
      if (!blob.size) throw new Error('The conversion returned an empty file. Please try again.');
      let info = {};
      try { info = JSON.parse(res.headers.get('X-Snapshot') || '{}'); } catch { /* no details */ }
      const notes = [];
      if (info.scriptHeavy) notes.push('This page builds most of its content with JavaScript, which is not run here (for safety): the PDF may be incomplete. If it is, open the page itself and print it from there (Print → Save as PDF).');
      if (info.failed + info.skipped > 0) notes.push(`${info.failed + info.skipped} image${info.failed + info.skipped > 1 ? 's or files' : ' or file'} of the page could not be fetched and ${info.failed + info.skipped > 1 ? 'are' : 'is'} missing from the PDF.`);
      setNotice(notes.join(' '));
      offer(blob, `${(info.host || 'page').replace(/[^a-z0-9.-]/gi, '_')}.pdf`);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false); setStage(null);
    }
  };

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
    setNotice('');
    try {
      setStage(null);
      const result = await convertOffice({ file: new File([uploadBlob], 'document.html', { type: 'text/html' }), endpoint: '/api/convert-html-to-pdf', onStage: setStage });
      const pdfBlob = result.blob;
      const filename = (file?.name ? file.name.replace(/\.[^.]+$/, '') : 'document') + '.pdf';
      offer(pdfBlob, filename);
      // P29 (04/10): our Chromium runs no script at all (Gotenberg --chromium-disable-javascript, measured: 0 of 18 ways
      // to run one), as for a URL: said whenever the HTML has scripts, since what they would build is missing.
      if (/<script/i.test(htmlContent)) setNotice('This HTML contains scripts, which are not run here (for safety): anything they would draw or add (charts, generated text) is missing from the PDF. If it is, open the file in your browser and print it from there (Print → Save as PDF).');
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
            <button onClick={() => { setMode('url'); setHtmlContent(''); setFile(null); setDone(false); clearPdf(); setError(''); setNotice(''); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'url' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>From URL</button>
            <button onClick={() => { setMode('file'); setHtmlContent(''); setFile(null); setDone(false); clearPdf(); setError(''); setNotice(''); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Upload File</button>
            <button onClick={() => { setMode('paste'); setHtmlContent(''); setFile(null); setDone(false); clearPdf(); setError(''); setNotice(''); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Paste Code</button>
          </div>
          {mode === 'url' ? (
            <div className="space-y-3">
              <input id="url-input" type="url" inputMode="url" autoComplete="url" placeholder="https://example.com/page" value={url} onChange={(e) => { setUrl(e.target.value); setDone(false); clearPdf(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && url.trim() && !loading) convertUrl(); }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm" aria-label="Web page address" />
              <PageSetup value={urlSetup} onChange={setUrlSetup} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <label className="block"><span className="block text-neutral-500 mb-1">Screen size</span>
                  <select id="url-view" value={view} onChange={(e) => setView(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                    <option value="1920">Large desktop (1920 px)</option><option value="1440">Desktop (1440 px)</option><option value="1024">Laptop / tablet landscape (1024 px)</option>
                    <option value="768">Tablet (768 px)</option><option value="390">Phone (390 px)</option><option value="0">Paper width (no scaling)</option>
                  </select></label>
                <div className="flex flex-col justify-end gap-1">
                  <label className="flex items-center gap-2"><input id="url-single" type="checkbox" checked={singlePage} onChange={(e) => setSinglePage(e.target.checked)} /> One long page</label>
                  <label className="flex items-center gap-2"><input id="url-print" type="checkbox" checked={printCss} onChange={(e) => setPrintCss(e.target.checked)} /> Use the site&apos;s print style</label>
                </div>
              </div>
              <p className="text-neutral-500 text-xs">Public http:// and https:// pages only. The page is fetched by our server with its styles, images and fonts; its scripts are not run, for safety.</p>
            </div>
          ) : mode === 'file' ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="an HTML file" />}</p>
              <input ref={inputRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-mono h-48 resize-none" placeholder="Paste your HTML code here..." value={htmlContent} onChange={(e) => { setHtmlContent(e.target.value); setDone(false); clearPdf(); }} />
          )}
          {mode !== 'url' && <>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_HTML_STAGED_BYTES)} of HTML</p>
          <PageSetup value={setup} onChange={setSetup} />
          </>}
          <button onClick={mode === 'url' ? convertUrl : convert} disabled={loading || (mode === 'url' ? !url.trim() : (!htmlContent || new Blob([htmlContent]).size > officeMaxBytes(MAX_HTML_STAGED_BYTES)))} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? (stage === 'url' ? 'Fetching the page and converting…' : officeStageLabel(stage)) : 'Convert to PDF'}
          </button>
          {error && (
            <p className="text-center text-red-500 text-sm" role="alert">{error}</p>
          )}
          {done && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-2">PDF ready</div>
              {notice && <p className="text-amber-800 text-sm mb-2" data-notice>{notice}</p>}
              <DownloadReady file={pdf} className="mt-3" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="HTML to PDF"
        description="HTML to PDF converts a web page from its address (URL), an HTML file or pasted HTML code. For an address, our server fetches the page with its style sheets, images and fonts — public http and https pages only, never a private network address — and prints it at the screen width you choose (desktop, laptop, tablet or phone), on A4, Letter, Legal, A3 or A5, with your margins, or as one long page; the page's scripts are not run, for safety, so a page that builds its content with JavaScript can come out incomplete (the tool says so). For a file or code, it uploads your HTML — including its CSS — to our conversion service, which renders it with a real browser engine (Chromium via Gotenberg) and returns a PDF for you to download; there too its scripts are not run, for safety, and the tool tells you when your HTML contains any. We tested a page with CSS grid, flexbox, a gradient with a shadow, a table with a merged cell, two-column text, an inline SVG, print-only CSS and French accents: it matched what Chrome prints for the same page. The one difference: a font that isn't installed on our servers (Georgia in our test) is replaced by a similar one (Liberation Serif), so line breaks can shift slightly."
        howTo={[
          "Choose 'From URL' and type the address of a public web page, or 'Upload File' to select an .html file, or 'Paste Code' to type or paste HTML directly.",
          "For a URL, choose the screen size the page is laid out at, the paper, orientation and margins, and optionally 'One long page'.",
          "Click 'Convert to PDF'. Your HTML is uploaded and rendered by a real browser engine into a PDF.",
          "Once the PDF is ready, click 'Download'.",
          "Open the downloaded PDF to confirm it looks right."
        ]}
        faqs={[
          { q: "Is HTML to PDF completely free to use?", a: "Yes, it's completely free with no signup. It runs on our server, which allows a set number of conversions per connection each hour and day." },
          { q: "Can I customize page size, margins, or headers/footers?", a: "Page size (A4, Letter, Legal, A3, A5), orientation and margins: yes, with the three choices above the button — or leave them on 'As in the document' to keep the page's own CSS. Headers and footers: not offered." },
          { q: "Can I convert a web page from its URL?", a: "Yes: choose 'From URL' and type the address. Our server fetches the page and everything it needs to display (style sheets, images, fonts), then prints it with Chromium. Only public http:// and https:// addresses on the standard ports are accepted: addresses of private or local networks are refused, and every redirect is checked the same way. The page's scripts are not run, for safety — most pages print fully, but one that builds its content with JavaScript can come out incomplete, and the tool tells you when a page looks like one. Pages behind a login cannot be converted: only what anyone can see without signing in." },
          { q: "Will my HTML documents be uploaded to a server?", a: "Yes. Your HTML code or file is uploaded to our conversion service, purely to render the final PDF with a real browser engine, and it's discarded immediately afterward." },
          { q: "What HTML features are supported?", a: "Whatever a modern Chromium browser can render: CSS styling, images, tables, and most modern HTML5 elements. In our test the PDF matched Chrome's print output, except that fonts missing from our servers are replaced by similar ones. Scripts (JavaScript) are not run, for safety: content a script would build, such as a chart, is missing from the PDF, and the tool says so when your HTML has scripts." }
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
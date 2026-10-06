'use client';
import { textFileProblem, decodedText } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import DownloadReady, { useDownloadable } from '../../../components/DownloadReady';
import { MAX_HTML_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
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
      if (/<script\b/i.test(htmlContent)) setNotice('This HTML contains scripts, which are not run here (for safety): anything they would draw or add (charts, generated text) is missing from the PDF. If something is missing, open the file itself in a web browser and print it from there (Print → Save as PDF).');
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
        description={`HTML to PDF prints HTML to a PDF with Chromium, the engine behind Chrome, on our own conversion service. It takes three kinds of input: the address of a public web page, an .html or .htm file, or HTML code you paste. Scripts never run, for safety, so anything JavaScript would build is missing; the page warns you when your HTML has scripts or when a web page seems to depend on them. A font our servers do not have is replaced by a similar one, which can move line breaks. Headers and footers are not offered.`}
        howToTitle="How to convert HTML or a web page to PDF"
        howTo={[
          `Choose "From URL" and type a page address, "Upload File" to pick an .html file, or "Paste Code".`,
          `Set "Page size", "Orientation" and "Margins"; for an address, also pick a "Screen size" and, if you like, "One long page".`,
          `Click "Convert to PDF"; when "PDF ready" appears, "Download" saves the printed page.`,
        ]}
        specs={[
          { label: 'Input', value: `A public http:// or https:// address, an .html or .htm file, or pasted HTML` },
          { label: 'Output', value: `PDF on A4, Letter, Legal, A3 or A5, portrait or landscape, or the page size set in the document` },
          { label: 'File or code size', value: `${officeMaxLabel(MAX_HTML_STAGED_BYTES)} of HTML` },
          { label: 'From an address', value: `Page HTML up to 5 MB, at most 150 resources of up to 3 MB each and 25 MB in all; ports 80 and 443 only; up to 5 redirects` },
          { label: 'Usage limits', value: `From an address: 20 conversions an hour and 60 a day per visitor, and 300 an hour for all visitors together. File or code over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB: a limit per network per hour and per day.` },
        ]}
        privacy={`For an address, our server downloads the public page with its style sheets, images and fonts, refuses private-network addresses and checks every redirect, then our Chromium service prints it. A file or pasted code is sent over HTTPS to that same Chromium service, which runs no script. HTML larger than ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB passes first through our media service, which deletes it once the PDF exists and removes the PDF as soon as this page has downloaded it, or after a time limit.`}
        faqs={[
          { q: `Can I convert a web page from its URL?`, a: `Yes. Choose "From URL" and type the address. Only public http and https pages on ports 80 and 443 work, and private-network addresses are refused. Pages behind a login show only what a visitor without an account sees, and a page built by JavaScript can come out incomplete because scripts are not run.` },
          { q: `Does the PDF look like what Chrome prints?`, a: `Yes, in our test of 19 September 2026: a page with CSS grid, flexbox, a gradient with a shadow, a merged table cell, two columns, an inline SVG, print-only CSS and French accents had the same layout as Chrome's print. The differences were the fonts: Georgia became Liberation Serif and Arial became Liberation Sans.` },
          { q: `How many pages can I convert from addresses?`, a: `20 an hour and 60 a day per visitor, plus a ceiling of 300 an hour for all visitors together. Uploaded files and pasted code have no such count up to ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB; above that size, a separate hourly and daily limit per connection applies.` },
          { q: `Do images with relative paths work in an uploaded file?`, a: `No. Only the HTML itself is sent, without the files stored next to it, so a relative path cannot be found. Use full https:// addresses for images and style sheets, or embed them in the HTML as data URLs.` },
        ]}
        tips={[
          `For a site that has a print layout without menus and ads, tick the print-style box before converting its address.`,
        ]}
      />
    </div>
  );
}
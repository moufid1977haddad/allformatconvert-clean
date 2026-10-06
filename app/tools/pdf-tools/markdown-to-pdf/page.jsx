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

// A real PDF file (P18, 01/10). The tool used to open the browser's print dialog ("Save as PDF"): on an iPhone or an
// iPad that is no file at all, and the page itself said "Use Save as PDF in the print dialog". The reference
// converters (markdowntopdf.com, CloudConvert, the md-to-pdf engine of VS Code's "Markdown PDF") render the Markdown
// as HTML and print it with a headless Chromium: a vector PDF, selectable text, working links. We do exactly that
// with the site's own Chromium service (Gotenberg, as HTML to PDF). The Markdown is turned into HTML here
// (CommonMark + GitHub tables, marked) and cleaned by DOMPurify first: no script from a .md file ever runs anywhere.
const CSS = `
@page { size: A4; margin: 18mm 16mm; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Liberation Sans", "Noto Sans", Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.55; color: #1f2328; margin: 0; }
h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.3em 0 0.5em; font-weight: 700; page-break-after: avoid; break-after: avoid; }
h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; margin-top: 0; }
h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
h3 { font-size: 1.25em; } h4 { font-size: 1em; } h5 { font-size: 0.875em; } h6 { font-size: 0.85em; color: #59636e; }
p, ul, ol, table, pre, blockquote { margin: 0 0 0.9em; }
a { color: #0969da; text-decoration: underline; }
code, pre, kbd { font-family: "Liberation Mono", "DejaVu Sans Mono", "Noto Sans Mono", Consolas, monospace; font-size: 0.9em; }
code { background: #eff1f3; padding: 0.15em 0.35em; border-radius: 4px; }
pre { background: #f6f8fa; padding: 12px 14px; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; page-break-inside: avoid; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #d0d7de; padding: 0 1em; color: #59636e; }
table { border-collapse: collapse; width: auto; max-width: 100%; page-break-inside: auto; }
th, td { border: 1px solid #d0d7de; padding: 6px 12px; text-align: left; vertical-align: top; }
th { background: #f6f8fa; font-weight: 700; }
tr { page-break-inside: avoid; }
img { max-width: 100%; }
hr { border: 0; border-top: 1px solid #d0d7de; margin: 1.5em 0; }
ul.contains-task-list, li.task-list-item { list-style: none; }
input[type=checkbox] { margin-right: 0.4em; }
`;

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The whole HTML document sent to the renderer. */
async function markdownToHtmlDocument(md, title) {
  const [{ marked }, { default: DOMPurify }] = await Promise.all([import('marked'), import('dompurify')]);
  const body = DOMPurify.sanitize(marked.parse(md, { gfm: true, async: false }));
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}

export default function MarkdownToPdfPage() {
  const [file, setFile] = useState(null);
  const [mdContent, setMdContent] = useState('');
  const [mode, setMode] = useState('file');
  const [setup, setSetup] = useState(PAGE_SETUP_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [error, setError] = useToolError('');
  const [pdf, offer, clearPdf] = useDownloadable();
  const inputRef = useRef();

  const reset = () => { clearPdf(); setError(''); };
  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    reset();
    // P21 (robustness): an empty file or a non-text file is said at once.
    const problem = await textFileProblem(f, 'Markdown');
    if (problem) { setFile(null); setMdContent(''); setError(problem); return; }
    setFile(f);
    setMdContent(await decodedText(f)); // P24: decoded as written, not always as UTF-8
  };

  const baseName = file?.name ? file.name.replace(/\.[^.]+$/, '') : 'document';
  const convert = async () => {
    if (!mdContent) return;
    setLoading(true);
    reset();
    try {
      const html = withPageSetup(await markdownToHtmlDocument(mdContent, baseName), setup);
      const upload = new File([html], 'document.html', { type: 'text/html' });
      const sizeCheck = checkOfficeSize(upload, MAX_HTML_STAGED_BYTES);
      if (!sizeCheck.ok) throw new Error(sizeCheck.message);
      setStage(null);
      const result = await convertOffice({ file: upload, endpoint: '/api/convert-html-to-pdf', onStage: setStage });
      offer(result.blob, `${baseName}.pdf`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Markdown files or text to a PDF file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setMode('file'); setMdContent(''); setFile(null); reset(); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Upload File</button>
            <button onClick={() => { setMode('paste'); setMdContent(''); setFile(null); reset(); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Paste Text</button>
          </div>
          {mode === 'file' ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a .md file" />}</p>
              <input ref={inputRef} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <TextArea aria-label="Markdown" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-mono h-48 resize-none" placeholder="Paste your Markdown here..." value={mdContent} onChange={(e) => { setMdContent(e.target.value); reset(); }} />
          )}
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {officeMaxLabel(MAX_HTML_STAGED_BYTES)} of Markdown</p>
          <PageSetup value={setup} onChange={setSetup} />
          <button onClick={convert} disabled={!mdContent || loading || new Blob([mdContent]).size > officeMaxBytes(MAX_HTML_STAGED_BYTES)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? officeStageLabel(stage) : 'Convert to PDF'}
          </button>
          {error && <p className="text-center text-red-600 text-sm" role="alert">{error}</p>}
          {pdf && !error && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-700 text-xl font-bold mb-2">PDF ready</div>
              <DownloadReady file={pdf} className="mt-3" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Markdown to PDF"
        description={`Markdown to PDF renders Markdown as a clean document and saves it as a PDF file. It reads CommonMark plus GitHub Flavored Markdown: headings, emphasis, strikethrough, lists and task lists, links, images, fenced code blocks, tables and blockquotes. Upload a .md, .markdown or .txt file, or paste the text. The Markdown becomes HTML with scripts removed, and our Chromium service prints that HTML with selectable text. Images must be published on the web, since a file on your computer cannot be reached.`}
        howToTitle="How to convert Markdown to PDF"
        howTo={[
          `Choose "Upload File" to pick a .md file, or "Paste Text" to type or paste Markdown.`,
          `Keep "Page size" on "As in the document" for A4, or pick another size, an "Orientation" and "Margins".`,
          `Click "Convert to PDF"; once "PDF ready" is shown, "Download" saves the rendered Markdown.`,
        ]}
        specs={[
          { label: 'Input formats', value: `.md, .markdown or .txt file, or pasted text` },
          { label: 'Output', value: `PDF, A4 unless you choose Letter, Legal, A3 or A5` },
          { label: 'Size limit', value: `${officeMaxLabel(MAX_HTML_STAGED_BYTES)} of HTML` },
          { label: 'Usage limits', value: `Documents over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB of HTML count toward a limit per network per hour and per day.` },
        ]}
        privacy={`Your Markdown becomes HTML on your device, with scripts and event handlers removed, before it is sent to our Chromium service to be printed. Only the HTML is sent, not the original file. HTML over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB goes in parts through our media service, which drops it after printing and erases the PDF when this page has fetched it, or after a time limit.`}
        faqs={[
          { q: `Are GitHub tables and task lists supported?`, a: `Yes. GitHub Flavored Markdown is switched on, so tables, task lists with their checkboxes, strikethrough and fenced code blocks render, along with the usual CommonMark headings, lists, links, images and blockquotes. Raw HTML in the Markdown is cleaned and any script is removed.` },
          { q: `Can I use a page size other than A4?`, a: `Yes. A4 is the default. Choose Letter, Legal, A3 or A5 in "Page size", portrait or landscape in "Orientation", and None, Small (10 mm), Normal (20 mm) or Big (30 mm) in "Margins".` },
          { q: `Will images from my computer appear in the PDF?`, a: `No. Only the HTML is sent, so a path to a file on your computer cannot be reached by our service. Use pictures published on the web with a full https:// address; they are fetched when the page is printed.` },
          { q: `Do code blocks and tables break across pages?`, a: `No for a code block that fits on one page: it is kept whole. A long table can run over several pages, but each of its rows stays in one piece.` },
        ]}
        tips={[
          `Start the document with a single # heading: it is set in the largest size, with a rule underneath.`,
        ]}
      />
    </div>
  );
}

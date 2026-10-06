'use client';
import { textFileProblem, decodedText } from '../../../lib/fileChecks';
import { useMemo, useState, useRef } from 'react';
import { textToPdf, needsRenderer, textToHtmlDocument } from '../../../lib/textPdf';
import { MAX_HTML_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeStageLabel, officeMaxLabel } from '../../../lib/officeUpload';
import SeoContent from '../../../components/SeoContent';
import { FileDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';

export default function TextToPdfPage() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('paste');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [layout, setLayout] = useState({ page: 'A4', landscape: false, fontSize: 12, margin: 50 });
  const inputRef = useRef();
  // Emoji or a script the in-browser fonts don't draw (Bengali, Gurmukhi, Sinhala…): printed by our Chromium (lib/textPdf.js).
  const viaRenderer = useMemo(() => needsRenderer(text), [text]);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setDownloadUrl(null);
    // P21 (robustness): an empty or non-text file (a PDF or an image renamed .txt) is said at once.
    const problem = await textFileProblem(f, 'text');
    if (problem) { setFile(null); setText(''); setStatus(problem); return; }
    setFile(f);
    // P24: decoded as written (Windows ANSI, UTF-16 "Unicode Text"…); f.text() read everything as UTF-8
    const content = await decodedText(f);
    setText(content);
    setStatus('');
    setDownloadUrl(null);
  };

  const convert = async () => {
    if (!text) return;
    setLoading(true);
    setStatus('Converting...');
    setDownloadUrl(null);
    try {
      let blob;
      if (viaRenderer) {
        const title = file ? file.name.replace(/.[^.]+$/, '') : 'Document';
        const upload = new File([textToHtmlDocument(text, title, layout)], 'document.html', { type: 'text/html' });
        const sizeCheck = checkOfficeSize(upload, MAX_HTML_STAGED_BYTES);
        if (!sizeCheck.ok) throw new Error(sizeCheck.message);
        const result = await convertOffice({ file: upload, endpoint: '/api/convert-html-to-pdf', onStage: (st) => setStatus(officeStageLabel(st)) });
        blob = result.blob;
      } else {
        // Latin, Greek, Cyrillic, Arabic, Hebrew, Devanagari, Tamil, Thai, CJK (30/09): Noto fonts, in the browser.
        blob = new Blob([await textToPdf(text, { ...layout, onPhase: setStatus })], { type: 'application/pdf' });
      }
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      reportShownMessage(err);
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert plain text to a PDF file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setMode('paste'); setText(''); setFile(null); setDownloadUrl(null); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Paste Text</button>
            <button onClick={() => { setMode('file'); setText(''); setFile(null); setDownloadUrl(null); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Upload File</button>
          </div>
          {mode === 'paste' ? (
            <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          ) : (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a .txt file" />}</p>
              <input ref={inputRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
            </div>
          )}
          {viaRenderer && <p className="text-xs text-neutral-600 text-center" data-renderer-note>Your text has emoji or a script drawn by our PDF service (a real browser engine with the Noto fonts): it is sent there to make the PDF, then deleted.</p>}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Page size</span>
              <select id="tp-page" value={layout.page} onChange={(e) => setLayout({ ...layout, page: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                {['A4', 'Letter', 'Legal', 'A5'].map((v) => <option key={v} value={v}>{v}</option>)}
              </select></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Orientation</span>
              <select id="tp-orient" value={layout.landscape ? 'landscape' : 'portrait'} onChange={(e) => setLayout({ ...layout, landscape: e.target.value === 'landscape' })} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
              </select></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Text size</span>
              <select id="tp-size" value={layout.fontSize} onChange={(e) => setLayout({ ...layout, fontSize: Number(e.target.value) })} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                {[9, 10, 11, 12, 14, 16, 18, 24].map((v) => <option key={v} value={v}>{v} pt</option>)}
              </select></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Margins</span>
              <select id="tp-margin" value={layout.margin} onChange={(e) => setLayout({ ...layout, margin: Number(e.target.value) })} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                <option value={36}>Narrow</option><option value={50}>Normal</option><option value={72}>Wide</option>
              </select></label>
          </div>
          <button onClick={convert} disabled={!text || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p role="status" className="text-center text-neutral-700 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file ? file.name.replace(/\.[^.]+$/, '') + '.pdf' : 'document.pdf'} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text to PDF"
        description={`Text to PDF puts plain text into a PDF, wrapping long lines and starting new pages as needed, with the free Noto fonts so the letters stay selectable text. Paste text or upload a .txt file; Windows and Unicode text files are read in their own encoding. Latin, Greek, Cyrillic, Arabic and Hebrew, Devanagari, Tamil, Thai, Chinese, Japanese and Korean are drawn in your browser, not on our server. Emoji, Bengali and other scripts are printed by our Chromium service instead. There is no styling: no bold, headings or title field.`}
        howToTitle="How to convert text to PDF"
        howTo={[
          `Choose "Paste Text" and type, or "Upload File" to pick a .txt file.`,
          `Pick the "Page size", "Orientation", "Text size" and "Margins".`,
          `Click "Convert to PDF"; when "Done!" appears, "Download" saves your text as a PDF.`,
        ]}
        specs={[
          { label: 'Input formats', value: `Pasted text or a .txt file` },
          { label: 'Output', value: `PDF with selectable text` },
          { label: 'Page and type', value: `A4, Letter, Legal or A5; portrait or landscape; text from 9 to 24 pt; narrow, normal or wide margins` },
          { label: 'Text length', value: `Not capped when the PDF is made in your browser; ${officeMaxLabel(MAX_HTML_STAGED_BYTES)} of HTML when our service prints it` },
        ]}
        privacy={`Unless the page says otherwise, the PDF is made on your device, with fonts loaded from this site, or from cdn.jsdelivr.net for Chinese, Japanese and Korean, without your text. When the text holds emoji, Bengali, another script or a symbol outside those fonts, such as an arrow, a note above the options says so, and the text is sent to our Chromium service, which returns the PDF. Above ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB of HTML, it first goes in parts through our media service, which deletes it after printing.`}
        faqs={[
          { q: `Does it work with Arabic, Hindi or Chinese text?`, a: `Yes. Arabic and Hebrew are laid out right to left, Hindi is shaped with its Devanagari conjuncts, and Chinese, Japanese and Korean use Noto Sans SC, JP or KR. Printed by our service, we also checked Bengali, Gurmukhi, Gujarati, Telugu, Kannada, Malayalam, Odia, Sinhala, Myanmar, Khmer, Lao, Ethiopic, Georgian and Armenian.` },
          { q: `Can I put emoji in the PDF?`, a: `Yes, in color, with skin tones, flags and family sequences. Emoji are printed by our Chromium service with Noto Color Emoji, so the page tells you before converting that your text will be sent there.` },
          { q: `Is my text uploaded?`, a: `No, unless the text holds emoji, Bengali, another script or a symbol outside the fonts loaded on your device, such as an arrow or a check mark. In that case a note above the options says so before you convert, and the text goes to our Chromium service.` },
          { q: `Can I change the font or add a title?`, a: `No. The font is Noto, chosen for each script, and there is no title field. You can change the page size, the orientation, the text size from 9 to 24 pt and the margins.` },
        ]}
        tips={[
          `Need bold text, headings or tables? Write the text in Markdown and use Markdown to PDF.`,
        ]}
      />
    </div>
  );
}
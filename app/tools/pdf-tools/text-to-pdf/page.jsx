'use client';
import { textFileProblem } from '../../../lib/fileChecks';
import { useMemo, useState, useRef } from 'react';
import { textToPdf, needsRenderer, textToHtmlDocument } from '../../../lib/textPdf';
import { MAX_HTML_STAGED_BYTES } from '@/lib/quota/limits';
import { convertOffice, checkOfficeSize, officeStageLabel } from '../../../lib/officeUpload';
import SeoContent from '../../../components/SeoContent';
import { FileDownload } from '../../../components/FileDownload';

export default function TextToPdfPage() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('paste');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
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
    const content = await f.text();
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
        const upload = new File([textToHtmlDocument(text, title)], 'document.html', { type: 'text/html' });
        const sizeCheck = checkOfficeSize(upload, MAX_HTML_STAGED_BYTES);
        if (!sizeCheck.ok) throw new Error(sizeCheck.message);
        const result = await convertOffice({ file: upload, endpoint: '/api/convert-html-to-pdf', onStage: (st) => setStatus(officeStageLabel(st)) });
        blob = result.blob;
      } else {
        // Latin, Greek, Cyrillic, Arabic, Hebrew, Devanagari, Tamil, Thai, CJK (30/09): Noto fonts, in the browser.
        blob = new Blob([await textToPdf(text, { onPhase: setStatus })], { type: 'application/pdf' });
      }
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
        <h1 className="text-3xl font-bold text-center mb-2">Text to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert plain text to a PDF file</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setMode('paste'); setText(''); setFile(null); setDownloadUrl(null); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Paste Text</button>
            <button onClick={() => { setMode('file'); setText(''); setFile(null); setDownloadUrl(null); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Upload File</button>
          </div>
          {mode === 'paste' ? (
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          ) : (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : 'Click or drop a .txt file here'}</p>
              <input ref={inputRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
            </div>
          )}
          {viaRenderer && <p className="text-xs text-neutral-600 text-center" data-renderer-note>Your text has emoji or a script drawn by our PDF service (a real browser engine with the Noto fonts): it is sent there to make the PDF, then deleted.</p>}
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
        description="Text to PDF converts plain text — pasted directly or from an uploaded .txt file — into a real PDF with automatic word-wrapping and page breaks, in every common writing system and with emoji: Latin alphabets, Greek, Cyrillic, Vietnamese, Arabic and Hebrew (right to left), Hindi, Bengali, Punjabi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Sinhala, Thai, Lao, Myanmar, Khmer, Amharic, Georgian, Armenian, Chinese, Japanese and Korean, with the free Noto fonts (SIL Open Font License). Text in Latin, Greek, Cyrillic, Arabic, Hebrew, Devanagari, Tamil, Thai or CJK is made entirely in your browser; emoji (in colour, skin tones and flags included) and the other scripts are printed by our own PDF service with a real browser engine, and the page says so before you convert. The text stays selectable and searchable in the PDF. Font size (12 pt), margins and page size (A4) are fixed."
        howTo={[
          "Choose 'Paste Text' to type or paste content, or 'Upload File' to select a .txt file.",
          "Review the text — uploading a file auto-fills the text area with its content.",
          "Click 'Convert to PDF' to generate the document with automatic word wrap and page breaks.",
          "Click 'Download' to save the file (on an iPhone or iPad, 'Save / Share' also sends it to Files, Mail or AirDrop)."
        ]}
        faqs={[
          { q: "Is Text to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Which languages and alphabets work?", a: "All the common ones: Latin alphabets (every accent, Polish, Turkish, Vietnamese…), Greek, Cyrillic, Arabic and Hebrew (right to left), Hindi, Bengali, Punjabi, Gujarati, Odia, Tamil, Telugu, Kannada, Malayalam, Sinhala, Thai, Lao, Myanmar, Khmer, Amharic, Georgian, Armenian, Chinese, Japanese and Korean — and emoji, in colour. Each character is drawn with a matching Noto font and only the letters used are embedded, so the PDF stays small." },
          { q: "Can I adjust font size, margins, or the document title?", a: "No — every PDF uses 12 pt Noto Sans, fixed margins and standard A4 pages; there's no title field or style settings." },
          { q: "What file types can I upload?", a: "Only plain .txt files — the content is read as text and filled into the paste box." },
          { q: "Is my text uploaded to a server?", a: "Not for Latin, Greek, Cyrillic, Arabic, Hebrew, Devanagari, Tamil, Thai, Chinese, Japanese or Korean text: that PDF is made in your browser. Text with emoji or another script is printed by our own PDF service (not a third party) and deleted right after; the page tells you before you convert." }
        ]}
        tips={[
          "Line breaks in your original text are preserved as paragraph breaks; long lines wrap automatically to fit the page width.",
          "Very long text automatically flows onto additional pages, so there's no need to split content yourself.",
          "For non-.txt files (like .docx), copy the text out and paste it directly instead of trying to upload the file.",
          "Since font and layout are fixed, this tool suits quick, simple documents rather than styled or branded output."
        ]}
      />
    </div>
  );
}
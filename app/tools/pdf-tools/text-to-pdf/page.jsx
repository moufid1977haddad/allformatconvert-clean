'use client';
import { useState, useRef } from 'react';
import { textToPdf } from '../../../lib/textPdf';
import SeoContent from '../../../components/SeoContent';

export default function TextToPdfPage() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('paste');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
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
      // Any script since 30/09 (lib/textPdf.js): Noto fonts, shaping by fontkit, right-to-left paragraphs.
      const pdfBytes = await textToPdf(text, { onPhase: setStatus });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
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
          <button onClick={convert} disabled={!text || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file ? file.name.replace(/\.[^.]+$/, '') + '.pdf' : 'document.pdf'} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition text-white">Download PDF</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text to PDF"
        description="Text to PDF converts plain text — pasted directly or from an uploaded .txt file — into a PDF entirely in your browser, with automatic word-wrapping and page breaks — in almost any language: Latin, Greek and Cyrillic alphabets, Vietnamese, Arabic and Hebrew (right to left), Hindi, Tamil, Thai, Chinese, Japanese and Korean, with the free Noto fonts. Your content is never uploaded to a server. Font size (12pt Helvetica), margins, and page size (A4) are fixed and can't be customized, and there's no document title field. Windows line endings and tabs are handled; the built-in PDF font covers Latin-script text (Western European accents, €), and characters outside it, such as Cyrillic, Greek, Asian scripts or emoji, are listed instead of producing a broken file."
        howTo={[
          "Choose 'Paste Text' to type or paste content, or 'Upload File' to select a .txt file.",
          "Review the text — uploading a file auto-fills the text area with its content.",
          "Click 'Convert to PDF' to generate the document with automatic word wrap and page breaks.",
          "Click 'Download PDF' to save the file."
        ]}
        faqs={[
          { q: "Is Text to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Which languages and alphabets work?", a: "Latin alphabets (with every accent, Polish, Turkish, Vietnamese…), Greek, Cyrillic, Arabic and Hebrew (written right to left, lines aligned right), Hindi and other Devanagari languages, Tamil, Thai, Chinese, Japanese and Korean (Bengali is not supported yet). Each character is drawn with a matching Noto font, and only the letters used are embedded, so the PDF stays small. For Chinese, Japanese or Korean only the parts of the font your text needs are downloaded. Emoji are not supported." },
          { q: "Can I adjust font size, margins, or the document title?", a: "No — every PDF uses 12 pt Noto Sans, fixed margins and standard A4 pages; there's no title field or style settings." },
          { q: "What file types can I upload?", a: "Only plain .txt files — the content is read as text and filled into the paste box." },
          { q: "Is my text uploaded to a server?", a: "No, the PDF is generated entirely in your browser. Only the fonts are downloaded (never your text)." }
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
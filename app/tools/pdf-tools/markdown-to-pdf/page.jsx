'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function MarkdownToPdfPage() {
  const [file, setFile] = useState(null);
  const [mdContent, setMdContent] = useState('');
  const [mode, setMode] = useState('file');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setDone(false);
    setStatus('');
    const text = await f.text();
    setMdContent(text);
  };

  const convert = async () => {
    if (!mdContent) return;
    setLoading(true);
    setDone(false);
    setStatus('Converting...');
    try {
      const { marked } = await import('marked');
      const html = marked(mdContent);
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Markdown</title><style>body{font-family:Georgia,serif;margin:40px;line-height:1.8;color:#000;max-width:800px;margin:auto;}h1,h2,h3{color:#000;border-bottom:1px solid #ccc;padding-bottom:4px;}code{background:#f4f4f4;padding:2px 6px;border-radius:3px;font-family:monospace;}pre{background:#f4f4f4;padding:16px;border-radius:6px;}blockquote{border-left:4px solid #ccc;margin:0;padding-left:16px;color:#666;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>' + html + '</body></html>');
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
        <h1 className="text-3xl font-bold text-center mb-2">Markdown to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Markdown files or text to PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => { setMode('file'); setMdContent(''); setFile(null); setDone(false); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'file' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Upload File</button>
            <button onClick={() => { setMode('paste'); setMdContent(''); setFile(null); setDone(false); }} className={`flex-1 py-2 rounded-lg font-semibold transition ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>Paste Text</button>
          </div>
          {mode === 'file' ? (
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
              <p className="text-neutral-500">{file ? file.name : 'Click or drop a .md file here'}</p>
              <input ref={inputRef} type="file" accept=".md,.markdown,.txt" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm font-mono h-48 resize-none" placeholder="Paste your Markdown here..." value={mdContent} onChange={e => setMdContent(e.target.value)} />
          )}
          <button onClick={convert} disabled={!mdContent || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
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
        title="Markdown to PDF"
        description="Markdown to PDF renders your Markdown as styled HTML in a new browser tab, entirely on your device — your content is never uploaded to a server. It doesn't generate a PDF file directly: instead, it opens your browser's print dialog, where you choose 'Save as PDF' to produce the actual file."
        howTo={[
          "Choose 'Upload File' to select a .md file, or 'Paste Text' to type or paste Markdown directly.",
          "Click 'Convert to PDF' — a new tab renders your Markdown and the browser's print dialog appears.",
          "In the print dialog, choose 'Save as PDF' (or your OS equivalent) as the destination.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is Markdown to PDF really free to use?", a: "Yes, it's completely free with no signup or usage limits." },
          { q: "What markdown syntax is supported?", a: "Standard Markdown: headings, bold, italics, lists, links, code blocks, tables, blockquotes, and images." },
          { q: "Is my markdown content stored or shared?", a: "No, your content is rendered entirely in your browser and is never uploaded to a server." },
          { q: "Can I customize fonts, margins, or page size?", a: "Headings, code blocks, and blockquotes get a built-in style, but page size and margins come from your browser's print dialog, not from settings on this page." }
        ]}
        tips={[
          "Use proper heading hierarchy (# H1, ## H2, ### H3) since it maps directly to styled headings in the output.",
          "Add alt text to images in your markdown for accessibility, even though it won't render visually.",
          "Preview complex formatting by checking the rendered tab before saving as PDF, so you can catch syntax issues first.",
          "Keep your original .md file as your source of truth — the PDF is a rendered export, not something you can edit back."
        ]}
      />
    </div>
  );
}
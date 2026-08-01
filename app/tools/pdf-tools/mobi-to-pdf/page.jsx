'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function MobiToPdfPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setStatus('');
    setDone(false);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setDone(false);
    setStatus('Converting...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let text = decoder.decode(bytes);
      text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const chunks = text.match(/.{1,2000}/g) || [];
      let allHtml = chunks.map(chunk => '<p>' + chunk + '</p>').join('');
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>MOBI</title><style>body{font-family:Georgia,serif;margin:40px;line-height:1.8;color:#000;max-width:800px;margin:auto;}p{margin-bottom:12px;}</style></head><body><h1>' + file.name + '</h1>' + allHtml + '</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setStatus('');
        setDone(true);
        setLoading(false);
      }, 800);
    } catch (err) {
      setStatus('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">MOBI to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert MOBI ebooks to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a MOBI file here'}</p>
            <input ref={inputRef} type="file" accept=".mobi,.azw,.azw3" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
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
        title="MOBI to PDF"
        description="MOBI to PDF is a lightweight, browser-only tool: it reads the raw bytes of your MOBI file, strips out anything that looks like a markup tag, and displays the leftover text in a print-ready tab — your file is never uploaded to a server. MOBI is a compressed binary ebook format, and this simple approach does not decode that compression, so results are reliable mainly for MOBI files that store their text with little or no compression; heavily compressed books may come out with garbled or unreadable text."
        howTo={[
          "Click the upload area and select a .mobi, .azw, or .azw3 file from your device.",
          "Click 'Convert to PDF' — a new tab opens with the extracted text and the browser's print dialog appears.",
          "Check that the text is readable, not garbled, before proceeding.",
          "In the print dialog, choose 'Save as PDF' to produce the file."
        ]}
        faqs={[
          { q: "Is MOBI to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Will this work for every MOBI file?", a: "Not reliably. This tool does basic byte decoding without a real MOBI/PalmDOC decompressor, so compressed ebook content can come out as garbled text. If the output looks like gibberish, this tool isn't a good fit for that file." },
          { q: "Will my files be uploaded to a server?", a: "No. Your file is read and processed entirely in your browser." },
          { q: "Can I convert multiple MOBI files at once?", a: "No, only one file at a time." }
        ]}
        tips={[
          "Always check the rendered tab before saving — if the text looks like random characters, the file's compression isn't supported by this simple tool.",
          "The output is plain text only, without the original book's images, fonts, or page layout.",
          "For a book with garbled output, consider converting it with a dedicated ebook tool first, then use this converter on the resulting file.",
          "Keep your original MOBI file, since this process can't be reversed."
        ]}
      />
    </div>
  );
}
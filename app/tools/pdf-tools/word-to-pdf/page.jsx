'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function WordToPdfPage() {
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
      const mammoth = (await import('mammoth/mammoth.browser')).default;
      const arrayBuffer = await file.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + file.name + '</title><style>body{font-family:Arial,sans-serif;margin:40px;line-height:1.6;color:#000;}h1,h2,h3{color:#000;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:8px;}</style></head><body>' + html + '</body></html>');
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
        <h1 className="text-3xl font-bold text-center mb-2">Word to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert .docx files to PDF in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a .docx file here'}</p>
            <input ref={inputRef} type="file" accept=".docx" className="hidden" onChange={handleFile} />
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
        title="Word to PDF"
        description="Word to PDF reads your .docx file using the Mammoth.js library and renders it as HTML in a new browser tab, entirely on your device — your file is never uploaded to a server. It doesn't generate a PDF file directly: instead, it opens your browser's print dialog, where you choose 'Save as PDF' to produce the actual file."
        howTo={[
          "Click the upload area and select a .docx file from your device.",
          "Click 'Convert to PDF' — a new tab renders your document and the browser's print dialog appears.",
          "In the print dialog, choose 'Save as PDF' (or your OS equivalent) as the destination.",
          "Save the resulting PDF file to your device."
        ]}
        faqs={[
          { q: "Is Word to PDF completely free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file formats does Word to PDF support?", a: "Only .docx files. The older binary .doc format isn't supported — save your document as .docx first if needed." },
          { q: "Will my documents be uploaded to a server?", a: "No. Your file is read and rendered entirely in your browser using the Mammoth.js library — it's never uploaded anywhere." },
          { q: "Do I need to install any software to use Word to PDF?", a: "No, it works directly in your web browser." }
        ]}
        tips={[
          "Basic formatting like headings, bold, italics, and tables carries over; very complex layouts or unusual styles may render differently than in Word.",
          "If your file is a legacy .doc, open it in Word and save a copy as .docx before uploading.",
          "In the print dialog, adjust margins and paper size before saving if you want a different page layout.",
          "Preview the rendered tab before saving to check that everything looks right."
        ]}
      />
    </div>
  );
}
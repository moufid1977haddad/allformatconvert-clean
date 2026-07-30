'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function Page() {
  const [file, setFile] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const redact = async () => {
    if (!file || !keyword.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      for (let i = 0; i < pages.length; i++) {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        const { height } = pages[i].getSize();
        for (const item of content.items) {
          if (item.str.toLowerCase().includes(keyword.toLowerCase())) {
            const [a, b, c, d, tx, ty] = item.transform;
            pages[i].drawRectangle({
              x: tx, y: ty,
              width: item.width || 50,
              height: item.height || 12,
              color: rgb(0, 0, 0),
            });
          }
        }
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Redaction failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Redact PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Censor sensitive text in your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Text to redact</label>
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Enter text to censor..." className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <button onClick={redact} disabled={!file || !keyword.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Redacting...' : 'Redact PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="redacted.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Redacted PDF</a>}
        </div>
      </div>
      <SeoContent
        title="PDF Redact"
        description="PDF Redact searches your PDF's text for a keyword using the PDF.js library and draws a black rectangle over each match using pdf-lib, entirely in your browser — your file is never uploaded to a server. Important: it only visually covers the matched text; the original text stays inside the PDF's content and can still be recovered by selecting or extracting it, so this is not secure redaction for genuinely sensitive information."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Type the exact word or phrase to redact into the text field.",
          "Click 'Redact PDF' — every occurrence of that text is covered with a black box.",
          "Click 'Download Redacted PDF' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Redact free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does this tool truly remove sensitive text from the PDF?", a: "No — it only draws a black rectangle on top of matching text. The original text stays inside the file and can still be extracted by copying it or using a text-extraction tool, so this method isn't secure for genuinely confidential information." },
          { q: "Can I visually select an area to redact, or preview matches first?", a: "No — there's no click-to-select or highlighting interface. You type a keyword, and every matching instance is covered automatically with no preview step." },
          { q: "Is my file uploaded to a server?", a: "No, matching and redaction both happen locally in your browser." }
        ]}
        tips={[
          "Because the underlying text isn't deleted, never rely on this tool alone to redact truly confidential data like ID numbers or passwords — the covered text is still extractable.",
          "Search terms are matched as a case-insensitive substring, so short or common keywords can over-match and cover text you didn't intend to hide.",
          "After downloading, try selecting text inside the black boxes in a PDF reader to see what's actually still there.",
          "For genuinely secure redaction, use dedicated redaction software that permanently strips the underlying text rather than drawing over it."
        ]}
      />
    </div>
  );
}
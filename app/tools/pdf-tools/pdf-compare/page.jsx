'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function Page() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const file1Ref = useRef();
  const file2Ref = useRef();

  const extractText = async (file) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  };

  const compare = async () => {
    if (!file1 || !file2) return;
    setLoading(true);
    setError('');
    try {
      const [t1, t2] = await Promise.all([extractText(file1), extractText(file2)]);
      setText1(t1);
      setText2(t2);
    } catch(e) { setError('Failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Compare PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two PDF documents side by side</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => file1Ref.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition">
              {file1 ? <p className="text-neutral-700 text-sm font-medium">{file1.name}</p> : <p className="text-neutral-400 text-sm">Click to upload PDF 1</p>}
            </div>
            <div onClick={() => file2Ref.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition">
              {file2 ? <p className="text-neutral-700 text-sm font-medium">{file2.name}</p> : <p className="text-neutral-400 text-sm">Click to upload PDF 2</p>}
            </div>
          </div>
          <input ref={file1Ref} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; setFile1(f); }} />
          <input ref={file2Ref} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; setFile2(f); }} />
          <button onClick={compare} disabled={!file1 || !file2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Comparing...' : 'Compare PDFs'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {text1 && text2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{file1.name}</p>
                <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-64 resize-none" value={text1} readOnly />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{file2.name}</p>
                <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-64 resize-none" value={text2} readOnly />
              </div>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Compare PDF"
        description="Compare PDF extracts the text content of two PDF files entirely in your browser using the PDF.js library, then displays both extractions side by side as plain text for you to read — it does not highlight differences, detect changes, or generate an automated comparison report."
        howTo={[
          "Click the left box and upload your first PDF file.",
          "Click the right box and upload your second PDF file.",
          "Click 'Compare PDFs' to extract the text from both files.",
          "Read the two text panels side by side to spot differences yourself."
        ]}
        faqs={[
          { q: "Is PDF Compare free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it highlight the differences between the two documents?", a: "No — it shows each PDF's extracted text side by side as plain text. It doesn't mark additions, deletions, or changes for you." },
          { q: "Are my files uploaded to a server?", a: "No, text extraction happens entirely in your browser using the PDF.js library." },
          { q: "Can it compare scanned PDFs?", a: "Not usefully — extraction only pulls text that's actually embedded in the file. Scanned or image-only pages have no text layer, so those panels will come out empty." }
        ]}
        tips={[
          "For a true line-by-line diff, copy each panel's text into a dedicated text-comparison tool.",
          "Works best on text-based PDFs; scanned documents without a text layer won't produce readable output.",
          "Only raw text is extracted — page layout, images, and formatting are not compared.",
          "For long documents, use your browser's find (Ctrl/Cmd+F) inside each panel to jump to a specific term."
        ]}
      />
    </div>
  );
}
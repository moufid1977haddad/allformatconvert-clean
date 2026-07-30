'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

const languages = ['English', 'French', 'Spanish', 'German', 'Arabic', 'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Russian'];

export default function Page() {
  const [file, setFile] = useState(null);
  const [targetLang, setTargetLang] = useState('French');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setOutput(''); };

  const translate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { getDocument } = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are a professional translator. Translate the following text to ${targetLang}. Return only the translation.`,
          prompt: text.slice(0, 3000),
        }),
      });
      const data = await response.json();
      if (data.text) setOutput(data.text);
      else setError(data.error || 'Translation failed');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Translate PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Translate PDF content to any language with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Target Language</label>
            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm">
              {languages.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <button onClick={translate} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Translating...' : 'Translate PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Translation (first 5 pages)</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy Translation</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Translate"
        description="PDF Translate extracts text from the first 5 pages of your PDF in your browser using PDF.js, then sends up to the first 3,000 characters of that text to our server, which forwards it to OpenAI's API for translation. The result is plain translated text, not a new PDF — there's no reconstructed document with the original formatting, images, or layout."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Choose a target language from the dropdown (10 languages available).",
          "Click 'Translate PDF' to send the extracted text for translation.",
          "Click 'Copy Translation' to copy the result — there's no PDF download."
        ]}
        faqs={[
          { q: "Is PDF Translate free to use?", a: "Yes, it's free with no signup required." },
          { q: "How many languages does it support?", a: "10: English, French, Spanish, German, Arabic, Chinese, Japanese, Portuguese, Italian, and Russian." },
          { q: "Will the formatting of my PDF be preserved?", a: "No — the output is plain translated text in a text box, not a formatted PDF. Images, layout, and structure aren't recreated." },
          { q: "How much of my PDF actually gets translated?", a: "Only the first 5 pages are extracted, and only the first 3,000 characters of that extracted text are sent for translation — longer documents get cut off." }
        ]}
        tips={[
          "For long documents, only about the first 3,000 characters of extracted text (from up to the first 5 pages) get translated — split up longer PDFs if you need the rest covered.",
          "Only the extracted text is sent to our server for translation, not the original PDF file — but scanned pages without a text layer won't produce any translatable text.",
          "Review important translations carefully, since automated translation can miss nuance, especially for legal or technical content.",
          "Copy the translation into a document editor if you want to format or save it as a file, since there's no direct download option here."
        ]}
      />
    </div>
  );
}
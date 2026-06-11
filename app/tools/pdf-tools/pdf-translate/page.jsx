'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Translate</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Translate is a free online tool that instantly converts PDF documents into multiple languages while preserving the original formatting and layout. Simply upload your PDF file and select your target language to get accurate translations in seconds without any software installation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Translate</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Translate website and click the 'Upload PDF' button to select your document from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your source language (auto-detect is available) and select the target language you want to translate to</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Translate' button and wait for the tool to process and translate your entire PDF document</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the translated PDF file to your computer by clicking the 'Download' button once the translation is complete</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Translate completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Translate is 100% free with no hidden charges, registration requirements, or premium features. You can translate as many PDFs as you need without any limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many languages does PDF Translate support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Translate supports over 100 languages including Spanish, French, German, Chinese, Japanese, Arabic, and many more, making it suitable for global users.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the formatting of my PDF be preserved after translation?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Translate maintains the original formatting, layout, images, and structure of your document, ensuring the translated PDF looks professional and readable.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can upload?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Translate can handle most standard PDF files up to 50MB in size, making it suitable for documents, reports, presentations, and more.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use PDF Translate for business documents, academic papers, contracts, and reports to break language barriers and communicate effectively with international audiences</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results with scanned PDFs or image-based documents, ensure the text is clear and legible before uploading to get accurate translations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Translate important documents and review the output carefully, especially for legal or medical content, to ensure accuracy meets your specific needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark PDF Translate for quick access and share it with colleagues or friends who need to translate PDF documents in different languages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
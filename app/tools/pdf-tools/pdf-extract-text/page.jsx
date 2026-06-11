'use client';
import { useState, useRef } from 'react';

export default function PdfExtractTextPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setText('');
    setStatus('');
  };

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    setText('');
    setStatus('Extracting...');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += 'Page ' + i + ':\n' + pageText + '\n\n';
      }
      setText(fullText);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  const download = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.pdf', '.txt');
    a.click();
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Extract Text from PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Extract all text content from your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={extract} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Extracting...' : 'Extract Text'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {text && (
            <div className="space-y-3">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={text} readOnly />
              <div className="flex gap-3">
                <button onClick={() => navigator.clipboard.writeText(text)} className="flex-1 bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Copy</button>
                <button onClick={download} className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download .txt</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

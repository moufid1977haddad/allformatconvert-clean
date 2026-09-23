'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';

export default function Page() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState('');
  const [coverage, setCoverage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setOutput(''); setCoverage(''); };

  const summarize = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setCoverage('');
    try {
      // Extract the document's real text (the tool used to send the raw file
      // bytes, base64-encoded, so the model summarized binary noise).
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      let text = '';
      let pagesRead = 0;
      for (let i = 1; i <= pdf.numPages && text.length < MAX_PROMPT_CHARS; i++) {
        const content = await (await pdf.getPage(i)).getTextContent();
        text += content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim() + '\n';
        pagesRead = i;
      }
      if (!text.trim()) {
        setError('No text was found in this PDF — it is probably a scanned image. Run it through PDF OCR first, then summarize the result.');
        setLoading(false);
        return;
      }
      const truncated = text.length > MAX_PROMPT_CHARS;
      const summaryPrompt = text.slice(0, MAX_PROMPT_CHARS);
      const lengthCheck = checkPromptLength(summaryPrompt);
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      setCoverage(truncated || pagesRead < pdf.numPages
        ? `This summary covers the first ${MAX_PROMPT_CHARS.toLocaleString()} characters of text (about ${pagesRead} of ${pdf.numPages} pages).`
        : `This summary covers the whole document (${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'}).`);
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: summaryPrompt,
          tool: 'pdf-ai-summary',
        }),
      });
      const data = await response.json();
      if (data.text) setOutput(data.text);
      else setError(data.error || 'Failed to summarize');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">AI PDF Summary</h1>
        <p className="text-neutral-500 text-center mb-8">Summarize PDF content with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <button onClick={summarize} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Summarizing...' : 'Summarize PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Summary</label>
              {coverage && <p className="text-xs text-neutral-500">{coverage}</p>}
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy Summary</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="AI PDF Summary"
        description="AI PDF Summary extracts the text of your PDF in your browser, then sends that text (up to 8,000 characters) to our server, which passes it to OpenAI's gpt-4o-mini model for a summary. The page tells you exactly how much of the document the summary covers."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Summarize PDF': the text is extracted and sent to the AI model.",
          "Wait a few seconds for the summary to appear below, with a note on how many pages it covers.",
          "Click 'Copy Summary' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is AI PDF Summary free to use?", a: "Yes, it's free with no signup required." },
          { q: "Does it read my entire PDF?", a: "It reads the document's text up to 8,000 characters — the whole file for short documents, the first few pages for longer ones. The page says which, after each summary." },
          { q: "Is my file uploaded to a server?", a: "The PDF itself stays in your browser. Only the extracted text is sent to our server and forwarded to OpenAI's API to generate the summary." },
          { q: "Does it work on scanned PDFs?", a: "No. A scanned PDF contains images, not text; the page says so instead of summarizing nothing. Run it through PDF OCR first." }
        ]}
        tips={[
          "For a long document, split it with PDF Split and summarize each part.",
          "Scanned documents need PDF OCR first.",
          "Treat the summary as a starting point and verify it against the original document.",
          "Copy the summary right away — it isn't saved anywhere after you leave the page."
        ]}
      />
    </div>
  );
}
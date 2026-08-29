'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';

export default function Page() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setOutput(''); };

  const summarize = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Only the first 5000 base64 chars are ever used below, so only encode
      // enough of the file's start to cover that — encoding the whole buffer
      // via String.fromCharCode(...bytes) blows the call-stack argument limit
      // for any realistically-sized PDF (crashes above ~100KB).
      const prefixBytes = new Uint8Array(arrayBuffer).slice(0, 4000);
      const base64 = btoa(String.fromCharCode(...prefixBytes));
      const summaryPrompt = 'Please summarize this PDF document: ' + base64.slice(0, 5000);
      const lengthCheck = checkPromptLength(summaryPrompt);
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a document summarizer. Provide a clear and concise summary of the PDF document content.',
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
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy Summary</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="AI PDF Summary"
        description="AI PDF Summary sends your file to our server, which passes it to OpenAI's gpt-4o-mini model for a text summary. Rather than extracting the PDF's actual text first, it base64-encodes the raw file and forwards only the first 5,000 characters of that encoding — for anything but short, simple PDFs, the model is working from a small slice of raw binary data rather than the document's full content."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Click 'Summarize PDF' to send it to the AI model.",
          "Wait a few seconds for the summary to appear below.",
          "Click 'Copy Summary' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is AI PDF Summary free to use?", a: "Yes, it's free with no signup required." },
          { q: "Does it read my entire PDF?", a: "No — only roughly the first 5,000 characters of the file's base64-encoded bytes are sent to the AI, so anything beyond the very start of the file isn't seen by the model." },
          { q: "Is my file uploaded to a server?", a: "Yes. Unlike most tools on this site, your file is sent to our server and forwarded to OpenAI's API to generate the summary." },
          { q: "Why does the summary sometimes look unrelated to my document?", a: "The tool sends raw file bytes rather than properly extracted text, so the model can end up summarizing binary noise instead of your document's actual content, especially for longer or image-heavy PDFs." }
        ]}
        tips={[
          "This tool works best on short, simple, text-based PDFs, since only the beginning of the raw file reaches the AI.",
          "For longer documents, use PDF Extract Text first, then paste that extracted text into a general-purpose AI summarizer for a more reliable result.",
          "Treat the summary as a rough starting point and verify it against the original document.",
          "Copy the summary right away — it isn't saved anywhere after you leave the page."
        ]}
      />
    </div>
  );
}
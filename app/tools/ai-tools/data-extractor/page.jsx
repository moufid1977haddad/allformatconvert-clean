'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';

export default function DataExtractorPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const process = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput('');
    setError('');
    try {
      const lengthCheck = checkPromptLength(input);
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a data extraction expert. Extract structured data from the provided text. Format the extracted data in a clear, organized way (JSON or table format when appropriate).',
          prompt: input,
          tool: 'data-extractor',
        }),
      });
      const data = await response.json();
      if (data.text) setOutput(data.text);
      else setError(data.error || 'No response received');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Data Extractor</h1>
        <p className="text-neutral-500 text-center mb-8">Extract data from text with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to extract data from..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Extract Data'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Data Extractor"
        description="Data Extractor is a free online tool that uses OpenAI's GPT-4o mini model to pull structured information out of pasted text. Paste in text containing names, dates, prices, or other details, and the AI returns the extracted data organized as JSON or a table, ready to copy into your own spreadsheet or document."
        howTo={[
          "Paste your source text into the input field.",
          "Click the 'Extract Data' button to send it to the AI.",
          "Wait a moment while the AI identifies and organizes the relevant data.",
          "Copy the structured result and paste it into your spreadsheet or document."
        ]}
        faqs={[
          { q: "Is Data Extractor really free to use?", a: "Yes, Data Extractor is free to use with no signup or subscription required." },
          { q: "What input does Data Extractor accept?", a: "You paste plain text directly into the tool. There is no file upload — if your source is a PDF or webpage, copy the text from it first and paste it in." },
          { q: "What format is the extracted data in?", a: "The AI returns the extracted data as readable text formatted as JSON or a table, which you can copy. There is no direct file download to CSV or Excel." },
          { q: "Can Data Extractor read scanned documents or images?", a: "No, this tool only processes text you paste in — it doesn't perform OCR on images or scanned documents." }
        ]}
        tips={[
          "Use clear, well-formatted source text for more accurate extraction results.",
          "Mention what kind of data you want extracted at the start of your pasted text to guide the AI.",
          "Test with a small sample first to see how the output is structured before processing a larger document.",
          "Copy the result into a spreadsheet app if you want to convert it into a CSV or table yourself."
        ]}
      />
    </div>
  );
}
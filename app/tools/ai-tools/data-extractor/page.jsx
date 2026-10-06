'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function DataExtractorPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');

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
          prompt: input,
          tool: 'data-extractor',
        }),
      });
      const data = await readAiJson(response);
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
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to extract data from..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Extract Data'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <TextDownload text={output} name="extracted-data.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Data Extractor"
        description={`Data Extractor reads text you paste — an email, an invoice copied from a PDF, a product list — and returns the structured information in it, laid out as JSON or as a table when that suits the data. Extraction is done by OpenAI's GPT-4o mini model; your text travels through our server to reach it. The result is plain text that you copy or download as extracted-data.txt; there is no CSV or Excel output, no file picker and no OCR of scanned pages. Each request takes up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters, and the answer is limited to 1,000 tokens.`}
        howToTitle="How to extract data from text"
        howTo={[
          "Paste the source text into the \"Paste text to extract data from...\" box.",
          "Optionally start the text with a line naming the fields you want, such as names and amounts.",
          "Click \"Extract Data\".",
          "Copy the JSON or table under \"Result\", or click \"Download\" to get extracted-data.txt."
        ]}
        specs={[
          { label: "Input", value: `An email, invoice or list pasted as text, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters` },
          { label: "Output", value: "JSON or a text table, as plain text; download as extracted-data.txt" },
          { label: "Not supported", value: "Files, images and scanned documents (no OCR)" },
          { label: "Usage limits", value: "Per-connection limits by the hour and by the day, in one allowance with the site's other paid tools, and a monthly spending cap for the site" }
        ]}
        privacyTitle="Where your text is processed"
        privacy="Your pasted text is sent to our server and on to OpenAI's GPT-4o mini, which picks out the data and sends it back. We keep neither the text nor the extracted data. Remove anything you would not share with an outside AI provider, such as card numbers, before you paste."
        faqs={[
          { q: "Can I get the result as a CSV or Excel file?", a: "No. The result is plain text, usually JSON or a table, that you copy or download as a .txt file. For a spreadsheet, convert the JSON with JSON to CSV, or paste the table into your spreadsheet app." },
          { q: "Can it read a PDF or a scanned image?", a: "No. There is no file picker, only a text box. For a PDF with selectable text, copy its text first or use PDF Extract Text; for a scanned PDF, run PDF OCR first, then paste the recognized text here." },
          { q: "Can I choose which fields are extracted?", a: "Yes. Write them on the first line of your text, for example a line that starts with Extract: followed by customer name, invoice date and total. That line reaches the model with the rest of the text; without it, the model picks the fields it finds." },
          { q: "How much text can I paste?", a: `${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters of source text; the page measures it and refuses a longer paste with a message. The answer is limited to 1,000 tokens, so a very long list may come back incomplete; extract it in parts.` }
        ]}
        tips={[
          "Check every number in the result against the source text: a language model can misread or skip a value."
        ]}
      />
    </div>
  );
}
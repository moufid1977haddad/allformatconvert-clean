'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function TextSummarizerPage() {
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
          tool: 'text-summarizer',
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
        <h1 className="text-3xl font-bold text-center mb-2">Text Summarizer</h1>
        <p className="text-neutral-500 text-center mb-8">Summarize long texts with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to summarize..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Summarizing...' : 'Summarize'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <TextDownload text={output} name="summary.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text Summarizer"
        description={`Text Summarizer condenses a passage you paste, such as an article, meeting notes or a chapter, into a short summary of its key points and main ideas. The summary is written by OpenAI's GPT-4o mini model; your text is sent through our server to reach it. Each request takes up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters, and longer text is refused rather than cut. There is no length or bullet-point setting, and this page does not open files: for a PDF, use AI PDF Summary, which reads the document for you. Copy the summary or download it as summary.txt.`}
        howToTitle="How to summarize a text"
        howTo={[
          "Paste the text into the \"Paste text to summarize...\" box.",
          "Click \"Summarize\"; it shows \"Summarizing...\" while the model works.",
          "Read the summary under \"Result\".",
          "Click \"Copy\", or \"Download\" to save summary.txt."
        ]}
        specs={[
          { label: "Input", value: `Notes, an article or a chapter, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters` },
          { label: "Output", value: "A concise summary in plain text, up to 1,000 tokens" },
          { label: "Settings", value: "None: no length or format choice" },
          { label: "Usage limits", value: "Each connection has an hourly and a daily number of requests, shared with the site's other paid tools; the site also has a monthly budget" }
        ]}
        privacyTitle="Where your text is summarized"
        privacy="Summarizing happens at OpenAI, not in your browser: the text is sent to our server, which forwards it to GPT-4o mini and returns the summary. A text over the length limit is refused before sending, with a message on the page, never cut. Only the summary comes back, and we store neither it nor your text."
        faqs={[
          { q: "What is the longest text I can summarize?", a: `${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters; over that, the page shows the length of your text and sends nothing. For a longer document, summarize it section by section, then summarize the section summaries together.` },
          { q: "Can I summarize a PDF?", a: "No, not on this page, which takes pasted text only. AI PDF Summary extracts the text of a PDF in your browser and then sends that text to our server for a summary; you can also copy the text out of the PDF and paste it here." },
          { q: "Can I choose the length of the summary?", a: "No. There is no setting for length or bullet points; the model is asked for a concise summary that keeps the key points. For a shorter result, paste the summary back in and summarize it again." }
        ]}
        tips={[
          "Remove references, footnotes and navigation text before pasting, so the summary covers the content itself."
        ]}
      />
    </div>
  );
}
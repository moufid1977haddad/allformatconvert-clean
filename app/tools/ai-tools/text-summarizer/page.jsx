'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';

export default function TextSummarizerPage() {
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
          system: 'You are a text summarizer. Create a concise summary of the provided text. Keep the key points and main ideas. Return only the summary.',
          prompt: input,
          tool: 'text-summarizer',
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
        <h1 className="text-3xl font-bold text-center mb-2">Text Summarizer</h1>
        <p className="text-neutral-500 text-center mb-8">Summarize long texts with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to summarize..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Summarizing...' : 'Summarize'}
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
        title="Text Summarizer"
        description="Text Summarizer is a free online tool that uses OpenAI's GPT-4o mini model to condense long documents, articles, and passages into a concise summary while preserving the key points. Paste your text and get back a shorter version in seconds — useful for students, professionals, and researchers who need to quickly grasp lengthy content."
        howTo={[
          "Paste or type your text into the input field.",
          "Click the 'Summarize' button to send it to the AI.",
          "Wait a moment while the AI generates your summary.",
          "Copy the summary to your clipboard for later use."
        ]}
        faqs={[
          { q: "Is Text Summarizer really free to use?", a: "Yes, Text Summarizer is free to use with no signup or subscription required." },
          { q: "How long can the text I input be?", a: "There's no fixed word limit, but very long input may be truncated by the underlying AI model's limits. For very long documents, consider breaking them into smaller sections and summarizing each part separately." },
          { q: "What languages does Text Summarizer support?", a: "It works best with English content, though the underlying AI model can generally handle other languages with varying accuracy." },
          { q: "Will my text be saved or shared?", a: "Your text is sent to OpenAI's API to generate the summary. It is not stored on our servers or shared for any purpose beyond producing your result." }
        ]}
        tips={[
          "For academic papers, use the tool to create quick reference summaries of methodology and conclusions.",
          "Summarize section by section for very long documents to keep each summary focused.",
          "Run the same text through the tool again if you want to compare a different phrasing of the summary.",
          "Use Text Summarizer alongside your reading to double-check you've caught the key points of an article or report."
        ]}
      />
    </div>
  );
}
'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';

export default function AIDetectorPage() {
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
      if (!lengthCheck.ok) { setError(lengthCheck.message); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are an AI text detector. Analyze the provided text and determine if it was likely written by an AI or a human. Provide a percentage likelihood and explain your reasoning.',
          prompt: input,
          tool: 'ai-detector',
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
        <h1 className="text-3xl font-bold text-center mb-2">AI Detector</h1>
        <p className="text-neutral-500 text-center mb-8">Detect if text was written by AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to analyze..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Detect AI Content'}
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
        title="AI Detector"
        description="AI Detector is a free online tool that asks an AI language model (OpenAI's GPT-4o mini) to judge whether a piece of text was likely written by AI or a human, based on writing patterns like phrasing, repetition, and structure. It returns an estimated likelihood along with the model's reasoning. Because it relies on an LLM's judgment rather than a dedicated, trained classifier, it should be treated as a helpful signal rather than a definitive verdict."
        howTo={[
          "Paste the text you want to analyze into the text box.",
          "Click the 'Detect AI Content' button to send it for analysis.",
          "Wait a moment while the AI reviews the text.",
          "Read the result, which includes an estimated likelihood and the reasoning behind it."
        ]}
        faqs={[
          { q: "Is AI Detector completely free to use?", a: "Yes, AI Detector is free to use with no signup or subscription required." },
          { q: "How accurate is the detection?", a: "Accuracy varies with text length and style, and no AI detector — including this one — is 100% reliable. Treat the result as an estimate rather than proof of authorship." },
          { q: "Can it tell me exactly which AI model wrote the text?", a: "No. It can only estimate the overall likelihood that text was AI-generated; it cannot reliably attribute text to a specific model like ChatGPT or Gemini." },
          { q: "Is my submitted text stored or shared?", a: "Your text is sent to OpenAI's API to generate the analysis. It is not stored on our servers or used for any other purpose." }
        ]}
        tips={[
          "For more reliable results, paste larger text samples of at least 100 words.",
          "Formal or technical writing tends to produce clearer results than very short or casual text.",
          "Treat the output as a helpful indicator, not definitive proof — human review is still recommended for high-stakes decisions.",
          "Try analyzing a piece of text you know is human-written to get a feel for how the tool responds."
        ]}
      />
    </div>
  );
}
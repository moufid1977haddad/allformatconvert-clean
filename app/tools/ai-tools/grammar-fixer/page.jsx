'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function GrammarFixerPage() {
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
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a grammar expert. Fix all grammar, spelling, and punctuation errors in the text. Return only the corrected text without explanations.',
          prompt: input,
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
        <h1 className="text-3xl font-bold text-center mb-2">Grammar Fixer</h1>
        <p className="text-neutral-500 text-center mb-8">Fix grammar and spelling errors with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to fix grammar..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Fix Grammar'}
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
        title="Grammar Fixer"
        description="Grammar Fixer is a free online tool that uses OpenAI's GPT-4o mini model to correct spelling, punctuation, and grammatical errors in your writing. Paste your text and get back a fully corrected version — ideal for polishing emails, essays, or social media posts before you publish them."
        howTo={[
          "Paste or type your text directly into the input field.",
          "Click the 'Fix Grammar' button to send it to the AI.",
          "Wait a moment while the AI corrects the text.",
          "Review the corrected text and copy it for your own use."
        ]}
        faqs={[
          { q: "Is Grammar Fixer really free to use?", a: "Yes, Grammar Fixer is free to use with no signup or subscription required." },
          { q: "What types of errors does Grammar Fixer detect?", a: "It can catch spelling mistakes, punctuation errors, subject-verb agreement issues, and other common grammatical mistakes as part of rewriting your text." },
          { q: "Is my text private when using Grammar Fixer?", a: "Your text is sent to OpenAI's API to generate the correction. It is not stored on our servers or shared for any purpose beyond producing your result." },
          { q: "Can Grammar Fixer handle multiple languages?", a: "It works primarily with English text; results for other languages may be less reliable." }
        ]}
        tips={[
          "For best results, paste complete sentences or paragraphs rather than single words, so the AI has context.",
          "Review the corrected text before using it, since AI-generated edits can occasionally change meaning.",
          "Use Grammar Fixer before submitting important documents like resumes, cover letters, or professional emails.",
          "Combine Grammar Fixer with your own proofreading to catch style issues the AI might miss."
        ]}
      />
    </div>
  );
}
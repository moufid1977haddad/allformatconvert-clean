'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';

export default function AIParaphraserPage() {
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
          system: 'You are a paraphrasing expert. Rewrite the provided text using different words and sentence structures while preserving the original meaning. Return only the paraphrased text.',
          prompt: input,
          tool: 'ai-paraphraser',
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
        <h1 className="text-3xl font-bold text-center mb-2">AI Paraphraser</h1>
        <p className="text-neutral-500 text-center mb-8">Paraphrase text with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to paraphrase..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Paraphrase'}
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
        title="AI Paraphraser"
        description="AI Paraphraser is a free online tool that uses OpenAI's GPT-4o mini model to rewrite your text with different words and sentence structures while preserving its original meaning. Paste your text, and the AI returns a single rewritten version — useful for varying phrasing in essays, articles, or messages."
        howTo={[
          "Paste or type the text you want to paraphrase into the input field.",
          "Click the 'Paraphrase' button to send it to the AI.",
          "Wait a moment while the AI rewrites your text.",
          "Copy the paraphrased result and use it in your document or project."
        ]}
        faqs={[
          { q: "Is AI Paraphraser really free to use?", a: "Yes, AI Paraphraser is free to use with no signup or subscription required." },
          { q: "Can I paraphrase long documents?", a: "The tool works best on paragraphs and shorter passages. Very long text may be truncated by the underlying AI model's response limit, so it's best to paraphrase one section at a time." },
          { q: "Will the paraphrased content be plagiarism-free?", a: "The AI generates a genuinely reworded version of your input, but no tool can guarantee a result is undetectable by plagiarism checkers — always review the output before using it." },
          { q: "Do I need to create an account to use this tool?", a: "No account is necessary; you can use AI Paraphraser immediately without registration." }
        ]}
        tips={[
          "For best results, paraphrase one paragraph at a time rather than submitting entire essays at once.",
          "Run the same text through the tool again if you want an alternative version to compare against.",
          "Always review the paraphrased content to make sure it still conveys your original meaning.",
          "Combine AI Paraphraser with your own manual editing for a more polished, personal result."
        ]}
      />
    </div>
  );
}
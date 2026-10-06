'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function AIParaphraserPage() {
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
          tool: 'ai-paraphraser',
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
        <h1 className="text-3xl font-bold text-center mb-2">AI Paraphraser</h1>
        <p className="text-neutral-500 text-center mb-8">Paraphrase text with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to paraphrase..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Paraphrase'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <TextDownload text={output} name="paraphrased.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="AI Paraphraser"
        description={`AI Paraphraser rewrites a passage with different words and sentence structures while keeping its meaning, using OpenAI's GPT-4o mini model. Paste up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters, click once and you get one new version in plain text, ready to copy or save as paraphrased.txt. Your text is sent through our server to OpenAI to be reworded. There is no tone or strength setting: each click asks for a fresh rewrite, so clicking again gives another version to compare. The tool does not check plagiarism and cannot promise that a rewrite will pass a plagiarism or AI checker.`}
        howToTitle="How to paraphrase text with AI"
        howTo={[
          "Paste the passage into the \"Paste text to paraphrase...\" box.",
          "Click \"Paraphrase\" and wait while the button shows \"Processing...\".",
          "Read the new version under \"Result\"; click \"Paraphrase\" again for a different wording.",
          "Click \"Copy\", or \"Download\" to save it as paraphrased.txt."
        ]}
        specs={[
          { label: "Input", value: `A passage of up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters to reword` },
          { label: "Output", value: "One reworded version, as plain text you can copy or download" },
          { label: "Result length", value: "At most 1,000 tokens, so a very long passage can come back cut short" },
          { label: "Usage limits", value: "Hourly and daily requests per connection, counted together with the site's other paid tools, plus a monthly budget for the site" }
        ]}
        privacyTitle="Where your text is processed"
        privacy="The text you paste goes to our server, which adds the rewording instruction and sends both to OpenAI's GPT-4o mini model; only the reworded text comes back to the page. We keep neither your passage nor its new version. What OpenAI does with the requests it receives is set by its own API terms."
        faqs={[
          { q: "How much text can I reword at once?", a: `${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters, checked before anything leaves the page; a longer passage gets a message giving its length. The reworded version is limited to 1,000 tokens, so paraphrase a long document one section at a time.` },
          { q: "Will the meaning stay the same?", a: "Yes, that is the instruction the model receives: new words and sentence structures, same meaning. A model can still shift a nuance or swap a technical term, so compare the result with your original before you use it anywhere." },
          { q: "Will a paraphrased text pass a plagiarism checker?", a: "No tool can promise that. The model produces new wording, but the ideas, facts and quotes still come from you or your source. Cite your sources, and do not use rewording to hide copied work." },
          { q: "Can I choose a tone or a style?", a: "No. This page has no tone, length or strength setting. For an email in a chosen tone, use Email Generator; for corrections that keep your own wording, use Grammar Fixer instead." }
        ]}
        tips={[
          "If you only want mistakes corrected, use Grammar Fixer: it edits only the errors and shows every change it made."
        ]}
      />
    </div>
  );
}
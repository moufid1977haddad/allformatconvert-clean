'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function AIWriterPage() {
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
          tool: 'ai-writer',
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
        <h1 className="text-3xl font-bold text-center mb-2">AI Writer</h1>
        <p className="text-neutral-500 text-center mb-8">Generate text content with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Describe what you want to write..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Generate Content'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <TextDownload text={output} name="text.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="AI Writer"
        description={`AI Writer turns a short description into a first draft: a blog introduction, a product description, a social post or a short story. Your description, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters, is sent through our server to OpenAI's GPT-4o mini model, which is told to write engaging, detailed content. The draft is limited to 1,000 tokens, so it suits pieces of a few paragraphs, not long reports. There is no tone, length or format setting: put those wishes in your description. The draft appears in a read-only box, to copy or download as text.txt and edit elsewhere.`}
        howToTitle="How to write a draft with AI"
        howTo={[
          "Describe the piece in the \"Describe what you want to write...\" box: topic, readers, length and tone.",
          "Click \"Generate Content\" and wait while it shows \"Processing...\".",
          "Read the draft under \"Result\"; adjust your description and click \"Generate Content\" again for a new version.",
          "Click \"Copy\" or \"Download\" (text.txt) to keep it."
        ]}
        specs={[
          { label: "Input", value: `A description of up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters` },
          { label: "Output", value: "One draft in plain text, up to 1,000 tokens, shown read-only" },
          { label: "Settings", value: "None on the page; ask for tone, length and format in your description" },
          { label: "Usage limits", value: "An hourly and daily allowance per connection, shared with the site's other paid tools, and a monthly cap on the site's spending" }
        ]}
        privacyTitle="Where your text is processed"
        privacy="What you type is sent to our server and forwarded, with the writing instruction, to OpenAI's GPT-4o mini, which returns the draft. Neither your description nor the draft is saved by us. What OpenAI does with requests it receives is set by its API terms."
        faqs={[
          { q: "How long can the generated text be?", a: "1,000 tokens at most per request, which is a few paragraphs. A request for a long article will be cut short, so ask for one section at a time: the introduction first, then each part of your outline." },
          { q: "Can I set the tone or the length?", a: "No, not with a setting: the page has only the description box. Write the tone, the readers, the length and any keywords into the description, and the model receives them as part of your request." },
          { q: "Is the draft ready to publish?", a: "No. The model writes new text from your description but can repeat common phrasings or state facts that are wrong. Check facts, names and quotes, and add what you know about the subject before you publish it." }
        ]}
        tips={[
          "Paste your outline into the description and ask for one section per request to stay within the length limit.",
          "For an email, Email Generator adds the subject line, greeting and closing for you."
        ]}
      />
    </div>
  );
}
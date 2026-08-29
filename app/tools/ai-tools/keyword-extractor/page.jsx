'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';

export default function KeywordExtractorPage() {
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
          system: 'You are a keyword extraction expert. Extract the most important keywords and key phrases from the provided text. Return them as a numbered list with brief explanations of why each is important.',
          prompt: input,
          tool: 'keyword-extractor',
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
        <h1 className="text-3xl font-bold text-center mb-2">Keyword Extractor</h1>
        <p className="text-neutral-500 text-center mb-8">Extract keywords from text with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to extract keywords..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Extract Keywords'}
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
        title="Keyword Extractor"
        description="Keyword Extractor is a free online tool that uses OpenAI's GPT-4o mini model to identify the most important keywords and key phrases in a piece of text, along with a brief explanation of why each one matters. Paste in an article or piece of content and get a numbered list of keywords back — useful for SEO research and content planning."
        howTo={[
          "Paste your text, article, or webpage content into the input field.",
          "Click the 'Extract Keywords' button to send it to the AI.",
          "Wait a moment while the AI identifies relevant keywords.",
          "Copy the numbered list of keywords to use in your SEO strategy or content planning."
        ]}
        faqs={[
          { q: "Is Keyword Extractor really free to use?", a: "Yes, Keyword Extractor is free to use with no signup or subscription required." },
          { q: "How does the keyword extraction work?", a: "It sends your text to an AI language model, which analyzes the content and returns a numbered list of what it judges to be the most important keywords and phrases, with a short explanation for each." },
          { q: "Can I extract keywords from PDFs or only text?", a: "Keyword Extractor only accepts pasted plain text — there's no file upload. You can copy text from a PDF or Word document and paste it into the tool." },
          { q: "How many keywords will be extracted from my content?", a: "The number varies based on content length and what the AI judges to be relevant; there's no fixed count." }
        ]}
        tips={[
          "Use the extracted keywords to inform your meta descriptions, title tags, and header tags.",
          "Look for long-tail phrases in the results, as they often have less competition.",
          "Compare keyword lists from multiple articles in your niche to spot content gaps.",
          "Run competitor content through the tool to see what topics and phrasing they emphasize."
        ]}
      />
    </div>
  );
}
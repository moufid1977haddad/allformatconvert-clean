'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function KeywordExtractorPage() {
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
          tool: 'keyword-extractor',
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
        <h1 className="text-3xl font-bold text-center mb-2">Keyword Extractor</h1>
        <p className="text-neutral-500 text-center mb-8">Extract keywords from text with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to extract keywords..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Extract Keywords'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <TextDownload text={output} name="keywords.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Keyword Extractor"
        description={`Keyword Extractor reads a text you paste, such as an article, a product page or a transcript, and returns a numbered list of its most important keywords and key phrases, each with a short note on why it matters. The list is written by OpenAI's GPT-4o mini; your text goes through our server to reach it. It shows what the text is about, not search data: there are no search volumes, rankings or competition scores. For exact word frequencies that never go through our server, use the keyword density in Word Counter. Up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters per request.`}
        howToTitle="How to extract keywords from a text"
        howTo={[
          "Paste the text into the \"Paste text to extract keywords...\" box.",
          "Click \"Extract Keywords\".",
          "Read the numbered list under \"Result\", with a reason for each keyword.",
          "Click \"Copy\" or \"Download\" (keywords.txt) to keep the list."
        ]}
        specs={[
          { label: "Input", value: `An article, page or transcript, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters` },
          { label: "Output", value: "A numbered list of keywords and key phrases with brief explanations, as plain text" },
          { label: "Number of keywords", value: "Not fixed; the model decides from the text" },
          { label: "Usage limits", value: "A connection can make a limited number of requests per hour and per day, together with the site's other paid tools, within the site's monthly budget" }
        ]}
        privacyTitle="Where your text is processed"
        privacy="The text is sent to our server, then to OpenAI's GPT-4o mini, which returns the keyword list. We store neither the text nor the list. To keep a text off our server, use Word Counter's keyword density instead, which is computed in the browser."
        faqs={[
          { q: "Does it show search volume or keyword difficulty?", a: "No. The keywords come from your text only, chosen by a language model for their weight in it. Check volume and competition in a search-data tool before you plan content around a keyword." },
          { q: "Is the number of keywords fixed?", a: "No. The model decides from the length and content of the text, and each keyword comes with a brief reason. Each click is a new request, so asking again can give a different selection." },
          { q: "Is this the same as keyword density?", a: "No. Keyword density, in Word Counter, counts exactly how often each word appears, without sending the text to our server. This tool asks an AI model which words and phrases matter most, so it can list an important phrase that appears only once." },
          { q: "How much text can I analyze?", a: `${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters of article text per request. A longer paste is stopped on the page; analyze a long article section by section, or paste its main body only.` }
        ]}
        tips={[
          "Paste the article body without menus, footers or comments, which would add words that are not about your topic."
        ]}
      />
    </div>
  );
}
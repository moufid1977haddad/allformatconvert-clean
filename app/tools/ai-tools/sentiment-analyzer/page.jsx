'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function SentimentAnalyzerPage() {
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
          tool: 'sentiment-analyzer',
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
        <h1 className="text-3xl font-bold text-center mb-2">Sentiment Analyzer</h1>
        <p className="text-neutral-500 text-center mb-8">Analyze text sentiment with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to analyze sentiment..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Analyze Sentiment'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <TextDownload text={output} name="sentiment.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Sentiment Analyzer"
        description={`Sentiment Analyzer reads a piece of text, such as a customer review, a comment or a support message, and says whether its overall tone is Positive, Negative or Neutral. The answer, written by OpenAI's GPT-4o mini, also gives a confidence percentage and the phrases that point to that sentiment. The percentage is the model's own estimate, not a measured accuracy. Your text goes through our server to OpenAI. One text per request, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters; there is no batch mode and no spreadsheet import.`}
        howToTitle="How to analyze the sentiment of a text"
        howTo={[
          "Paste one review or message into the \"Paste text to analyze sentiment...\" box.",
          "Click \"Analyze Sentiment\".",
          "Read the verdict, the confidence percentage and the explanation under \"Result\".",
          "Click \"Copy\" or \"Download\" (sentiment.txt) to keep the analysis."
        ]}
        specs={[
          { label: "Input", value: `One review or message, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters` },
          { label: "Output", value: "Positive, Negative or Neutral, a confidence percentage and the key indicators, in plain text" },
          { label: "Batch", value: "No; one text per request" },
          { label: "Usage limits", value: "Hourly and daily request limits per connection, shared with the site's other paid tools, and a monthly site budget" }
        ]}
        privacyTitle="Where your text is processed"
        privacy="Your text goes to our server and from there to OpenAI's GPT-4o mini, which returns the analysis. Each review is a separate request, and nothing from one analysis is kept for the next: we store neither the text nor the result. When you analyze customer messages, remove names and contact details first."
        faqs={[
          { q: "Is the confidence percentage a measured accuracy?", a: "No. It is the model's own estimate of how sure it is, written into its answer. The tool does not compute it, so two runs on the same text can give different figures." },
          { q: "Can I analyze many reviews at once?", a: "No. The page sends one text per request. If you paste several reviews together, you get one overall verdict for all of them; paste them one at a time to classify each review." },
          { q: "Does it understand sarcasm?", a: "No, not reliably. Irony, sarcasm and mixed reviews, such as praise for a product with complaints about delivery, can be misread. Read the explanation in the result to see which words led to the verdict." },
          { q: "Which languages can I analyze?", a: "Any language you paste: the page neither sets nor blocks one, and the text goes to the model as it is. The site has not measured accuracy by language, so read results in languages other than English with extra care." }
        ]}
        tips={[
          "Split a review that praises one thing and criticizes another into two parts to see each sentiment separately."
        ]}
      />
    </div>
  );
}
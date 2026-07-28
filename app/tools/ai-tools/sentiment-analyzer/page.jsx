'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function SentimentAnalyzerPage() {
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
          system: 'You are a sentiment analysis expert. Analyze the sentiment of the provided text. Determine if it is Positive, Negative, or Neutral, provide a confidence percentage, and explain the key sentiment indicators.',
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
        <h1 className="text-3xl font-bold text-center mb-2">Sentiment Analyzer</h1>
        <p className="text-neutral-500 text-center mb-8">Analyze text sentiment with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to analyze sentiment..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Analyze Sentiment'}
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
        title="Sentiment Analyzer"
        description="Sentiment Analyzer is a free online tool that uses OpenAI's GPT-4o mini model to judge whether a piece of text is Positive, Negative, or Neutral, along with a confidence estimate and an explanation of the key sentiment indicators it found. It's useful for businesses, researchers, and content creators reviewing customer feedback, reviews, or social posts."
        howTo={[
          "Paste or type the text you want to analyze into the text area.",
          "Click the 'Analyze Sentiment' button to send it to the AI.",
          "Wait a moment while the AI processes your text.",
          "Read the result, which includes the sentiment classification, a confidence estimate, and the reasoning behind it."
        ]}
        faqs={[
          { q: "Is Sentiment Analyzer really free to use?", a: "Yes, Sentiment Analyzer is free to use with no signup or subscription required." },
          { q: "What languages does Sentiment Analyzer support?", a: "It works best with English, but the underlying AI model can generally handle many other languages as well, with results that may vary in accuracy." },
          { q: "How accurate is the sentiment analysis?", a: "There's no fixed accuracy figure — results depend on the AI model's interpretation of context, and it can misjudge sarcasm or ambiguous phrasing like any sentiment analysis tool." },
          { q: "Can I analyze multiple texts at once?", a: "No, the tool processes one text submission at a time — there's no bulk or batch processing option." }
        ]}
        tips={[
          "For more accurate results, provide complete sentences rather than single words or fragments.",
          "The tool works best with clear, straightforward language; heavily sarcastic or ironic text may be misclassified.",
          "Read the AI's explanation alongside the classification to understand which words influenced the result.",
          "Analyze feedback one piece at a time and keep your own log if you want to track sentiment trends over time."
        ]}
      />
    </div>
  );
}
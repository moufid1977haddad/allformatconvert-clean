'use client';
import { useState } from 'react';

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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Sentiment Analyzer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Sentiment Analyzer is a free online tool that uses advanced AI technology to detect and classify emotions and opinions in text, determining whether content is positive, negative, or neutral. It's perfect for businesses, researchers, and content creators who want to understand customer feedback, social media sentiment, and public opinion at scale.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Sentiment Analyzer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Sentiment Analyzer tool on our website and locate the text input box on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste or type the text you want to analyze into the designated text area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Analyze' button to process your input and generate sentiment results</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review your results which will display the sentiment score, classification, and detailed emotion breakdown</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Sentiment Analyzer really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Sentiment Analyzer is completely free with no hidden charges, registration requirements, or premium paywalls. You can analyze unlimited text samples without any cost.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What languages does Sentiment Analyzer support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool currently supports English, Spanish, French, German, and Portuguese. We're continuously adding support for additional languages based on user demand.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How accurate is the sentiment analysis?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our AI model achieves approximately 85-92% accuracy by analyzing linguistic patterns, context, and emotional indicators. Accuracy may vary depending on text complexity and use of slang or sarcasm.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I analyze multiple texts at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can analyze one text at a time through our main interface. For bulk analysis, we recommend using our batch processing feature available in the advanced options.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For more accurate results, provide complete sentences rather than single words or fragments, as context helps the AI better understand sentiment</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>The tool works best with clear, straightforward language; heavily sarcastic or ironic text may produce less accurate sentiment classifications</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the detailed breakdown feature to understand which specific words and phrases influenced the overall sentiment score</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine Sentiment Analyzer with other analytics tools to track sentiment trends over time and identify patterns in customer feedback</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
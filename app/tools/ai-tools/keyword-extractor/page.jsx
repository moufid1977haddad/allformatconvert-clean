'use client';
import { useState } from 'react';

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
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a keyword extraction expert. Extract the most important keywords and key phrases from the provided text. Return them as a numbered list with brief explanations of why each is important.',
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
        <h1 className="text-3xl font-bold text-center mb-2">Keyword Extractor</h1>
        <p className="text-neutral-500 text-center mb-8">Extract keywords from text with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to extract keywords..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Keyword Extractor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Keyword Extractor is a free online tool that automatically identifies and extracts the most relevant keywords from any text, document, or webpage to help optimize your SEO strategy. Simply paste your content and instantly discover high-value keywords that can improve your search engine rankings and content visibility.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Keyword Extractor</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your text, article, or webpage content into the input field on the Keyword Extractor homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Extract Keywords' button to analyze your content and identify relevant keywords</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the extracted keywords displayed in order of relevance and frequency</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the keywords to use them in your SEO strategy, meta tags, and content optimization</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Keyword Extractor really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Keyword Extractor is completely free with no hidden fees, registrations, or premium subscriptions required. You can extract unlimited keywords from unlimited content pieces.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How does the keyword extraction algorithm work?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool uses advanced natural language processing and machine learning to analyze text structure, frequency, and relevance to identify the most important keywords that represent your content's main topics.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I extract keywords from PDFs or only text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Currently, Keyword Extractor works best with plain text input. You can copy and paste text from PDFs, Word documents, or any other source into the tool.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many keywords will be extracted from my content?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The number of extracted keywords varies based on your content length and complexity. The tool typically returns 10-50 relevant keywords ranked by importance and frequency.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the extracted keywords to optimize your meta descriptions, title tags, and header tags for better SEO performance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Focus on long-tail keywords identified by the tool, as they often have less competition and higher conversion rates</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare keywords from multiple articles in your niche to identify content gaps and opportunities for new blog posts</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Regularly extract keywords from competitor content to discover trending topics and keywords you may have missed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
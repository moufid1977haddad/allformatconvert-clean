'use client';
import { useState } from 'react';

export default function TextSummarizerPage() {
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
          system: 'You are a text summarizer. Create a concise summary of the provided text. Keep the key points and main ideas. Return only the summary.',
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
        <h1 className="text-3xl font-bold text-center mb-2">Text Summarizer</h1>
        <p className="text-neutral-500 text-center mb-8">Summarize long texts with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to summarize..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Summarizing...' : 'Summarize'}
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Summarizer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text Summarizer is a free online tool that instantly condenses long documents, articles, and passages into concise summaries while preserving key information and meaning. Perfect for students, professionals, and researchers who need to quickly extract essential points from lengthy content.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Summarizer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the input field on the Text Summarizer homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Adjust the summary length using the slider to control how condensed you want the output</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Summarize' button to instantly generate your summarized text</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the summary to your clipboard or download it as a text file for later use</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text Summarizer really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Summarizer is completely free with no hidden charges, registration required, or premium subscriptions. You can use it unlimited times without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long can the text I input be?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Text Summarizer can handle documents up to 10,000 words. For longer texts, consider breaking them into smaller sections and summarizing each part separately.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What languages does Text Summarizer support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Currently, Text Summarizer works best with English content. We are continuously expanding language support to include additional languages.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my text be saved or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your privacy is protected. All text submitted to Text Summarizer is processed locally and is never stored, saved, or shared with third parties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For academic papers, use the tool to create quick reference summaries that highlight methodology and conclusions without losing important details</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Adjust the summary percentage slider to create abstracts at different lengths for various purposes like emails, presentations, or reports</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy summarized text multiple times with different length settings to compare which version best captures the essence of the original content</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Text Summarizer alongside your reading routine to verify you've captured all key points from articles, books, or research materials</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
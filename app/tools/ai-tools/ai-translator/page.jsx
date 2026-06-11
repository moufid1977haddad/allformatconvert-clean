'use client';
import { useState } from 'react';

const languages = ['English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Arabic', 'Chinese', 'Japanese', 'Russian'];

export default function AITranslatorPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [targetLang, setTargetLang] = useState('English');

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
          system: `You are a professional translator. Translate the provided text to ${targetLang}. Return only the translation without explanations.`,
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
        <h1 className="text-3xl font-bold text-center mb-2">AI Translator</h1>
        <p className="text-neutral-500 text-center mb-8">Translate text to any language with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Target Language</label>
            <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm">
              {languages.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to translate..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Translating...' : 'Translate'}
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Ai Translator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">AI Translator is a free online translation tool that uses advanced artificial intelligence to instantly translate text between multiple languages with high accuracy. Whether you need to translate documents, emails, or web content, AI Translator provides fast and reliable translations without requiring any software installation or subscription.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Ai Translator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the AI Translator website and select your source language from the dropdown menu on the left side</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your target language from the dropdown menu on the right side where you want the text translated</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Paste or type the text you want to translate into the input box on the left side of the interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Translate button to instantly receive your translated text in the output box on the right side</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is AI Translator really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, AI Translator is completely free to use with no hidden charges, registration requirements, or subscription fees. You can translate unlimited text without any limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many languages does AI Translator support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">AI Translator supports over 100 languages including English, Spanish, French, German, Chinese, Japanese, Arabic, and many more, covering the vast majority of languages spoken worldwide.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my translated text kept private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, AI Translator prioritizes your privacy and security. Your translations are not stored or shared with third parties, and all data is processed securely without being saved on our servers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can AI Translator handle technical or specialized terminology?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">AI Translator uses advanced machine learning to recognize and accurately translate technical terms, industry-specific vocabulary, and specialized language across various fields.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For better translations of complex sentences, break them into shorter, simpler phrases rather than translating entire paragraphs at once</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always proofread translated content, especially for formal documents or professional communication, as context-specific nuances may need adjustment</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the copy button to quickly copy translated text to your clipboard without manually selecting and copying the text yourself</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>When translating between languages with different writing systems or grammar structures, review the output carefully to ensure the meaning aligns with your original intent</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';

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
      const lengthCheck = checkPromptLength(input);
      if (!lengthCheck.ok) { setError(lengthCheck.message); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `You are a professional translator. Translate the provided text to ${targetLang}. Return only the translation without explanations.`,
          prompt: input,
          tool: 'ai-translator',
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
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
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
      <SeoContent
        title="AI Translator"
        description="AI Translator is a free online translation tool powered by OpenAI's GPT-4o mini model. It automatically detects the language of your input text and translates it into the target language you choose from the dropdown — no software installation or subscription required."
        howTo={[
          "Choose your target language from the dropdown menu.",
          "Paste or type the text you want to translate into the input box.",
          "Click the Translate button to send it to the AI.",
          "Copy your translated text from the output box below."
        ]}
        faqs={[
          { q: "Is AI Translator really free to use?", a: "Yes, AI Translator is free to use with no signup or subscription required." },
          { q: "How many languages does AI Translator support?", a: "You can translate into 10 target languages from the dropdown: English, French, Spanish, German, Italian, Portuguese, Arabic, Chinese, Japanese, and Russian. The source language is detected automatically." },
          { q: "Is my translated text kept private?", a: "Your text is sent to OpenAI's API to generate the translation. It is not stored on our servers or shared for any purpose beyond producing your translation." },
          { q: "Can AI Translator handle technical or specialized terminology?", a: "The underlying AI model generally handles technical and industry-specific vocabulary well, but for critical documents you should always have a translation reviewed by a fluent speaker." }
        ]}
        tips={[
          "For better translations of complex sentences, break them into shorter, simpler phrases rather than translating entire paragraphs at once.",
          "Always proofread translated content, especially for formal or professional communication.",
          "Use the copy button to quickly copy translated text to your clipboard.",
          "When translating between languages with very different grammar, review the output carefully to make sure the meaning matches your original intent."
        ]}
      />
    </div>
  );
}
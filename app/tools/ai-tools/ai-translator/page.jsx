'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

const languages = ['English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese', 'Arabic', 'Chinese', 'Japanese', 'Russian'];

export default function AITranslatorPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [targetLang, setTargetLang] = useState('English');

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
          tool: 'ai-translator',
          options: { targetLang },
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
        <h1 className="text-3xl font-bold text-center mb-2">AI Translator</h1>
        <p className="text-neutral-500 text-center mb-8">Translate text into {languages.length} languages with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Target Language</label>
            <select aria-label="Target Language" value={targetLang} onChange={e => setTargetLang(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm">
              {languages.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to translate..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Translating...' : 'Translate'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={output} readOnly />
              <TextDownload text={output} name="translation.txt" />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="AI Translator"
        description={`AI Translator translates text you paste into one of ${languages.length} target languages: ${languages.join(', ')}. You do not pick the source language: the model reads it from the text itself. It uses OpenAI's GPT-4o mini through our server and returns only the translation, which you can copy or download as translation.txt. It works on plain text, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters per request; to translate a PDF file, use PDF Translate. Machine translation can miss nuance, so have contracts and other important documents checked by a fluent speaker.`}
        howToTitle="How to translate text with AI"
        howTo={[
          "Choose a language in the \"Target Language\" list.",
          "Paste your text into the \"Paste text to translate...\" box.",
          "Click \"Translate\"; the button reads \"Translating...\" until the result is ready.",
          "Copy the text under \"Result\" with \"Copy\", or click \"Download\" to get translation.txt."
        ]}
        specs={[
          { label: "Target languages", value: languages.join(', ') },
          { label: "Source language", value: "Not chosen: the model reads it from your text" },
          { label: "Length", value: `Up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters per request; the translation itself is limited to 1,000 tokens` },
          { label: "Output", value: "Plain text, copied or downloaded as a .txt file" },
          { label: "Usage limits", value: "Requests per connection are capped per hour and per day, in one allowance with the site's other paid tools, within a monthly budget for the site" }
        ]}
        privacyTitle="Where your text is translated"
        privacy="Translation does not happen in your browser: your text and the chosen language are sent to our server, which passes them to OpenAI's GPT-4o mini, and the translation comes back to the page. We keep no copy of either text, in an account or on our server."
        faqs={[
          { q: "Which target languages are offered?", a: `${languages.length}: ${languages.join(', ')}. Any other target is refused by the server. The text you paste may be in another language; the model reads it and writes the translation in the one you picked.` },
          { q: "Do I need to say what language my text is in?", a: "No. There is no source-language setting, and the page does not display a detected language. The model reads your text as it is and writes the translation in the language chosen in the list." },
          { q: "How long a text can I translate at once?", a: `${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters in the source text. The translation is capped at 1,000 tokens, so a long passage can come back incomplete; translate long texts a few paragraphs at a time and check the end of each result.` },
          { q: "Can I translate a PDF or a Word file here?", a: "No, this page takes pasted text only. For a PDF, use PDF Translate, which works from the PDF file itself. For a Word document, copy its text and paste it into the box above." }
        ]}
        tips={[
          "Check names, figures and dates in the result against your original: they should come through unchanged.",
          "To spot a change in meaning, translate the result back into the original language and compare the two versions."
        ]}
      />
    </div>
  );
}
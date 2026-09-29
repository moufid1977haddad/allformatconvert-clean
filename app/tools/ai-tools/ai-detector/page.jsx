'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';
import { readAiJson } from '../../../lib/aiClient';
import { POLISH_PROMPT, cleanRewrite, raidarSimilarity, raidarVerdict, MIN_WORDS, AI_AT, HUMAN_BELOW } from '@/lib/ai/raidar';

// 30/09 (real calls on www): asked for its opinion, the model called an AI-written text "70 % human" in English and in
// French. The method is now RAIDAR (Mao et al., ICLR 2024): the model is asked to polish the text, and the page measures
// how much of it the model changed -- a model barely touches text written by a model and rewrites human text more.
// Bands and their measured accuracy: lib/ai/raidar.js; calibration: scripts/browser-tests/ai-detector-calibration.mjs.
const VERDICT = {
  ai: { label: 'Likely written by AI', cls: 'bg-red-50 border-red-200 text-red-800' },
  human: { label: 'Likely written by a person', cls: 'bg-green-50 border-green-200 text-green-800' },
  uncertain: { label: 'No clear verdict', cls: 'bg-amber-50 border-amber-200 text-amber-900' },
};

export default function AIDetectorPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;

  const process = async () => {
    if (!input.trim()) return;
    setResult(null);
    setError('');
    if (words < MIN_WORDS) { setError(`Paste at least ${MIN_WORDS} words (this text has ${words}): on shorter texts no detector is reliable.`); return; }
    setLoading(true);
    try {
      const prompt = POLISH_PROMPT + input.trim();
      const lengthCheck = checkPromptLength(prompt);
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tool: 'ai-detector' }),
      });
      const data = await readAiJson(response);
      if (!data.text) { setError(data.error || 'No response received'); setLoading(false); return; }
      const rewrite = cleanRewrite(data.text);
      const sim = raidarSimilarity(input, rewrite);
      setResult({ sim, verdict: raidarVerdict(sim), changed: Math.round((1 - sim) * 100) });
    } catch (e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  const v = result && VERDICT[result.verdict];
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">AI Detector</h1>
        <p className="text-neutral-500 text-center mb-8">Detect if text was written by AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to analyze..." value={input} onChange={e => setInput(e.target.value)} />
          <p className="text-xs text-neutral-500 -mt-2">{words} word{words === 1 ? '' : 's'} · at least {MIN_WORDS} needed</p>
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Detect AI Content'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className={`rounded-xl border p-4 space-y-2 ${v.cls}`} data-verdict={result.verdict}>
              <p className="text-lg font-bold">{v.label}</p>
              <p className="text-sm">Asked to polish your text, an AI model changed <strong>{result.changed} %</strong> of it. AI models barely change text written by an AI model (in our measurements: {Math.round((1 - AI_AT) * 100)} % or less points to AI) and rewrite human writing more (over {Math.round((1 - HUMAN_BELOW) * 100)} % points to a person); in between, we give no verdict.</p>
            </div>
          )}
          {result && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2" data-caveat>No AI detector is reliable enough to prove who wrote a text: measured on 37 texts in five languages from five AI models, this one called no human text AI, but recognised only 5 of 18 AI texts for sure (12 undecided, 1 missed). Famous or heavily edited texts (classics, encyclopedias, scientific abstracts) are often left undecided. Do not use it alone to accuse anyone.</p>}
        </div>
      </div>
      <SeoContent
        title="AI Detector"
        description="AI Detector estimates whether a text was written by AI or by a person with the rewriting method published at ICLR 2024 (RAIDAR): an AI model (OpenAI's GPT-4o mini) is asked to polish your text, and the tool measures how much of it the model changed. AI models barely change text that an AI wrote and rewrite human writing much more. You get a verdict — likely AI, likely a person, or no clear verdict — with the share of the text that was changed."
        howTo={[
          "Paste the text you want to analyze (at least 40 words).",
          "Click 'Detect AI Content': the text is sent to an AI model, which polishes it.",
          "The tool measures how much of your text the model changed.",
          "Read the verdict: likely AI, likely a person, or no clear verdict."
        ]}
        faqs={[
          { q: "Is AI Detector completely free to use?", a: "Yes, AI Detector is free to use with no signup or subscription required." },
          { q: "How does it work?", a: "It uses the rewriting method published by Mao et al. at ICLR 2024: an AI model asked to polish a text changes very little of a text an AI wrote, and much more of a human text. The tool measures the share of characters changed and turns it into a verdict, with a middle band where it gives none." },
          { q: "How accurate is the detection?", a: "Measured by us on 37 texts of 80 to 240 words (English, French, German, Spanish, Italian; AI texts from five recent models): no human text was called AI; 5 of the 18 AI texts were recognised for sure, 12 got no verdict and 1 was missed. Famous or heavily edited texts (classic novels, encyclopedias, scientific abstracts) are often left without a verdict because AI models know them or barely change them. No detector is 100 % reliable: treat the result as a clue, not proof." },
          { q: "Why at least 40 words?", a: "On a sentence or two, the share of the text a model changes varies too much to mean anything, for this method as for every detector." },
          { q: "Is my submitted text stored or shared?", a: "Your text is sent to OpenAI's API to be polished. It is not stored on our servers or used for any other purpose." }
        ]}
        tips={[
          "Paste whole paragraphs (100 words or more) for the clearest results.",
          "Text that has been edited by a person after an AI wrote it tends to get no verdict.",
          "Treat the output as a clue, not proof — human review is still needed for high-stakes decisions.",
          "Try a text you wrote yourself to see how the tool responds."
        ]}
      />
    </div>
  );
}

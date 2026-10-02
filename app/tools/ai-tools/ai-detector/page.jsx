'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { readAiJson } from '../../../lib/aiClient';
import { countBillableWords, AI_DETECT_MIN_WORDS, AI_DETECT_MAX_WORDS, AI_DETECT_MAX_CHARS, AI_DETECT_FREE_WORDS_PER_DAY } from '@/lib/ai/pangram';
import { useToolError } from '../../../lib/useToolError';

// 30/09 (docs/audit/RAPPORT-ai-detector-30-09.md): the rewriting method (RAIDAR, lib/ai/raidar.js) called a human
// arXiv abstract AI on www, and no free method measured on our 97-text corpus reached the market's level without
// accusing human texts. Detection is now done by Pangram's trained classifier (/api/ai-detect), the detector with the
// lowest false-positive rate in the independent study of Jabarian & Imas (University of Chicago / NBER w34223, 2025).
// Limits are declared before the analysis: 40 to 1,000 words, and 2,000 free words a day per visitor (P17: Pangram's
// own free allowance, the most generous per-day one among the trained detectors -- lib/quota/aiDetect.js).
const VERDICT = {
  ai: { label: 'Likely written by AI', cls: 'bg-red-50 border-red-200 text-red-800' },
  mixed: { label: 'Mix of AI and human writing', cls: 'bg-amber-50 border-amber-200 text-amber-900' },
  human: { label: 'Likely written by a person', cls: 'bg-green-50 border-green-200 text-green-800' },
};
const pct = (x) => Math.round(x * 100);

export default function AIDetectorPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const words = countBillableWords(input);
  const chars = input.trim().length;

  const process = async () => {
    if (!input.trim()) return;
    setResult(null);
    setError('');
    if (words < AI_DETECT_MIN_WORDS) { setError(`Paste at least ${AI_DETECT_MIN_WORDS} words (this text has ${words}): on shorter texts no detector is reliable.`); return; }
    if (words > AI_DETECT_MAX_WORDS) { setError(`Up to ${AI_DETECT_MAX_WORDS} words per analysis (this text has ${words}): analyze it in parts.`); return; }
    if (chars > AI_DETECT_MAX_CHARS) { setError(`Up to ${AI_DETECT_MAX_CHARS.toLocaleString('en-US')} characters per analysis (this text has ${chars.toLocaleString('en-US')}): analyze it in parts.`); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/ai-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim() }),
      });
      const data = await readAiJson(response);
      if (!response.ok || !VERDICT[data.verdict]) { setError(data.error || 'No response received'); setLoading(false); return; }
      setResult(data);
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
          <p className={`text-xs -mt-2 ${words > AI_DETECT_MAX_WORDS ? 'text-red-600' : 'text-neutral-500'}`}>{words} word{words === 1 ? '' : 's'} · {AI_DETECT_MIN_WORDS} to {AI_DETECT_MAX_WORDS} words per analysis · {AI_DETECT_FREE_WORDS_PER_DAY.toLocaleString('en-US')} free words a day, no signup (each analysis counts as the next 100 words)</p>
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Detect AI Content'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className={`rounded-xl border p-4 space-y-2 ${v.cls}`} data-verdict={result.verdict}>
              <p className="text-lg font-bold">{v.label}</p>
              <p className="text-sm" data-shares>
                AI-written: <strong>{pct(result.fractionAi)} %</strong> · AI-assisted: <strong>{pct(result.fractionAiAssisted)} %</strong> · Human: <strong>{pct(result.fractionHuman)} %</strong> of the text
              </p>
            </div>
          )}
          {result && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2" data-caveat>No AI detector can prove who wrote a text. This one uses Pangram&apos;s detection model, which in an independent study (University of Chicago, 2025) called essentially no human text AI and recognised 96–98 % of AI texts — in English; results on other languages and on texts edited after an AI wrote them are less certain. Do not use it alone to accuse anyone.</p>}
        </div>
      </div>
      <SeoContent
        title="AI Detector"
        description="AI Detector estimates whether a text was written by AI, by a person, or by both, with Pangram's trained detection model — the detector that made the fewest false accusations in an independent 2025 study by the University of Chicago. You get a verdict and the share of the text that reads as AI-written, AI-assisted or human, for texts of 40 to 1,000 words in English, French and many other languages."
        howTo={[
          "Paste the text you want to analyze (40 to 1,000 words).",
          "Click 'Detect AI Content': the text is sent to the detection model.",
          "Read the verdict: likely AI, likely a person, or a mix of both.",
          "Check the shares of AI-written, AI-assisted and human text."
        ]}
        faqs={[
          { q: "Is AI Detector completely free to use?", a: "Yes: 2,000 words a day, free, with no signup or subscription — the same daily allowance as Pangram's own free account. Each analysis counts as the next 100 words (a 150-word text uses 200), and the count resets at midnight UTC." },
          { q: "How does it work?", a: "The text is analyzed by Pangram's detection model, a classifier trained on large amounts of human and AI writing. It splits the text into segments, labels each one AI-written, AI-assisted or human, and gives an overall verdict." },
          { q: "How accurate is the detection?", a: "In an independent study by the University of Chicago (Jabarian & Imas, 2025), Pangram's detector called essentially no human text AI and recognised 96–98 % of texts written by recent AI models, the best result among the detectors tested. Accuracy is lower on short texts and on texts rewritten by a person. No detector is 100 % reliable: treat the result as a clue, not proof." },
          { q: "Why 40 to 1,000 words?", a: "Under 40 words, no detector is reliable. 1,000 words (12,000 characters) covers an essay page; analyze longer texts in parts. In Chinese, Japanese and Thai, each character counts as a word." },
          { q: "Is my submitted text stored or shared?", a: "Your text is sent to Pangram's API to be analyzed. It is not stored on our servers or used for any other purpose." }
        ]}
        tips={[
          "Paste whole paragraphs (100 words or more) for the clearest results.",
          "A 'mix' verdict often means a human edited an AI draft, or the reverse.",
          "Treat the output as a clue, not proof — human review is still needed for high-stakes decisions.",
          "Try a text you wrote yourself to see how the tool responds."
        ]}
      />
    </div>
  );
}

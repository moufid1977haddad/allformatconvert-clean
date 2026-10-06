'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { readAiJson } from '../../../lib/aiClient';
import { countBillableWords, AI_DETECT_MIN_WORDS, AI_DETECT_MAX_WORDS, AI_DETECT_MAX_CHARS, AI_DETECT_FREE_WORDS_PER_DAY, CHARS_PER_BILLABLE_WORD } from '@/lib/ai/pangram';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

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
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to analyze..." value={input} onChange={e => setInput(e.target.value)} />
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
        description={`AI Detector estimates whether a text was written by AI, by a person or by a mix of both. It sends your text to Pangram, whose detection model was trained on human and AI writing, and shows one of three verdicts with the share of the text that reads as AI-written, AI-assisted and human. Paste ${AI_DETECT_MIN_WORDS} to ${AI_DETECT_MAX_WORDS.toLocaleString('en-US')} words, at most ${AI_DETECT_MAX_CHARS.toLocaleString('en-US')} characters. The verdict is a clue, not proof, and the page says not to use it alone to accuse anyone. It does not check plagiarism and does not highlight which sentences were flagged.`}
        example={{ caption: "Measured on 30/09/2026 through the site's own detection route", inputLabel: "Text", input: "The 2016 LIGO discovery abstract (arXiv), written by its human authors", outputLabel: "Result", output: "Likely written by a person · AI-written: 0 %" }}
        howToTitle="How to check if a text was written by AI"
        howTo={[
          "Paste the text into the box; the counter under it shows how many words will be counted.",
          "Click \"Detect AI Content\".",
          "Read the verdict: \"Likely written by AI\", \"Mix of AI and human writing\" or \"Likely written by a person\".",
          "Check the three shares below it: \"AI-written\", \"AI-assisted\" and \"Human\"."
        ]}
        specs={[
          { label: "Length", value: `${AI_DETECT_MIN_WORDS} to ${AI_DETECT_MAX_WORDS.toLocaleString('en-US')} words and up to ${AI_DETECT_MAX_CHARS.toLocaleString('en-US')} characters per analysis` },
          { label: "Daily allowance", value: `${AI_DETECT_FREE_WORDS_PER_DAY.toLocaleString('en-US')} words per visitor per UTC day, each analysis rounded up to the next hundred words` },
          { label: "Monthly limit", value: "The detector has a budget of its own, separate from the site's other paid tools; once it is used up, analyses stop until the first day of the next month (UTC)" },
          { label: "Word count", value: `The highest of three counts: words between spaces, runs of letters and digits, and one word per ${CHARS_PER_BILLABLE_WORD} characters; in scripts written without spaces, each character is a word` },
          { label: "Result", value: "A verdict and three percentages, without sentence-by-sentence highlighting" }
        ]}
        privacyTitle="Where your text is analyzed"
        privacy="Your text is sent to our server and then to Pangram's detection API, which returns the verdict. We do not save the text. To apply the daily allowance and the budget, our database counts the words billed per visitor, under a hashed IP address, and the cost of each analysis. What Pangram keeps is governed by its own terms."
        faqs={[
          { q: "How accurate is this AI detector?", a: "No detector is certain. In an independent 2025 study by the University of Chicago, Pangram's detector called almost no human text AI and recognised 96–98 % of texts written by recent models, in English. Results in other languages and on AI drafts edited by a person are less certain." },
          { q: "Why is there a minimum and a maximum length?", a: `${AI_DETECT_MIN_WORDS} words is the shortest text the page sends: below it, there is too little writing to judge. ${AI_DETECT_MAX_WORDS.toLocaleString('en-US')} words is the longest per analysis, so split a long essay into parts and compare the verdicts of each part.` },
          { q: "Can the word count be higher than my word processor's?", a: "Yes, on purpose. To never count fewer words than Pangram bills, the page keeps the highest of three counts, so hyphenated or very long words weigh more. Each analysis is then rounded up to the next hundred words of your daily allowance." },
          { q: "Can a text be judged both AI and human?", a: "Yes. A mixed verdict means Pangram found parts that read as AI-written and parts that read as human or AI-assisted. Look at the three percentages to see how the text splits; a mix is common when a person edits an AI draft." }
        ]}
        tips={[
          `Analyze a long text in parts of up to ${AI_DETECT_MAX_WORDS.toLocaleString('en-US')} words: one AI-written section is easier to spot on its own than inside the whole text.`
        ]}
      />
    </div>
  );
}

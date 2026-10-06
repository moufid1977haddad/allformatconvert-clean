'use client';
import { useState, useMemo } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength, MAX_PROMPT_CHARS } from '@/lib/quota/limits';
import { changes, applyChoices } from './diff';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

// The corrected text used to replace the visitor's without showing what changed. Now every change is shown in
// place (removed words struck through, added words underlined) and can be undone or restored one by one, as
// LanguageTool lets its visitors accept each suggestion (read 26/09/2026); the text to copy follows the choices.
// Languages where our corrections were measured less reliable (28/09: learner corpora, 40 sentences each,
// docs/audit/RAPPORT-deploiement-28-09.md §3) -- told on the page, as LanguageTool says its level of
// support differs between languages, and as soon as the text is recognised as one of them (by its script,
// or by letters only Turkish uses).
const WEAK_LANGUAGES = [
  ['Japanese', /[\u3040-\u30ff]/],
  ['Chinese', /[\u4e00-\u9fff]/],
  ['Russian', /[\u0400-\u04ff]/],
  ['Hindi', /[\u0900-\u097f]/],
  ['Turkish', /[ğĞıİşŞ]/],
];
const weakLanguage = (text) => (WEAK_LANGUAGES.find(([, re]) => re.test(text)) || [null])[0];

export default function GrammarFixerPage() {
  const [input, setInput] = useState('');
  const [sent, setSent] = useState(''); // the text the correction was made from
  const [output, setOutput] = useState('');
  const [undone, setUndone] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [copied, setCopied] = useState(false);

  const segs = useMemo(() => (output ? changes(sent, output) : []), [sent, output]);
  const ids = segs.filter((s) => !('same' in s)).map((s) => s.id);
  const result = output ? applyChoices(segs, undone) : '';

  const process = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setOutput('');
    setError('');
    setUndone(new Set());
    try {
      const lengthCheck = checkPromptLength(input);
      if (!lengthCheck.ok) { setError(lengthCheck.message); setLoading(false); return; }
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          tool: 'grammar-fixer',
        }),
      });
      const data = await response.json();
      if (data.text) { setSent(input); setOutput(data.text); }
      else setError(data.error || 'No response received');
    } catch(e) { setError('Error: ' + e.message); }
    setLoading(false);
  };

  const toggle = (id) => setUndone((u) => { const n = new Set(u); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const kept = ids.length - undone.size;
  const weak = weakLanguage(output ? sent : input);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Grammar Fixer</h1>
        <p className="text-neutral-500 text-center mb-8">Fix grammar and spelling errors with AI, and see every change</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to fix grammar..." value={input} onChange={e => setInput(e.target.value)} aria-label="Text to fix" />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Fix Grammar'}
          </button>
          {weak && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="note" data-weak-language={weak}>
              <strong>{weak}:</strong> corrections are less reliable in this language than in English — in our tests on published learner texts, some sentences that were already correct got changed. Check each change before keeping it (click a change to undo it).
            </p>
          )}
          {error && <p className="text-red-400 text-center text-sm" role="alert">{error}</p>}
          {output && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-700" data-count>
                  {ids.length === 0 ? 'No changes: your text was already correct.' : `${ids.length} change${ids.length === 1 ? '' : 's'} — ${kept} kept${undone.size ? `, ${undone.size} undone` : ''}`}
                </p>
                {ids.length > 0 && (
                  <div className="flex gap-2 text-sm">
                    <button type="button" onClick={() => setUndone(new Set())} className="px-3 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200">Keep all</button>
                    <button type="button" onClick={() => setUndone(new Set(ids))} className="px-3 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200">Undo all</button>
                  </div>
                )}
              </div>
              {ids.length > 0 && <p className="text-xs text-neutral-500">Click a change to undo it (click again to restore it).</p>}
              <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm leading-7 whitespace-pre-wrap break-words" data-diff>
                {segs.map((s, i) => ('same' in s
                  ? <span key={i}>{s.same}</span>
                  : undone.has(s.id)
                    ? <button key={i} type="button" onClick={() => toggle(s.id)} data-change={s.id} data-state="undone" title="Undone: click to apply the correction" className="rounded px-0.5 bg-neutral-200 text-neutral-700 hover:bg-neutral-300">{s.from || '∅'}</button>
                    : <button key={i} type="button" onClick={() => toggle(s.id)} data-change={s.id} data-state="kept" title="Click to undo this change" className="rounded px-0.5 hover:bg-amber-100">
                        {s.from && <del className="text-red-700 bg-red-50 decoration-red-600">{s.from}</del>}
                        {s.to && <ins className="text-green-800 bg-green-50 no-underline border-b-2 border-green-600">{s.to}</ins>}
                      </button>))}
              </div>
              <label className="block text-sm text-neutral-500">Result</label>
              <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly aria-label="Result" />
              <TextDownload text={result} name="corrected.txt" />
              <button onClick={copy} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">{copied ? 'Copied' : 'Copy'}</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Grammar Fixer"
        description={`Grammar Fixer corrects spelling, grammar, agreement and clearly wrong punctuation with minimal edits, using OpenAI's GPT-4o mini. The model is told not to rewrite, rephrase or translate, and to leave correct sentences exactly as written. The result is shown word by word in your text, removed words struck through in red and added words underlined in green, and each change can be undone. The text you copy or download as corrected.txt contains only the changes you kept. Your text goes through our server to OpenAI, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters per request.`}
        howToTitle="How to fix grammar and spelling"
        howTo={[
          "Paste your text into the \"Paste text to fix grammar...\" box.",
          "Click \"Fix Grammar\".",
          "Review each change in place, and click one to undo it (click again to restore it).",
          "Use \"Keep all\" or \"Undo all\" to decide in one step.",
          "Click \"Copy\" or \"Download\" to get corrected.txt with the changes you kept."
        ]}
        specs={[
          { label: "Input", value: `Text to proofread, up to ${MAX_PROMPT_CHARS.toLocaleString('en-US')} characters` },
          { label: "Corrections", value: "Spelling, grammar, agreement, verb forms, wrong or missing words and clearly wrong punctuation; no style or word-choice changes" },
          { label: "Output", value: "Your text with the changes you kept, to copy or download as a .txt file" },
          { label: "Languages", value: "Tested on English and ten other languages; a notice appears for Japanese, Chinese, Russian, Hindi and Turkish, where corrections were less reliable" },
          { label: "Usage limits", value: "Per-connection hourly and daily limits, shared with the site's other paid tools, and a monthly budget for the whole site" }
        ]}
        privacyTitle="Where your text is processed"
        privacy="Your text is sent to our server and then to OpenAI's GPT-4o mini, which returns a corrected copy. Only the correction request goes to our server: the comparison that marks each change runs in your browser, and undoing or restoring a change sends nothing more. We do not store your text."
        faqs={[
          { q: "Will it rewrite my sentences?", a: "No. The model is told to make minimal edits, not to paraphrase, reorder or change style, and to leave correct sentences as written. If it still changes something you wanted to keep, click that change to undo it." },
          { q: "Can I see what was changed?", a: "Yes. Every change appears in place, removed words struck through and added words underlined, with a count of changes kept and undone. Undoing all of them gives back your original text exactly." },
          { q: "How well does it work in English?", a: "25 of 25 typical errors were corrected in our English test of 28/09/2026, and a text without errors came back unchanged. It is a small test, so keep reviewing each change before you copy the result." },
          { q: "How reliable is it in other languages?", a: "29 of 40 learner sentences were corrected exactly in Portuguese and 16 to 17 in German, but 11 in Spanish, 9 in Italian and 6 in Arabic. Japanese, Chinese, Russian, Hindi and Turkish texts get a notice on the page that corrections are less reliable." }
        ]}
        tips={[
          "Undo any change the tool made to a name, a brand or a technical term it did not recognise.",
          "If you want new wording rather than corrections, use AI Paraphraser instead."
        ]}
      />
    </div>
  );
}

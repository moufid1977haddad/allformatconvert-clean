'use client';
import { useState, useMemo } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkPromptLength } from '@/lib/quota/limits';
import { changes, applyChoices } from './diff';

// The corrected text used to replace the visitor's without showing what changed. Now every change is shown in
// place (removed words struck through, added words underlined) and can be undone or restored one by one, as
// LanguageTool lets its visitors accept each suggestion (read 26/09/2026); the text to copy follows the choices.
export default function GrammarFixerPage() {
  const [input, setInput] = useState('');
  const [sent, setSent] = useState(''); // the text the correction was made from
  const [output, setOutput] = useState('');
  const [undone, setUndone] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Grammar Fixer</h1>
        <p className="text-neutral-500 text-center mb-8">Fix grammar and spelling errors with AI, and see every change</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste text to fix grammar..." value={input} onChange={e => setInput(e.target.value)} aria-label="Text to fix" />
          <button onClick={process} disabled={!input.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Fix Grammar'}
          </button>
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
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly aria-label="Result" />
              <button onClick={copy} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">{copied ? 'Copied' : 'Copy'}</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Grammar Fixer"
        description="Grammar Fixer is a free online tool that uses OpenAI's GPT-4o mini model to correct spelling, punctuation, and grammatical errors in your writing. Paste your text and see every correction in place — removed words struck through, added words underlined — then keep or undo each one before copying the result."
        howTo={[
          "Paste or type your text directly into the input field.",
          "Click the 'Fix Grammar' button to send it to the AI.",
          "Review the changes: removed words are struck through in red, added words underlined in green.",
          "Click any change to undo it (click again to restore it), or use Keep all / Undo all, then copy the result."
        ]}
        faqs={[
          { q: "Is Grammar Fixer really free to use?", a: "Yes, Grammar Fixer is free to use with no signup or subscription required." },
          { q: "What types of errors does Grammar Fixer detect?", a: "It can catch spelling mistakes, punctuation errors, subject-verb agreement issues, and other common grammatical mistakes as part of rewriting your text." },
          { q: "Can I see what was changed?", a: "Yes. Every change is shown word by word in your text, and each one can be undone on its own; the text you copy includes only the changes you kept. Undoing them all gives back your original text exactly." },
          { q: "Is my text private when using Grammar Fixer?", a: "Your text is sent to OpenAI's API to generate the correction. It is not stored on our servers or shared for any purpose beyond producing your result." },
          { q: "Can Grammar Fixer handle multiple languages?", a: "It works primarily with English text; results for other languages may be less reliable." }
        ]}
        tips={[
          "For best results, paste complete sentences or paragraphs rather than single words, so the AI has context.",
          "Check each highlighted change: AI edits can occasionally change meaning, and you can undo just that one.",
          "Use Grammar Fixer before submitting important documents like resumes, cover letters, or professional emails.",
          "Combine Grammar Fixer with your own proofreading to catch style issues the AI might miss."
        ]}
      />
    </div>
  );
}

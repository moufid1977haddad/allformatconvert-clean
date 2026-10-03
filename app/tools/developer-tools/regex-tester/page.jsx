'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

// P24 (03/10), against regex101 (the reference): matches highlighted in the text with their positions, numbered and
// named capture groups, a replace preview ($1, $<name>, $&), and the match run in a Worker stopped after 2 s — a pattern
// with catastrophic backtracking ((a+)+$ on "aaaa…b") froze the page here, as it would any single-threaded tester.
const WORKER = `self.onmessage = (e) => {
  const { pattern, flags, text, replacement, doReplace } = e.data;
  try {
    const g = flags.includes('g') ? flags : flags + 'g';
    const re = new RegExp(pattern, g);
    const out = [];
    for (const m of text.matchAll(re)) {
      out.push({ index: m.index, text: m[0], groups: m.slice(1).map((v) => (v === undefined ? null : v)), named: m.groups ? Object.fromEntries(Object.entries(m.groups).map(([k, v]) => [k, v === undefined ? null : v])) : null });
      if (out.length >= 5000) break;
    }
    const replaced = doReplace ? text.replace(new RegExp(pattern, flags), replacement) : null;
    self.postMessage({ ok: true, matches: out, capped: out.length >= 5000, replaced });
  } catch (err) { self.postMessage({ ok: false, error: String(err && err.message || err) }); }
};`;

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [replacement, setReplacement] = useState('');
  const [doReplace, setDoReplace] = useState(false);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const workerUrl = useRef(null);
  useEffect(() => () => { if (workerUrl.current) URL.revokeObjectURL(workerUrl.current); }, []);

  const test = () => {
    if (!/^[dgimsuyv]*$/.test(flags) || new Set(flags).size !== flags.length) { setRes({ error: `"${flags}" is not a valid set of flags: use d, g, i, m, s, u, v or y, each once.` }); return; }
    workerUrl.current ??= URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
    const w = new Worker(workerUrl.current);
    setBusy(true);
    const timer = setTimeout(() => { w.terminate(); setBusy(false); reportShownMessage('pattern timeout (2 s)'); setRes({ error: 'This pattern takes too long on this text (more than 2 seconds): it is probably backtracking catastrophically, e.g. nested quantifiers like (a+)+. Simplify the pattern.' }); }, 2000);
    w.onmessage = (e) => { clearTimeout(timer); w.terminate(); setBusy(false); if (!e.data.ok) reportShownMessage(e.data.error); setRes(e.data.ok ? e.data : { error: e.data.error }); };
    w.postMessage({ pattern, flags, text, replacement, doReplace });
  };

  // the text with each match highlighted (zero-length matches shown as a thin marker)
  const highlighted = () => {
    if (!res || !res.matches) return null;
    const parts = []; let at = 0;
    res.matches.forEach((m, i) => {
      if (m.index > at) parts.push(<span key={`t${i}`}>{text.slice(at, m.index)}</span>);
      parts.push(m.text ? <mark key={`m${i}`} className={i % 2 ? 'bg-amber-200' : 'bg-indigo-200'}>{m.text}</mark> : <mark key={`m${i}`} className="bg-red-400 px-px" aria-label="empty match" />);
      at = Math.max(at, m.index + m.text.length);
    });
    parts.push(<span key="end">{text.slice(at)}</span>);
    return parts;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Regex Tester</h1>
        <p className="text-neutral-500 text-center mb-8">Test regular expressions — matches highlighted, groups, replace</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3"><label className="block text-sm text-neutral-500 mb-1">Pattern</label><input aria-label="Pattern" type="text" value={pattern} onChange={e => setPattern(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="e.g. (?<year>\d{4})-(\d{2})" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Flags</label><input aria-label="Flags" type="text" value={flags} onChange={e => setFlags(e.target.value.trim())} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="gi" /></div>
          </div>
          <TextArea aria-label="Test text" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none font-mono" placeholder="Enter text to test..." value={text} onChange={e => setText(e.target.value)} />
          <label className="flex items-center gap-2 text-sm"><input id="rx-replace" type="checkbox" checked={doReplace} onChange={e => setDoReplace(e.target.checked)} /> Replace with</label>
          {doReplace && <input aria-label="Replacement" type="text" value={replacement} onChange={e => setReplacement(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="e.g. $2/$<year> — $& is the whole match" />}
          <button onClick={test} disabled={!pattern || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{busy ? 'Testing…' : 'Test'}</button>
          {res && res.error && <p role="alert" className="text-red-600 text-center">{res.error}</p>}
          {res && res.matches && (
            <div className="space-y-3">
              <div className={`text-center font-semibold ${res.matches.length ? 'text-green-700' : 'text-red-600'}`} data-match-count={res.matches.length}>{res.matches.length ? `${res.matches.length}${res.capped ? '+' : ''} match${res.matches.length > 1 ? 'es' : ''}` : 'No match'}</div>
              {res.matches.length > 0 && <pre className="whitespace-pre-wrap break-words bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm font-mono">{highlighted()}</pre>}
              {res.matches.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-neutral-500"><th className="p-1">#</th><th className="p-1">Position</th><th className="p-1">Match</th><th className="p-1">Groups</th></tr></thead>
                    <tbody>{res.matches.slice(0, 200).map((m, i) => (
                      <tr key={i} className="border-t border-neutral-200 align-top"><td className="p-1">{i + 1}</td><td className="p-1 font-mono">{m.index}–{m.index + m.text.length}</td><td className="p-1 font-mono break-all">{m.text || <em className="text-neutral-400">(empty)</em>}</td>
                        <td className="p-1 font-mono break-all">{m.groups.map((g, k) => <div key={k}>${k + 1}: {g === null ? <em className="text-neutral-400">not matched</em> : g}</div>)}{m.named && Object.entries(m.named).map(([k, v]) => <div key={k}>{k}: {v === null ? <em className="text-neutral-400">not matched</em> : v}</div>)}</td></tr>
                    ))}</tbody>
                  </table>
                  {res.matches.length > 200 && <p className="text-xs text-neutral-500">The first 200 matches are listed; all are highlighted above.</p>}
                </div>
              )}
              {res.replaced !== null && res.replaced !== undefined && (
                <div><div className="text-sm text-neutral-500 mb-1">Result of the replacement</div><TextArea aria-label="Replacement result" readOnly value={res.replaced} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm h-28 font-mono" /><TextDownload text={res.replaced} name="replaced.txt" /></div>
              )}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Regex Tester"
        description="Regex Tester runs your pattern against JavaScript's native RegExp engine, entirely in your browser — nothing is uploaded to a server. Matches are highlighted in your text, each with its position and its numbered and named capture groups, and an optional replacement ($1, $<name>, $&) shows the resulting text. The match runs in a separate thread stopped after 2 seconds, so a pattern that backtracks catastrophically is reported instead of freezing the page. It tests JavaScript regex syntax only."
        howTo={[
          "Type or paste your regex pattern into the Pattern field.",
          "Set flags (e.g. gi for global, case-insensitive) in the Flags field.",
          "Paste the text you want to test into the text area; tick 'Replace with' to also try a replacement.",
          "Click 'Test' to see the matches highlighted, with their positions and capture groups, and the replaced text."
        ]}
        faqs={[
          { q: "What is a regular expression?", a: "A pattern-matching syntax used to search, validate, or extract text based on rules rather than exact strings." },
          { q: "Which regex flavors does it support?", a: "Only JavaScript's native regex syntax — there's no flavor selector for Python, PHP, Java, .NET, or Perl. Named groups use the JavaScript form (?<name>…)." },
          { q: "Does it highlight matches within my text?", a: "Yes — every match is highlighted in the text, and listed with its start–end position and the value of each capture group (numbered and named)." },
          { q: "How do I use groups in the replacement?", a: "$1, $2… insert numbered groups, $<name> a named group, $& the whole match, and $$ a dollar sign — as in JavaScript's String.replace." },
          { q: "Can I save my regex patterns?", a: "No, there's no save feature or pattern library — copy patterns elsewhere if you want to keep them." }
        ]}
        tips={[
          "Use the g flag to replace every match rather than only the first one (matches are always all listed).",
          "If your pattern throws an error, check for unescaped special characters or unbalanced parentheses/brackets.",
          "A pattern stopped after 2 seconds usually nests quantifiers like (a+)+ or (.*)*: rewrite it with a single quantifier.",
          "Test with a range of inputs, including edge cases and empty strings, to confirm your pattern behaves as expected."
        ]}
      />
    </div>
  );
}

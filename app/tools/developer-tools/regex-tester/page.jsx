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
        description={"Regex Tester runs a pattern with JavaScript’s own RegExp engine, the one built into your browser, on text you paste. Up to 5,000 matches are found and highlighted in the text, and the first 200 are listed with their start and end positions and the value of each numbered and named capture group. Ticking Replace with previews the result of String.replace with $1, $<name>, $& or $$. The search runs in a separate worker that is stopped after 2 seconds, so a pattern with catastrophic backtracking is reported instead of freezing the tab. Other flavors (PCRE, Python, .NET) are not available."}
        example={{
          caption: "Output of the page’s own search code (the worker it runs), with the replacement option on.",
          inputLabel: "Pattern, Flags, text, Replace with",
          input: "Pattern: (?<year>\\d{4})-(\\d{2})\nFlags: g\nText: Released 2024-03, updated 2025-11.\nReplace with: $2/$<year>",
          outputLabel: "Result",
          output: "2 matches\n#1  9–16   2024-03   $1: 2024  $2: 03  year: 2024\n#2  26–33  2025-11   $1: 2025  $2: 11  year: 2025\nResult of the replacement: Released 03/2024, updated 11/2025.",
        }}
        howToTitle={"How to test a regular expression in JavaScript"}
        howTo={[
          "Type the pattern in \"Pattern\" without slashes, and the flags in \"Flags\" (g by default; d, i, m, s, u, v and y are also accepted).",
          "Paste the text to search in the large box below.",
          "To try a substitution, tick \"Replace with\" and type the replacement, for example $2/$<year>.",
          "Click \"Test\": matches are highlighted and listed with positions and groups, and the replaced text can be saved with \"Download\" as replaced.txt.",
        ]}
        specs={[
          { label: "Flavor", value: "JavaScript RegExp only; named groups are written (?<name>…)" },
          { label: "Flags accepted", value: "d, g, i, m, s, u, v, y, each at most once" },
          { label: "Time limit", value: "2 seconds per test, then the worker is stopped and the pattern reported" },
          { label: "Matches", value: "Up to 5,000 found and highlighted; the first 200 listed in the table" },
          { label: "Replacement", value: "$1, $<name>, $& and $$; with g every match is replaced, without g only the first" },
        ]}
        privacyTitle={"Where your pattern and text are processed"}
        privacy={"The pattern and your text are processed in a worker inside your browser; the text you test is never sent to our servers. If the pattern is invalid, the error message shown is sent to our error log with the tool’s name and your browser’s name and version; a time-out sends only the words \"pattern timeout (2 s)\". The message is cleaned first, but the cleaning may not hide everything: an invalid pattern containing quotes or angle brackets can reach the log as typed."}
        faqs={[
          { q: "Does it support Python or PCRE regex syntax?", a: "No. Only JavaScript syntax is tested. Constructs such as possessive quantifiers, atomic groups or Python’s (?P<name>…) named groups are rejected as invalid; write named groups as (?<name>…) instead." },
          { q: "Does the replace preview change every match?", a: "No, only with the g flag. The search adds g on its own so that every match is found (up to 5,000), but the replacement uses your flags as typed: without g, only the first match is replaced." },
          { q: "Can a slow pattern freeze the page?", a: "No. The test runs in a separate worker that is terminated after 2 seconds; the page then says the pattern is probably backtracking catastrophically, as nested quantifiers like (a+)+ do on a long text that does not match." },
          { q: "Is there a limit on the number of matches?", a: "Yes. The search stops at 5,000 matches, shown as 5000+, and the table lists the first 200; every match found is highlighted in the text above the table." },
        ]}
        tips={[
          "Type each backslash once, as you would between /…/: \\d in \"Pattern\" is a digit, while \\\\d matches a backslash followed by d.",
          "The v flag needs Safari 17 or later; older Safari versions report it as an invalid flag.",
        ]}
      />
    </div>
  );
}

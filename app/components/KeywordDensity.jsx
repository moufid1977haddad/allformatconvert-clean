'use client';
import { useMemo, useState } from 'react';
import { wordList } from '../lib/textSegments';

// P24 (03/10): keyword density as wordcounter.net shows it — the most frequent words and two- and three-word phrases,
// with their share of all words. Lower-cased with the locale-independent rules; common English words can be left out
// (they are still counted in the total, so the percentages stay shares of the real word count).
const STOP = new Set('a an and are as at be but by for from has have he her his i if in into is it its me my no not of on or our she so than that the their them then there these they this to us was we were what when which who will with you your'.split(' '));

export default function KeywordDensity({ text }) {
  const [size, setSize] = useState(1);
  const [skipCommon, setSkipCommon] = useState(true);
  const rows = useMemo(() => {
    const words = wordList(text).map((w) => w.toLowerCase());
    const total = words.length, counts = new Map();
    for (let i = 0; i + size <= words.length; i++) {
      const g = words.slice(i, i + size);
      if (skipCommon && (size === 1 ? STOP.has(g[0]) : STOP.has(g[0]) || STOP.has(g[size - 1]))) continue;
      const k = g.join(' ');
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return { total, list: [...counts].filter(([, n]) => size === 1 || n > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 15) };
  }, [text, size, skipCommon]);
  if (!rows.total) return null;
  return (
    <div className="space-y-2" data-density>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-neutral-700">Keyword density</span>
        {[1, 2, 3].map((n) => (
          <button key={n} type="button" onClick={() => setSize(n)} aria-pressed={size === n}
            className={`px-3 py-1 rounded-lg border ${size === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-neutral-300'}`}>{n === 1 ? '1 word' : `${n} words`}</button>
        ))}
        <label className="flex items-center gap-2 text-neutral-600"><input type="checkbox" checked={skipCommon} onChange={(e) => setSkipCommon(e.target.checked)} /> Leave out common English words (the, and, of…)</label>
      </div>
      {rows.list.length ? (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-neutral-500"><th className="py-1">{size === 1 ? 'Word' : 'Phrase'}</th><th className="py-1 text-right">Times</th><th className="py-1 text-right">Density</th></tr></thead>
          <tbody>{rows.list.map(([k, n]) => (
            <tr key={k} className="border-t border-neutral-100"><td className="py-1 break-all">{k}</td><td className="py-1 text-right font-mono">{n}</td><td className="py-1 text-right font-mono">{(100 * n / rows.total).toFixed(1)} %</td></tr>
          ))}</tbody>
        </table>
      ) : <p className="text-sm text-neutral-500">{size === 1 ? 'Every word is a common English word, left out of the list.' : `No ${size}-word phrase appears more than once.`}</p>}
      <p className="text-xs text-neutral-500">Density = times ÷ all {rows.total} words.</p>
    </div>
  );
}

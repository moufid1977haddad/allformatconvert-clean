'use client';
import { useState } from 'react';
import { parseBaseNumber, formatBaseNumber } from '../lib/exactNumbers';
import { reportShownMessage } from '../lib/useToolError';

// P24 (03/10): shared by the two Number Base Converter pages. Any base from 2 to 36 (RapidTables and base-convert.com
// take them all; ours stopped at 2/8/10/16), a fractional part, and a target base of the visitor's choice besides the
// four usual ones. Exact BigInt arithmetic (app/lib/exactNumbers.js): a fraction that does not end in the target
// base ends with "…", it is never rounded as if it were exact.
const COMMON = [['2', 'Binary'], ['8', 'Octal'], ['10', 'Decimal'], ['16', 'Hexadecimal']];
const BASES = Array.from({ length: 35 }, (_, i) => String(i + 2));
const NAMED = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal', 36: 'Base 36' };
const label = (b) => (NAMED[b] ? `${NAMED[b]} (${b})` : `Base ${b}`);

export default function BaseConverter() {
  const [value, setValue] = useState('');
  const [fromBase, setFromBase] = useState('10');
  const [toBase, setToBase] = useState('36');
  const [upper, setUpper] = useState(true);
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState(false);

  const parsed = value.trim() ? parseBaseNumber(value, Number(fromBase)) : null;
  const show = (base) => {
    if (!parsed) return null;
    const s = formatBaseNumber(parsed, Number(base));
    return upper ? s.toUpperCase() : s;
  };
  const copy = (base) => {
    setCopyError(false);
    navigator.clipboard.writeText(show(base).replace('…', '')).then(() => { setCopied(base); setTimeout(() => setCopied(''), 1500); }).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); });
  };
  const targets = COMMON.some(([b]) => b === toBase) ? COMMON : [...COMMON, [toBase, label(toBase)]];

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label htmlFor="nb-value" className="block text-sm text-neutral-500 mb-1">Value</label>
          <input id="nb-value" type="text" value={value} onChange={(e) => setValue(e.target.value)} spellCheck={false} autoComplete="off"
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="e.g. 255, -1010.11, 0xFF, ZZ" />
        </div>
        <div>
          <label htmlFor="nb-from" className="block text-sm text-neutral-500 mb-1">From Base</label>
          <select id="nb-from" aria-label="From Base" value={fromBase} onChange={(e) => setFromBase(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            {BASES.map((b) => <option key={b} value={b}>{label(b)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nb-to" className="block text-sm text-neutral-500 mb-1">Also convert to</label>
          <select id="nb-to" aria-label="Also convert to" value={toBase} onChange={(e) => setToBase(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            {BASES.map((b) => <option key={b} value={b}>{label(b)}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-600 sm:pt-6">
          <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Upper-case letters
        </label>
      </div>
      {value.trim() && !parsed && (
        <p role="alert" className="text-sm text-red-600">Not a number in base {fromBase}: use the digits {'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, Number(fromBase)).replace(/^(.{10}).+(.)$/, '$1…$2')}, an optional minus sign and one point.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {targets.map(([base, name]) => (
          <div key={base} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4" data-base={base}>
            <div className="text-neutral-500 text-sm mb-1">{name}{NAMED[base] && !name.includes('(') ? ` (${base})` : ''}</div>
            <div className="font-mono text-indigo-600 text-lg font-bold break-all" data-result>{parsed ? show(base) : '—'}</div>
            {parsed && <button type="button" onClick={() => copy(base)} className="text-xs text-neutral-500 hover:text-neutral-700 mt-1">{copied === base ? 'Copied' : 'Copy'}</button>}
          </div>
        ))}
      </div>
      {parsed && targets.some(([b]) => show(b).endsWith('…')) && (
        <p className="text-xs text-neutral-500">A result ending in “…” has more than 40 digits after the point in that base (it may never end, like 1/3 in decimal): the first 40 are shown, cut, not rounded; Copy gives those 40 digits.</p>
      )}
      {copyError && <p className="text-red-600 text-center text-sm">Copy failed</p>}
    </div>
  );
}

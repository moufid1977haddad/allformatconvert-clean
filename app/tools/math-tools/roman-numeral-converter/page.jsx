'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { toRoman, fromRoman } from '../../../lib/exactNumbers';

// Strict conversions (app/lib/exactNumbers.js): only canonical numerals are accepted, so
// "IM", "VX" or "MMMM" are refused instead of being shown as 999, 5 or 4000.
export default function RomanNumeralConverterPage() {
  const [number, setNumber] = useState('');
  const [roman, setRoman] = useState('');
  const [copyError, setCopyError] = useState(false);

  // P24 (03/10): parseInt read "12.7" as 12 → XII and "1e3" as 1 → I, without a word. Only a whole number 1-3999 converts;
  // anything else gets a sentence.
  const [numberError, setNumberError] = useState('');
  const handleNumber = (val) => {
    setNumber(val);
    const t = String(val).trim();
    if (!t) { setRoman(''); setNumberError(''); return; }
    if (!/^\d+$/.test(t)) { setRoman(''); setNumberError('Type a whole number (no decimals, no exponent): Roman numerals have no fractions.'); return; }
    const n = Number(t);
    if (n >= 1 && n <= 3999) { setRoman(toRoman(n)); setNumberError(''); }
    else { setRoman(''); setNumberError('Standard Roman numerals go from 1 (I) to 3999 (MMMCMXCIX).'); }
  };

  const handleRoman = (val) => {
    setRoman(val.toUpperCase());
    setNumberError('');
    const result = fromRoman(val);
    setNumber(result ? result.toString() : '');
  };
  const romanInvalid = roman !== '' && number === '';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Roman Numeral Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between numbers and Roman numerals</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Number (1-3999)</label>
            <input type="text" inputMode="numeric" aria-label="Number (1-3999)" value={number} onChange={e => handleNumber(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xl font-bold" placeholder="Enter number..." />
            {numberError && <p role="alert" className="text-red-600 text-sm mt-1">{numberError}</p>}
          </div>
          <div className="text-center text-neutral-500 font-bold">⇅</div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Roman Numeral</label>
            <input type="text" value={roman} onChange={e => handleRoman(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xl font-bold font-mono" placeholder="Enter Roman numeral..." />
          </div>
          {romanInvalid && <p role="alert" className="text-red-500 text-center text-sm">“{roman}” is not a valid Roman numeral (standard form, 1 to 3999 — for example 4 is IV, not IIII).</p>}
          {roman && !romanInvalid && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-4xl font-bold text-indigo-400 font-mono">{roman}</div>
              <div className="text-neutral-500 mt-2">{number} = {roman}</div>
            </div>
          )}
          <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(roman).catch(() => setCopyError(true)); }} disabled={!roman || romanInvalid} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-2 font-semibold transition text-white">Copy Roman Numeral</button>
          {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
        </div>
      </div>
      <SeoContent
        title="Roman Numeral Converter"
        description="Roman Numeral Converter converts between Arabic numbers (1–3999) and Roman numerals instantly and bidirectionally as you type, entirely in your browser."
        howTo={[
          "Type a number (1–3999) into the Number field, or a Roman numeral into the Roman Numeral field.",
          "The opposite field updates automatically as you type — no button needed.",
          "Lowercase Roman numerals (e.g., \"iv\") are accepted and converted to uppercase automatically.",
          "Click \"Copy Roman Numeral\" to copy the Roman numeral result to your clipboard."
        ]}
        faqs={[
          { q: "What's the maximum number this converter handles?", a: "1 to 3,999 (MMMCMXCIX) — standard Roman numerals have no symbol for zero or numbers beyond this range." },
          { q: "Does it validate strict Roman numeral syntax?", a: "No — it calculates a value using standard subtractive/additive rules for any combination of valid letters (I, V, X, L, C, D, M), even unconventional ones like \"IIII\", so it won't flag historically non-standard combinations as errors." },
          { q: "Can I convert decimals or fractions?", a: "No, only whole numbers convert — Roman numerals don't represent fractional values." },
          { q: "Is Roman Numeral Converter free to use?", a: "Yes, it's completely free with no signup required." }
        ]}
        tips={[
          "Type into either field — the tool detects which direction to convert automatically.",
          "The Copy button only copies the Roman numeral value, not the Arabic number — copy the number field's text manually if you need that instead.",
          "Lowercase input like \"xiv\" works fine and converts the same as \"XIV\".",
          "For checking tattoo designs or historical dates, double-check against a reference chart since this tool doesn't flag non-standard letter combinations as invalid."
        ]}
      />
    </div>
  );
}
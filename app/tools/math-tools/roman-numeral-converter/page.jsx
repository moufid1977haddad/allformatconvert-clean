'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { toRoman, fromRoman } from '../../../lib/exactNumbers';
import { reportShownMessage } from '../../../lib/useToolError';

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
          <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(roman).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} disabled={!roman || romanInvalid} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-2 font-semibold transition text-white">Copy Roman Numeral</button>
          {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
        </div>
      </div>
      <SeoContent
        title="Roman Numeral Converter"
        description={`Roman Numeral Converter works both ways as you type: a whole number from 1 to 3999 becomes its Roman numeral, and a numeral becomes its number. Lowercase letters are accepted and shown in capitals. Only the standard form is read, the one the converter itself writes, so IIII, IM, VX or MMMM are flagged instead of being turned into 4, 999, 5 or 4000. Zero, decimals, exponents and numbers above 3999 have no standard numeral and get a message, and the Copy Roman Numeral button copies the numeral only.`}
        example={{
          caption: 'Four entries and what the page shows (the page\'s own conversion code, run in Node on October 6, 2026).',
          inputLabel: 'You type',
          input: 'Number: 2026\nNumber: 3999\nRoman Numeral: mcmxciv\nRoman Numeral: IIII',
          outputLabel: 'The other field shows',
          output: 'MMXXVI\nMMMCMXCIX\n1994 (the numeral is shown as MCMXCIV)\nnothing, and the message: “IIII” is not a valid Roman numeral (standard form, 1 to 3999 — for example 4 is IV, not IIII).',
        }}
        howToTitle="How to convert numbers to Roman numerals"
        howTo={[
          `Type a whole number in "Number (1-3999)", or a numeral in "Roman Numeral".`,
          'The other field fills in as you type, and a red message explains any value that cannot convert.',
          `Click "Copy Roman Numeral" to copy the numeral to your clipboard.`,
        ]}
        specs={[
          { label: 'Range', value: '1 to 3999, I to MMMCMXCIX' },
          { label: 'Letters', value: 'I, V, X, L, C, D and M, in capitals or lowercase, in standard subtractive form only' },
          { label: 'Refused with a message', value: 'IIII, IM, VX, MMMM and other non-standard numerals; 0, decimals such as 12.5, exponents such as 1e3, numbers above 3999' },
          { label: 'Copy', value: 'Copies the numeral only, not the number' },
        ]}
        privacyTitle="Where your numbers are processed"
        privacy="Both directions are computed by this page in your browser, and nothing you type is sent. If copying to the clipboard fails, the page sends the fixed text Copy to the clipboard failed to our error log, with the tool's name and your browser's name and major version."
        faqs={[
          { q: 'Does it accept IIII for 4?', a: 'No. A numeral is accepted only if it is exactly the standard form the converter writes for that number, so 4 must be IV and 999 must be CMXCIX, not IM. The page says the numeral is not valid rather than guessing a value for it.' },
          { q: 'What is the largest number it converts?', a: '3999, written MMMCMXCIX. In standard form no letter repeats more than three times, so MMMM for 4000 is refused, and zero and fractions have no standard numeral either; each of these gets a message instead of a result.' },
          { q: 'Can I type lowercase numerals?', a: 'Yes. mcmxciv is read as MCMXCIV and gives 1994, and the Roman Numeral field switches your letters to capitals as you type, so you can copy the standard spelling straight away.' },
        ]}
      />
    </div>
  );
}
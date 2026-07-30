'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function NumberBaseConverterDevPage() {
  const [value, setValue] = useState('');
  const [fromBase, setFromBase] = useState('10');
  const convert = (base) => { try { const d = parseInt(value, parseInt(fromBase)); return isNaN(d) ? 'Invalid' : d.toString(parseInt(base)).toUpperCase(); } catch { return 'Invalid'; } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number Base Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between binary, decimal, octal and hex</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Value</label><input type="text" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="Enter value..." /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">From Base</label><select value={fromBase} onChange={e => setFromBase(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option value="2">Binary</option><option value="8">Octal</option><option value="10">Decimal</option><option value="16">Hexadecimal</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['2','Binary'],['8','Octal'],['10','Decimal'],['16','Hexadecimal']].map(([base,label]) => <div key={base} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4"><div className="text-neutral-500 text-sm mb-1">{label}</div><div className="font-mono text-indigo-400 text-lg font-bold">{value ? convert(base) : '—'}</div></div>)}
          </div>
        </div>
      </div>
      <SeoContent
        title="Number Base Converter"
        description="Number Base Converter shows a number in binary, octal, decimal, and hexadecimal simultaneously, live as you type, entirely in your browser — nothing is uploaded to a server. There's no separate 'target base' selector or Convert button: pick the base your input is written in, and all four results update instantly. It handles whole numbers, including negative ones, but not fractional or decimal-point values."
        howTo={[
          "Type a number into the Value field.",
          "Select the base your input is written in from the 'From Base' dropdown.",
          "Read all four conversions — binary, octal, decimal, and hexadecimal — updating live below.",
          "Change the value or the 'From Base' setting at any time to see updated results instantly."
        ]}
        faqs={[
          { q: "What number bases does it support?", a: "Binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16) — shown simultaneously." },
          { q: "Is there a Convert button or a target-base selector?", a: "No — there's only a 'From Base' selector. All four conversions display live at once; there's no separate step to pick a single target base." },
          { q: "Can I convert negative numbers?", a: "Yes, negative numbers are supported and converted correctly across all four bases." },
          { q: "Can I convert decimal (fractional) numbers, like 3.5?", a: "No — only whole numbers are supported; any fractional part is truncated." }
        ]}
        tips={[
          "All four bases update live as you type — there's no need to click a button.",
          "Set 'From Base' to match how your input is written; entering '10' as hexadecimal gives a different result than entering it as decimal.",
          "For very large numbers, results may lose precision since conversion relies on JavaScript's native number handling.",
          "Only whole numbers are supported — fractional values will be truncated, not converted with decimal places."
        ]}
      />
    </div>
  );
}
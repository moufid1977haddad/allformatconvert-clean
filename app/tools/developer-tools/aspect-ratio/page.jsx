'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function AspectRatioPage() {
  const [w, setW] = useState('1920');
  const [h, setH] = useState('1080');
  const gcd = (a,b) => b === 0 ? a : gcd(b, a%b);
  // Previously an empty or invalid field silently counted as 1, and 1920.5
  // was truncated to 1920: the ratio shown was not the one typed (29/09).
  // Decimals are scaled to integers first, so 2.35:1 gives 47:20.
  const parseVal = (v) => (/^\s*\d+(\.\d+)?\s*$/.test(v) && Number(v) > 0 ? v.trim() : null);
  const wStr = parseVal(w);
  const hStr = parseVal(h);
  let ratio = '—';
  let decimal = '—';
  if (wStr && hStr) {
    const places = Math.max((wStr.split('.')[1] || '').length, (hStr.split('.')[1] || '').length);
    const scale = 10 ** places;
    const wNum = Math.round(Number(wStr) * scale);
    const hNum = Math.round(Number(hStr) * scale);
    const g = gcd(wNum, hNum);
    ratio = `${wNum / g}:${hNum / g}`;
    decimal = String(Number((wNum / hNum).toFixed(4)));
  }
  const presets = [['16:9','1920x1080'],['4:3','1024x768'],['1:1','1080x1080'],['21:9','2560x1080'],['9:16','1080x1920']];
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Aspect Ratio Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Calculate aspect ratios for any dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width</label><input aria-label="Width" type="number" value={w} onChange={e => setW(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height</label><input aria-label="Height" type="number" value={h} onChange={e => setH(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-2">
            <div className="text-4xl font-bold text-indigo-400">{ratio}</div>
            <div className="text-neutral-500">Decimal: {decimal}</div>
          </div>
          <div><label className="block text-sm text-neutral-500 mb-2">Common Presets</label><div className="grid grid-cols-3 gap-2">{presets.map(([r,d]) => <button key={r} onClick={() => { const [pw,ph] = d.split('x'); setW(pw); setH(ph); }} className="bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800 rounded-lg p-2 text-sm transition"><div className="font-semibold">{r}</div><div className="text-xs opacity-80">{d}</div></button>)}</div></div>
        </div>
      </div>
      <SeoContent
        title="Aspect Ratio Calculator"
        description="Aspect Ratio Calculator computes the simplified ratio and decimal value for any width and height you enter, live in your browser as you type. There's no output-format picker or dimension-scaling feature — it always shows both the ratio and the decimal value together."
        howTo={[
          "Type a width and height into the two fields.",
          "Read the simplified ratio (e.g. 16:9) and decimal value shown below.",
          "Click a preset button (16:9, 4:3, 1:1, 21:9, or 9:16) to instantly load common dimensions.",
          "Adjust width or height at any time — the ratio updates instantly."
        ]}
        faqs={[
          { q: "What is an aspect ratio?", a: "The proportional relationship between an image's width and height, expressed as two numbers separated by a colon (e.g., 16:9)." },
          { q: "Is Aspect Ratio Calculator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I choose between decimal, fractional, or ratio output?", a: "No — both the simplified ratio and the decimal value are always shown together; there's no separate output-format selector." },
          { q: "Does it scale dimensions to match a target ratio?", a: "No — it only simplifies whatever width and height you enter; it doesn't calculate a new width or height to match a target ratio." }
        ]}
        tips={[
          "Click a preset to quickly load common ratios like 16:9 or 1:1 instead of typing dimensions by hand.",
          "The decimal value (width ÷ height) is handy for CSS aspect-ratio properties.",
          "Both fields must be positive numbers; if one is empty or invalid, no ratio is shown rather than a wrong one. Decimals are accepted (2.35 and 1 give 47:20).",
          "To find a height that matches a target ratio at a given width, try different height values until the ratio shown matches what you need."
        ]}
      />
    </div>
  );
}
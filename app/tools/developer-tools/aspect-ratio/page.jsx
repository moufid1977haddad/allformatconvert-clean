'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function AspectRatioPage() {
  const [w, setW] = useState('1920');
  const [h, setH] = useState('1080');
  // P24 (03/10): the missing dimension at this ratio, as aspectratiocalculator.com and calculatorsoup.com give it
  const [newW, setNewW] = useState('');
  const [newH, setNewH] = useState('');
  const gcd = (a,b) => b === 0 ? a : gcd(b, a%b);
  // Previously an empty or invalid field silently counted as 1, and 1920.5
  // was truncated to 1920: the ratio shown was not the one typed (29/09).
  // Decimals are scaled to integers first, so 2.35:1 gives 47:20.
  const parseVal = (v) => (/^\s*\d+(\.\d+)?\s*$/.test(v) && Number(v) > 0 ? v.trim() : /^\s*\d+(\.\d+)?e[+-]?\d+\s*$/i.test(v) && Number(v) > 0 && Number.isFinite(Number(v)) ? String(Number(v)) : null); // 1e3 too (type=number accepts it)
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
  const fit = (given, a, b) => { // the other side for a given side, at the ratio a:b
    const v = parseVal(given); if (!v || !wStr || !hStr) return null;
    const exact = Number(v) * b / a; const px = Math.round(exact);
    const six = Number(exact.toFixed(6));
    return { exact: (Math.abs(six - exact) > 1e-12 ? '≈ ' : 'exactly ') + String(six), px, whole: Math.abs(exact - px) < 1e-9 };
  };
  const fromW = fit(newW, Number(wStr), Number(hStr)), fromH = fit(newH, Number(hStr), Number(wStr));
  const presets = [['16:9','1920x1080'],['4:3','1024x768'],['1:1','1080x1080'],['21:9','2560x1080'],['9:16','1080x1920']];
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Aspect Ratio Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Simplify a width and height, or find a missing side</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width</label><input aria-label="Width" type="number" value={w} onChange={e => setW(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height</label><input aria-label="Height" type="number" value={h} onChange={e => setH(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-2">
            <div className="text-4xl font-bold text-indigo-400">{ratio}</div>
            <div className="text-neutral-500">Decimal: {decimal}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-resize>
            <div>
              <label htmlFor="ar-new-w" className="block text-sm text-neutral-500 mb-1">New width → height</label>
              <input id="ar-new-w" type="number" min="0" step="any" value={newW} onChange={(e) => setNewW(e.target.value)} placeholder="e.g. 1280" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
              <p className="text-sm text-neutral-700 mt-1" data-out="h">{fromW ? <>Height: <b>{fromW.px}</b>{!fromW.whole && <> ({fromW.exact}, rounded)</>}</> : newW ? 'Enter a positive number' : ' '}</p>
            </div>
            <div>
              <label htmlFor="ar-new-h" className="block text-sm text-neutral-500 mb-1">New height → width</label>
              <input id="ar-new-h" type="number" min="0" step="any" value={newH} onChange={(e) => setNewH(e.target.value)} placeholder="e.g. 720" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
              <p className="text-sm text-neutral-700 mt-1" data-out="w">{fromH ? <>Width: <b>{fromH.px}</b>{!fromH.whole && <> ({fromH.exact}, rounded)</>}</> : newH ? 'Enter a positive number' : ' '}</p>
            </div>
          </div>
          <div><label className="block text-sm text-neutral-500 mb-2">Common Presets</label><div className="grid grid-cols-3 gap-2">{presets.map(([r,d]) => <button key={r} onClick={() => { const [pw,ph] = d.split('x'); setW(pw); setH(ph); }} className="bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800 rounded-lg p-2 text-sm transition"><div className="font-semibold">{r}</div><div className="text-xs opacity-80">{d}</div></button>)}</div></div>
        </div>
      </div>
      <SeoContent
        title="Aspect Ratio Calculator"
        description={"Aspect Ratio Calculator reduces a width and a height to the smallest whole-number ratio and gives the decimal value (width divided by height, up to four decimals). Decimals are accepted and scaled first, so 2.39 and 1 give 239:100. Two extra fields answer the usual resizing question: type a new width to get the matching height, or a new height to get the width; when the answer is not a whole pixel, the exact value is shown next to the rounded one. Five presets load common sizes. Values must be positive numbers; anything else shows a dash instead of a ratio."}
        example={{
          caption: "A laptop screen size resized to a width of 1280, computed with the page’s own code.",
          inputLabel: "Typed in the fields",
          input: "Width: 1366\nHeight: 768\nNew width → height: 1280",
          outputLabel: "Shown by the calculator",
          output: "683:384\nDecimal: 1.7786\nHeight: 720 (≈ 719.648609, rounded)",
        }}
        howToTitle={"How to calculate an aspect ratio and a missing side"}
        howTo={[
          "Type the original size in \"Width\" and \"Height\", or pick one of the \"Common Presets\" such as 16:9 (1920x1080).",
          "Read the simplified ratio and the \"Decimal\" value; both change as you type.",
          "To resize, type the new width in \"New width → height\", or the new height in \"New height → width\".",
          "Read the result under that field: the value rounded to a whole pixel, followed by the exact value when it is not whole.",
        ]}
        specs={[
          { label: "Accepted values", value: "Positive numbers, including decimals (2.35) and exponent form (1e3); zero, negative or empty values give no ratio" },
          { label: "Results", value: "Simplified ratio, decimal ratio to four decimal places, and the missing side rounded to a whole pixel" },
          { label: "Presets", value: "16:9 (1920x1080), 4:3 (1024x768), 1:1 (1080x1080), 21:9 (2560x1080), 9:16 (1080x1920)" },
        ]}
        privacyTitle={"Where your numbers are processed"}
        privacy={"The ratio and the missing side are computed by the page itself each time you type a digit. Your numbers are not sent to our servers or to anyone else, and nothing is saved: after a reload the fields go back to 1920 and 1080 and the resize fields are empty."}
        faqs={[
          { q: "Can it keep the aspect ratio when I resize an image?", a: "Yes. Enter the original width and height, then type the new width in \"New width → height\": the height shown keeps the same proportions. For example, 1366 by 768 resized to a width of 1280 needs a height of 720, rounded from about 719.65 (the page shows ≈ 719.648609)." },
          { q: "Is 1366 by 768 exactly 16:9?", a: "No. 1366 divided by 768 is 1.7786, while 16:9 is 1.7778, so the calculator shows 683:384. It reduces the exact numbers you type and never rounds them to the nearest common ratio." },
          { q: "Can I enter decimal values such as 2.39 and 1?", a: "Yes. Both values are scaled to whole numbers before they are reduced, so 2.39 and 1 give 239:100 with a decimal of 2.39. Exponent form such as 1e3 is read too; zero, negative or empty values show a dash." },
          { q: "Can I use the decimal value in CSS?", a: "Yes. It is the width divided by the height, rounded to four decimal places, and the CSS aspect-ratio property accepts a single number, for example aspect-ratio: 1.7778. CSS also accepts the ratio itself written as 16 / 9." },
        ]}
        tips={[
          "Picking a preset replaces both \"Width\" and \"Height\", so type your own size again before resizing.",
          "Once you know the target size, Image Resizer or Image Cropper can produce the image itself.",
        ]}
      />
    </div>
  );
}
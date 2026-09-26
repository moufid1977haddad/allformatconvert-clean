'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// HEX, RGB, HSL, HSV and CMYK, each editable. HSV and CMYK added 2026-09-26 (RapidTables and ColorHexa show both);
// CMYK is the plain formula they use (K = 1 - max(R,G,B)), not a printer profile. An invalid HEX used to leave the
// old colour on screen without a word (measured 2026-09-22): it now says so and the other fields keep the last
// valid colour.

const hexToRgb = (hex) => {
  const s = hex.trim().replace(/^#/, '');
  if (/^[a-f\d]{3}$/i.test(s)) return { r: parseInt(s[0] + s[0], 16), g: parseInt(s[1] + s[1], 16), b: parseInt(s[2] + s[2], 16) };
  if (/^[a-f\d]{6}$/i.test(s)) return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
  return null;
};
const rgbToHex = ({ r, g, b }) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

const rgbToHsl = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
};
const hslToRgb = ({ h, s, l }) => {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
};
const rgbToHsv = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: Math.round(h * 60) % 360, s: Math.round(max ? (d / max) * 100 : 0), v: Math.round(max * 100) };
};
const hsvToRgb = ({ h, s, v }) => {
  s /= 100; v /= 100;
  const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
};
const rgbToCmyk = ({ r, g, b }) => {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  const t = (x) => Math.round(((1 - x / 255 - k) / (1 - k)) * 100);
  return { c: t(r), m: t(g), y: t(b), k: Math.round(k * 100) };
};
const cmykToRgb = ({ c, m, y, k }) => {
  const t = (x) => Math.round(255 * (1 - x / 100) * (1 - k / 100));
  return { r: t(c), g: t(m), b: t(y) };
};

const SPACES = [
  { id: 'hsl', label: 'HSL', keys: [['h', 'H', 360], ['s', 'S%', 100], ['l', 'L%', 100]], from: rgbToHsl, to: hslToRgb, css: (v) => `hsl(${v.h}, ${v.s}%, ${v.l}%)` },
  { id: 'hsv', label: 'HSV / HSB', keys: [['h', 'H', 360], ['s', 'S%', 100], ['v', 'V%', 100]], from: rgbToHsv, to: hsvToRgb, css: (v) => `hsv(${v.h}, ${v.s}%, ${v.v}%)` },
  { id: 'cmyk', label: 'CMYK', keys: [['c', 'C%', 100], ['m', 'M%', 100], ['y', 'Y%', 100], ['k', 'K%', 100]], from: rgbToCmyk, to: cmykToRgb, css: (v) => `cmyk(${v.c}%, ${v.m}%, ${v.y}%, ${v.k}%)` },
];

export default function ColorConverterPage() {
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hexText, setHexText] = useState('#3b82f6');
  const [hexError, setHexError] = useState('');
  // What the visitor is typing in one space is kept as typed (else 100% cyan would snap back while editing).
  const [editing, setEditing] = useState(null); // { id, values }

  const setFromRgb = (c) => { setRgb(c); setHexText(rgbToHex(c)); setHexError(''); };
  const handleHex = (val) => {
    setHexText(val); setEditing(null);
    const c = hexToRgb(val);
    if (c) { setRgb(c); setHexError(''); }
    else setHexError(val.trim() ? `"${val.trim()}" is not a HEX colour: use 3 or 6 digits 0-9 / A-F, like #3b82f6 or #fff. The fields below still show ${rgbToHex(rgb)}.` : 'Type a HEX colour, like #3b82f6.');
  };
  const handleRgb = (key, val) => { setEditing(null); setFromRgb({ ...rgb, [key]: Math.max(0, Math.min(255, parseInt(val) || 0)) }); };
  const handleSpace = (sp, key, max, val) => {
    const base = editing?.id === sp.id ? editing.values : sp.from(rgb);
    const values = { ...base, [key]: Math.max(0, Math.min(max, parseInt(val) || 0)) };
    setEditing({ id: sp.id, values });
    setFromRgb(sp.to(values));
  };

  const copy = (text) => navigator.clipboard.writeText(text);
  const hex = rgbToHex(rgb);
  const input = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Color Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between HEX, RGB, HSL, HSV and CMYK</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-xl border-4 border-neutral-200" style={{ backgroundColor: hex }} data-swatch={hex} />
          </div>
          <div>
            <label htmlFor="cc-hex" className="block text-sm text-neutral-500 mb-1">HEX</label>
            <div className="flex gap-2">
              <input type="color" value={hex} onChange={e => handleHex(e.target.value)} aria-label="Colour picker" className="w-12 h-12 rounded-lg cursor-pointer bg-neutral-50 border border-neutral-200" />
              <input id="cc-hex" type="text" value={hexText} onChange={e => handleHex(e.target.value)} aria-invalid={!!hexError} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" />
            </div>
            {hexError && <p className="text-sm text-red-600 mt-1" role="alert">{hexError}</p>}
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">RGB</label>
            <div className="grid grid-cols-3 gap-2">
              {['r', 'g', 'b'].map(k => (
                <div key={k}>
                  <label htmlFor={`cc-rgb-${k}`} className="block text-xs text-neutral-500 mb-1">{k.toUpperCase()}</label>
                  <input id={`cc-rgb-${k}`} type="number" min="0" max="255" value={rgb[k]} onChange={e => handleRgb(k, e.target.value)} className={input} />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-neutral-500 text-sm font-mono" data-css="rgb">rgb({rgb.r}, {rgb.g}, {rgb.b})</p>
              <button onClick={() => copy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} className="text-xs text-indigo-500 hover:text-indigo-400">Copy</button>
            </div>
          </div>
          {SPACES.map(sp => {
            const v = editing?.id === sp.id ? editing.values : sp.from(rgb);
            return (
              <div key={sp.id}>
                <label className="block text-sm text-neutral-500 mb-1">{sp.label}</label>
                <div className={`grid gap-2 ${sp.keys.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {sp.keys.map(([k, l, max]) => (
                    <div key={k}>
                      <label htmlFor={`cc-${sp.id}-${k}`} className="block text-xs text-neutral-500 mb-1">{l}</label>
                      <input id={`cc-${sp.id}-${k}`} type="number" min="0" max={max} value={v[k]} onChange={e => handleSpace(sp, k, max, e.target.value)} className={input} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="text-neutral-500 text-sm font-mono" data-css={sp.id}>{sp.css(v)}</p>
                  <button onClick={() => copy(sp.css(v))} className="text-xs text-indigo-500 hover:text-indigo-400">Copy</button>
                </div>
              </div>
            );
          })}
          <button onClick={() => copy(hex)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy HEX</button>
        </div>
      </div>
      <SeoContent
        title="Color Converter"
        description="Color Converter converts between HEX, RGB, HSL, HSV (HSB) and CMYK color values live, entirely in your browser. Edit the color using the picker, the HEX field or any of the RGB, HSL, HSV or CMYK fields — any of them updates all the others instantly, and each format has its own one-click copy button."
        howTo={[
          "Use the color picker, type a HEX code, or enter RGB (0–255), HSL, HSV (H: 0–360, other values 0–100%) or CMYK (0–100%) values — any of these update the others automatically.",
          "Watch the color preview swatch update live as you adjust any field.",
          "Click \"Copy\" next to a format, or \"Copy HEX\", to copy that format to your clipboard.",
          "If a HEX code is not valid, the page says so and keeps showing the last valid color."
        ]}
        faqs={[
          { q: "What color formats does Color Converter support?", a: "HEX (3 or 6 digits), RGB, HSL, HSV/HSB and CMYK are all directly editable, and each has its own copy button." },
          { q: "Is Color Converter free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Is the CMYK value ready for print?", a: "It is the standard formula (K = 1 − max(R, G, B)), the same as most online converters. Printers convert with a color profile for their ink and paper, so check a proof for brand colors." },
          { q: "Does it support RGBA, HSLA or named colors?", a: "Not currently — there is no alpha/transparency channel and named colors are not accepted." },
          { q: "Is my data private?", a: "Yes, all color math happens locally in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "Use the color picker swatch for quick visual selection instead of typing values manually.",
          "Edit HSL or HSV directly if you're fine-tuning lightness or saturation — it's often more intuitive than guessing RGB values.",
          "HSV is the model most design tools use in their color pickers (Photoshop calls it HSB).",
          "Each format has its own copy button, so you can grab exactly the syntax your code needs."
        ]}
      />
    </div>
  );
}

'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function ColorConverterPage() {
  const [hex, setHex] = useState('#3b82f6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });

  const hexToRgb = (hex) => {
    const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (shorthand) {
      return {
        r: parseInt(shorthand[1] + shorthand[1], 16),
        g: parseInt(shorthand[2] + shorthand[2], 16),
        b: parseInt(shorthand[3] + shorthand[3], 16),
      };
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  };

  const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

  const rgbToHsl = (r, g, b) => {
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
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const handleHex = (val) => {
    setHex(val);
    const r = hexToRgb(val);
    if (r) { setRgb(r); setHsl(rgbToHsl(r.r, r.g, r.b)); }
  };

  const handleRgb = (key, val) => {
    const clamped = Math.max(0, Math.min(255, parseInt(val) || 0));
    const newRgb = { ...rgb, [key]: clamped };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const hslToRgb = (h, s, l) => {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
  };

  const handleHsl = (key, val) => {
    const max = key === 'h' ? 360 : 100;
    const newHsl = { ...hsl, [key]: Math.max(0, Math.min(max, parseInt(val) || 0)) };
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const copy = (text) => navigator.clipboard.writeText(text);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Color Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between HEX, RGB and HSL</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-xl border-4 border-neutral-200" style={{backgroundColor: hex}} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">HEX</label>
            <div className="flex gap-2">
              <input type="color" value={hex} onChange={e => handleHex(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer bg-neutral-50 border border-neutral-200" />
              <input type="text" value={hex} onChange={e => handleHex(e.target.value)} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">RGB</label>
            <div className="grid grid-cols-3 gap-2">
              {['r','g','b'].map(k => (
                <div key={k}>
                  <label className="block text-xs text-neutral-500 mb-1">{k.toUpperCase()}</label>
                  <input type="number" min="0" max="255" value={rgb[k]} onChange={e => handleRgb(k, e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-neutral-500 text-sm font-mono">rgb({rgb.r}, {rgb.g}, {rgb.b})</p>
              <button onClick={() => copy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} className="text-xs text-indigo-500 hover:text-indigo-400">Copy</button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">HSL</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">H</label>
                <input type="number" min="0" max="360" value={hsl.h} onChange={e => handleHsl('h', e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">S%</label>
                <input type="number" min="0" max="100" value={hsl.s} onChange={e => handleHsl('s', e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">L%</label>
                <input type="number" min="0" max="100" value={hsl.l} onChange={e => handleHsl('l', e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-neutral-500 text-sm font-mono">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</p>
              <button onClick={() => copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)} className="text-xs text-indigo-500 hover:text-indigo-400">Copy</button>
            </div>
          </div>
          <button onClick={() => copy(hex)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy HEX</button>
        </div>
      </div>
      <SeoContent
        title="Color Converter"
        description="Color Converter converts between HEX, RGB, and HSL color values live, entirely in your browser. Edit the color using the picker, the HEX field, the individual RGB fields, or the individual HSL fields — any of them updates all the others instantly, and each format has its own one-click copy button."
        howTo={[
          "Use the color picker, type a HEX code, enter RGB values (0–255), or enter HSL values (H: 0–360, S/L: 0–100%) — any of these update the others automatically.",
          "Watch the color preview swatch update live as you adjust any field.",
          "Click \"Copy\" next to the RGB or HSL value, or \"Copy HEX\", to copy that format to your clipboard.",
          "Switch between formats freely — there's no need to convert manually."
        ]}
        faqs={[
          { q: "What color formats does Color Converter support?", a: "HEX, RGB, and HSL are all directly editable, and each has its own copy button." },
          { q: "Is Color Converter free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Does it support RGBA, HSLA, HSV, or named colors?", a: "Not currently — only HEX, RGB, and HSL accept direct input, without an alpha/transparency channel." },
          { q: "Is my data private?", a: "Yes, all color math happens locally in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "Use the color picker swatch for quick visual selection instead of typing values manually.",
          "Edit HSL directly if you're fine-tuning lightness or saturation — it's often more intuitive than guessing RGB values.",
          "The HSL value is handy for CSS since adjusting just the \"L\" (lightness) field lets you create lighter or darker variants of the same hue.",
          "Each format (HEX, RGB, HSL) has its own copy button, so you can grab exactly the syntax your code needs."
        ]}
      />
    </div>
  );
}
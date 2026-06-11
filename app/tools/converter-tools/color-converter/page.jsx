'use client';
import { useState } from 'react';

export default function ColorConverterPage() {
  const [hex, setHex] = useState('#3b82f6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });

  const hexToRgb = (hex) => {
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
    const newRgb = { ...rgb, [key]: parseInt(val) || 0 };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

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
            <p className="text-neutral-500 text-sm mt-2 text-center font-mono">rgb({rgb.r}, {rgb.g}, {rgb.b})</p>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center">
            <p className="text-neutral-500 text-sm">HSL</p>
            <p className="font-mono text-indigo-400">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</p>
          </div>
          <button onClick={() => navigator.clipboard.writeText(hex)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy HEX</button>
        </div>
      </div>
    </div>
  );
}
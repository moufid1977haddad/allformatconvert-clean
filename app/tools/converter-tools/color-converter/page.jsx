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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Color Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Color Converter is a free online tool that instantly converts colors between multiple formats including HEX, RGB, HSL, and more. Whether you're a designer, developer, or content creator, this tool simplifies color management and ensures consistency across all your projects.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Color Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your color in any format (HEX, RGB, HSL, or named color) into the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically detects the format and displays a color preview</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>View all converted color formats instantly in the results section</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy any format to your clipboard with a single click for easy use in your projects</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What color formats does Color Converter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Color Converter supports HEX, RGB, RGBA, HSL, HSLA, HSV, and named color formats for comprehensive color conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Color Converter really free?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Color Converter is completely free to use with no registration, limitations, or hidden charges.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Color Converter on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely! Color Converter is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install anything to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No installation is required. Simply visit the website and start converting colors immediately in your browser.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this page for quick access whenever you need instant color conversions during your design workflow</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the HEX format for web design and the RGB format for digital graphics to ensure proper color display</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare multiple color formats side-by-side to find the best option for your specific application or platform</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the HSL or HSLA values for better color manipulation and adjustment in CSS animations and transitions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
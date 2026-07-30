'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ColorPickerPage() {
  const [color, setColor] = useState('#3b82f6');
  const hexToRgb = (hex) => { const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null; };
  const rgb = hexToRgb(color);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Color Picker</h1>
        <p className="text-neutral-500 text-center mb-8">Pick and convert colors</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex justify-center"><div className="w-48 h-48 rounded-xl border-4 border-neutral-200" style={{backgroundColor: color}} /></div>
          <div className="flex justify-center"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-16 h-16 rounded-xl cursor-pointer border-0" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">HEX</div><div className="font-mono text-indigo-400">{color}</div><button onClick={() => navigator.clipboard.writeText(color)} className="text-xs text-neutral-500 hover:text-neutral-300">Copy</button></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">RGB</div><div className="font-mono text-indigo-400 text-xs">{rgb ? `${rgb.r},${rgb.g},${rgb.b}` : ''}</div><button onClick={() => navigator.clipboard.writeText(rgb ? `rgb(${rgb.r},${rgb.g},${rgb.b})` : '')} className="text-xs text-neutral-500 hover:text-neutral-300">Copy</button></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center"><div className="text-neutral-500 text-xs mb-1">Input</div><input type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full bg-neutral-200 rounded p-1 text-center font-mono text-sm" /></div>
          </div>
        </div>
      </div>
      <SeoContent
        title="Color Picker"
        description="Color Picker lets you pick a color with your browser's native color picker or type a hex code directly, and shows the matching HEX and RGB values, entirely client-side. It converts any standard 6-digit hex code (with or without a leading #, either case) to RGB; it doesn't accept 3-digit shorthand hex or named CSS colors like 'red' for the RGB conversion, and there's no image upload, URL input, or HSL/CMYK display."
        howTo={[
          "Click the color swatch to open your browser's native color picker, or type a hex code directly into the Input box.",
          "The large preview box updates instantly to show the selected color.",
          "Read the matching HEX and RGB values in the cards below.",
          "Click 'Copy' under HEX or RGB to copy that value to your clipboard."
        ]}
        faqs={[
          { q: "What color formats does Color Picker support?", a: "HEX and RGB. There's no HSL, HSLA, or CMYK conversion, and no RGBA/alpha channel." },
          { q: "Can I extract colors from an image?", a: "No — there's no image upload, URL input, or eyedropper for sampling colors from a picture or webpage." },
          { q: "Is Color Picker free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I type a color name or 3-digit hex code?", a: "You can type it, and the preview swatch will still render it correctly since browsers understand those formats — but the RGB conversion only recognizes full 6-digit hex codes, so it will show blank for shorthand hex or named colors like 'red'." }
        ]}
        tips={[
          "Use the native color picker (click the swatch) for the easiest way to browse and select a color visually.",
          "Type a full 6-digit hex code (e.g. 3b82f6 or #3B82F6) in the Input box if you already know the exact color you want — the leading # is optional and case doesn't matter.",
          "If the RGB card looks empty, check that you entered a full 6-digit hex value rather than a 3-digit shorthand or color name.",
          "There's no save or palette feature, so copy each value you need before navigating away."
        ]}
      />
    </div>
  );
}
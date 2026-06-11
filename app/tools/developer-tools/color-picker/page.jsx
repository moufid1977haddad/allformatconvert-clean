'use client';
import { useState } from 'react';
export default function ColorPickerPage() {
  const [color, setColor] = useState('#3b82f6');
  const hexToRgb = (hex) => { const r = /^#?([a-fd]{2})([a-fd]{2})([a-fd]{2})$/i.exec(hex); return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : null; };
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
    </div>
  );
}
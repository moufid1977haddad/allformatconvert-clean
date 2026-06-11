'use client';
import { useState } from 'react';
export default function AspectRatioPage() {
  const [w, setW] = useState('1920');
  const [h, setH] = useState('1080');
  const gcd = (a,b) => b === 0 ? a : gcd(b, a%b);
  const g = gcd(parseInt(w)||1, parseInt(h)||1);
  const ratio = `${(parseInt(w)||1)/g}:${(parseInt(h)||1)/g}`;
  const decimal = ((parseInt(w)||1)/(parseInt(h)||1)).toFixed(4);
  const presets = [['16:9','1920x1080'],['4:3','1024x768'],['1:1','1080x1080'],['21:9','2560x1080'],['9:16','1080x1920']];
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Aspect Ratio Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Calculate aspect ratios for any dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width</label><input type="number" value={w} onChange={e => setW(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height</label><input type="number" value={h} onChange={e => setH(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-2">
            <div className="text-4xl font-bold text-indigo-400">{ratio}</div>
            <div className="text-neutral-500">Decimal: {decimal}</div>
          </div>
          <div><label className="block text-sm text-neutral-500 mb-2">Common Presets</label><div className="grid grid-cols-3 gap-2">{presets.map(([r,d]) => <button key={r} onClick={() => { const [pw,ph] = d.split('x'); setW(pw); setH(ph); }} className="bg-neutral-800 hover:bg-neutral-100 rounded-lg p-2 text-sm transition"><div className="font-semibold">{r}</div><div className="text-neutral-500 text-xs">{d}</div></button>)}</div></div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Aspect Ratio</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">The Aspect Ratio tool is a free online utility that helps you calculate, convert, and understand image dimensions and aspect ratios for any project. Whether you're designing graphics, editing videos, or optimizing photos, this tool makes it easy to maintain perfect proportions across all your media.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Aspect Ratio</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your image width and height values in the input fields</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired output format (decimal, fractional, or ratio notation)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the calculate button to instantly see your aspect ratio results</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Use the conversion feature to scale your dimensions while maintaining the same aspect ratio</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is an aspect ratio?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">An aspect ratio is the proportional relationship between the width and height of an image, expressed as two numbers separated by a colon (e.g., 16:9).</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why is aspect ratio important?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Aspect ratio ensures your images display correctly across different devices and platforms without distortion, stretching, or cropping.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What are common aspect ratios?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Common aspect ratios include 16:9 (widescreen), 4:3 (standard), 1:1 (square), and 21:9 (ultrawide) for various applications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use this tool for video aspect ratios?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, this tool works for any media format including videos, photos, and graphics that require specific aspect ratio calculations.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always maintain consistent aspect ratios when uploading images to social media platforms for professional-looking content</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the scaling feature to resize your images proportionally without losing quality or creating distorted visuals</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark common aspect ratios for your most-used projects to save time and ensure consistency</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your aspect ratios across different devices and screens to verify they display correctly on mobile, tablet, and desktop</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
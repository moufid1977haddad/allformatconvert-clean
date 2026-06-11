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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Color Picker</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Color Picker is a free online tool that allows you to easily identify, extract, and convert colors from images, web pages, or color codes. Whether you need hex, RGB, or HSL values, this tool provides instant color information for designers, developers, and creative professionals.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Color Picker</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Color Picker tool and select your preferred input method: upload an image, enter a URL, or paste a color code</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click on the image or color area you want to analyze, or input the specific color code you need to convert</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>The tool will instantly display the color values in multiple formats including hex, RGB, HSL, and CMYK</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the color code in your preferred format to use in your design, development, or branding projects</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What color formats does Color Picker support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Color Picker supports multiple formats including hexadecimal (HEX), RGB, RGBA, HSL, HSLA, and CMYK values for comprehensive color conversion needs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Color Picker to extract colors from images?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can upload images or provide image URLs, and Color Picker will allow you to click on any part of the image to extract the exact color code.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Color Picker free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely! Color Picker is completely free with no registration required. You can use all features without any limitations or hidden charges.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I save my color palette for later use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">While the basic tool is free, you can manually save color codes to a document or take screenshots. Some versions may offer palette-saving features for registered users.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the eyedropper feature to sample colors directly from websites by uploading screenshots or using browser extensions for seamless color matching</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare multiple color values by keeping the tool open in multiple tabs or windows to ensure color consistency across your design projects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export your color palettes as CSS variables or design tokens to streamline your workflow and maintain brand consistency</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Utilize the color harmony and contrast features to ensure your selected colors meet accessibility standards for web and print design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
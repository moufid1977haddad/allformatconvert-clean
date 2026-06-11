'use client';
import { useState, useRef } from 'react';

export default function SvgToPngPage() {
  const [file, setFile] = useState(null);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const convert = async () => {
    if (!file) return;
    setStatus('Converting...');
    try {
      const text = await file.text();
      const blob = new Blob([text], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setResult(canvas.toDataURL('image/png'));
        setStatus('');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SVG to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Rasterize SVG vectors to PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an SVG file here'}</p>
            <input ref={inputRef} type="file" accept=".svg" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width (px)</label><input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height (px)</label><input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert to PNG</button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="space-y-2">
              <img src={result} className="max-h-48 mx-auto rounded" />
              <a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download PNG</a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Svg To Png</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">SVG to PNG is a free online conversion tool that instantly transforms vector SVG files into raster PNG images with high quality and transparency support. Perfect for designers and developers who need to convert scalable graphics into portable image formats without installing any software.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Svg To Png</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the SVG to PNG converter tool on our website and locate the upload area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your SVG file directly into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust conversion settings such as resolution, background color, and scaling if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Convert button and download your PNG file instantly to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most SVG to PNG converters support files up to 50MB. Check your specific tool's limits as they may vary by platform.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the conversion maintain transparency?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PNG format supports transparency, and most converters will preserve transparent areas from your SVG file by default.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple SVG files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Many online converters support batch conversion, allowing you to upload and convert multiple SVG files simultaneously for efficiency.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What resolution should I use for my PNG output?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Choose resolution based on your needs: 72 DPI for web use, 300 DPI for printing. Most tools offer preset options for common use cases.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, ensure your SVG file is properly formatted and contains only vector elements without embedded raster images</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use higher DPI settings when converting SVGs intended for print media to maintain sharpness and quality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of batch conversion features to save time when converting multiple SVG files to PNG format</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always download your converted PNG files promptly as temporary files may be deleted automatically after a certain period</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
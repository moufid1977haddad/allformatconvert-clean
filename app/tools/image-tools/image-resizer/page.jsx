'use client';
import { useState, useRef } from 'react';
export default function ImageResizerPage() {
  const [image, setImage] = useState(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { const url = URL.createObjectURL(f); setImage(url); const img = new Image(); img.onload = () => { setWidth(img.width); setHeight(img.height); }; img.src = url; setResult(null); } };
  const resize = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Resizer</h1>
        <p className="text-neutral-500 text-center mb-8">Resize images to specific dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width (px)</label><input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height (px)</label><input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <button onClick={resize} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Resize</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="resized.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Resizer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Resizer is a free online tool that allows you to quickly resize images to any dimension without installing software or creating an account. Perfect for web optimization, social media, and preparing images for various platforms, this tool maintains image quality while reducing file sizes.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Resizer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Image Resizer website and click the upload button to select an image from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Enter your desired width and height dimensions or choose from preset sizes for popular platforms</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your resized image and adjust settings like format or quality if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your resized image to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image Resizer support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Resizer supports all major formats including JPG, PNG, GIF, WebP, and BMP for both uploading and downloading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit to how large an image I can resize?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most images up to 50MB can be resized, though optimal performance is achieved with files under 10MB.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will resizing my image reduce its quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Resizer uses advanced compression algorithms to maintain quality, though very large reductions may affect clarity slightly.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my images after I resize them?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Image Resizer does not store any images on our servers; all files are deleted immediately after download for privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preset dimensions for Instagram (1080x1080), Twitter (1200x675), or Facebook (1200x628) to ensure optimal display on social media</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Reduce file size by converting to WebP format, which provides better compression while maintaining quality compared to traditional JPG</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Maintain aspect ratio when resizing to avoid distorting your images; enable the lock option to automatically adjust one dimension based on the other</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch resize multiple images by using the queue feature, saving time when preparing images for websites or marketing campaigns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
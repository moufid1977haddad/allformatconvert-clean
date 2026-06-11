'use client';
import { useState, useRef } from 'react';
export default function PNGtoWebPPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/webp'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PNG to WebP</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PNG to WebP in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".png" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.webp" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Png To Webp</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PNG to WebP is a free online conversion tool that instantly transforms your PNG images into modern WebP format, reducing file size while maintaining quality. This tool requires no installation or registration, making it the easiest way to optimize your images for faster web performance.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Png To Webp</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PNG to WebP converter tool on your web browser</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your PNG image file from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the conversion process to complete automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted WebP file by clicking the download button</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PNG to WebP completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PNG to WebP is 100% free with no hidden charges, subscriptions, or premium features required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does the tool have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool can typically handle files up to 50MB, though this may vary. Check the specific tool page for exact limits.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will conversion affect image quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">WebP format uses advanced compression that maintains visual quality while reducing file size, often saving 25-35% space compared to PNG.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to download or install software?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, PNG to WebP is entirely web-based and works in any modern browser without requiring any downloads or installations.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>WebP images load faster on websites, improving user experience and SEO rankings due to better page speed</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch convert multiple PNG files by uploading them one at a time to save time on image optimization</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>WebP format is supported by all modern browsers including Chrome, Firefox, Edge, and Safari versions from recent years</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use converted WebP images for e-commerce products and thumbnails to reduce bandwidth costs and improve mobile loading times</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
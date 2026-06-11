'use client';
import { useState, useRef } from 'react';
export default function TiffToPngPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TIFF images to PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a TIFF file here</p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert to PNG</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download PNG</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Tiff To Png</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Tiff To Png is a free online tool that instantly converts TIFF image files to PNG format without requiring any software installation or registration. Perfect for web developers, designers, and content creators who need to transform images while maintaining quality and transparency support.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Tiff To Png</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Tiff To Png tool homepage and locate the upload area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your TIFF file into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait a few seconds for the tool to process and convert your image automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your converted PNG file to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Tiff To Png completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Tiff To Png is 100% free with no hidden fees, registration requirements, or premium upgrades needed for conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does Tiff To Png have?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports large TIFF files, typically up to 100MB, allowing you to convert high-resolution images without compression.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the conversion affect image quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Tiff To Png preserves the original image quality and supports transparency, ensuring your converted PNG looks identical to the source.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to download software to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Tiff To Png is entirely web-based and works directly in your browser on Windows, Mac, Linux, and mobile devices.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch convert multiple TIFF files by uploading them one at a time for efficient workflow management</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use PNG format for web images as it offers better compression and transparency support compared to TIFF</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check your converted PNG file dimensions before publishing to ensure it meets your project requirements</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Consider optimizing your PNG files after conversion using image compression tools for faster website loading speeds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
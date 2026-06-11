'use client';
import { useState, useRef } from 'react';
export default function JPGtoWebPPage() {
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
        <h1 className="text-3xl font-bold text-center mb-2">JPG to WebP</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JPG to WebP in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".jpg,.jpeg" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.webp" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Jpg To Webp</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Jpg To Webp is a free online converter tool that transforms JPEG images into modern WebP format with superior compression and quality. This tool helps optimize your images for faster web loading and better performance without requiring any software installation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Jpg To Webp</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Jpg To Webp tool homepage and locate the upload area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your JPG image file into the designated zone</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Select your desired quality and compression settings if available</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the convert button and download your optimized WebP file</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Jpg To Webp really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Jpg To Webp is completely free with no hidden charges, registration requirements, or watermarks added to your converted images.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limits does this tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool typically supports files up to 25-50MB depending on server capacity, allowing you to convert most standard and high-resolution images without issues.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will converting to WebP reduce image quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">WebP format uses superior compression technology, so you get significantly smaller file sizes while maintaining excellent image quality comparable to or better than JPG.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple images at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most versions of Jpg To Webp support batch conversion, allowing you to upload and convert multiple JPG files simultaneously for increased efficiency.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>WebP images are 25-35% smaller than JPG files, which significantly improves website loading speed and reduces bandwidth costs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always download and keep a backup of your original JPG file before converting, in case you need the original format later</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>WebP is supported by all modern browsers including Chrome, Firefox, Safari, and Edge, making it safe for web use</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, use WebP for photographs and complex images, while PNG works better for graphics with transparency or text</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
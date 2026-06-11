'use client';
import { useState, useRef } from 'react';
export default function ImageBlurPage() {
  const [image, setImage] = useState(null);
  const [blur, setBlur] = useState(5);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Blur</h1>
        <p className="text-neutral-500 text-center mb-8">Add blur effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Blur: {blur}px</label><input type="range" min="1" max="20" value={blur} onChange={e => setBlur(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Blur</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="blurred.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Blur</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Blur is a free online tool that allows you to quickly and easily blur any image without downloading software or creating an account. Perfect for protecting privacy, hiding sensitive information, or creating artistic effects on your photos.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Blur</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Image Blur tool website and click the 'Upload Image' button to select a photo from your computer or device.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Use the blur intensity slider to adjust how much blur you want to apply to your image, ranging from subtle to heavy blur effects.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Select the blur area by either applying blur to the entire image or using the selection tool to blur specific regions or faces.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Download' button to save your blurred image as a PNG or JPG file to your device.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Image Blur really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Image Blur is completely free with no hidden charges, registration requirements, or premium subscriptions needed to access all features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image Blur support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Blur supports all major image formats including JPG, PNG, GIF, WebP, and BMP files for uploading and downloading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded images be stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your images are processed locally in your browser and are never stored on our servers or shared with third parties.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I blur only specific parts of my image?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Image Blur offers a selection tool that lets you choose which areas of your image to blur while keeping other parts clear.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use a blur intensity of 30-50% for subtle privacy protection that maintains image quality while hiding sensitive details.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For protecting faces in group photos, use the circular selection tool to precisely target and blur individual faces without affecting the background.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different blur types like Gaussian blur for smooth effects or pixelation blur for a more dramatic appearance.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always download your blurred image before closing the browser to avoid losing your edits, as the tool doesn't save your work history.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
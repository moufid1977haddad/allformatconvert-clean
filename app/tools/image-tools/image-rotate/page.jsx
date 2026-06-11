'use client';
import { useState, useRef } from 'react';
export default function ImageRotatePage() {
  const [image, setImage] = useState(null);
  const [angle, setAngle] = useState(90);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const rotate = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const rad = angle * Math.PI / 180;
      const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
      canvas.width = img.height * sin + img.width * cos;
      canvas.height = img.height * cos + img.width * sin;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width/2, -img.height/2);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Rotate</h1>
        <p className="text-neutral-500 text-center mb-8">Rotate images by any angle</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={`px-4 py-2 rounded-lg font-semibold transition ${angle===a?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100'}`}>{a}°</button>)}</div>
          <div><label className="block text-sm text-neutral-500 mb-1">Custom angle: {angle}°</label><input type="range" min="0" max="360" value={angle} onChange={e => setAngle(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={rotate} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Rotate</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="rotated.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Rotate</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Rotate is a free online tool that allows you to quickly rotate images in any direction without downloading software or creating an account. Perfect for photographers, content creators, and anyone who needs to adjust image orientation instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Rotate</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Image Rotate website and click the upload button to select an image from your device</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your desired rotation angle using the preset options (90Â°, 180Â°, 270Â°) or enter a custom angle</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your rotated image to ensure it meets your requirements</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your rotated image to your computer in original quality</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Image Rotate really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Image Rotate is completely free with no hidden charges, registration requirements, or premium upgrades needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image Rotate support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Rotate supports all common image formats including JPG, PNG, GIF, BMP, WebP, and TIFF files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will rotating my image reduce its quality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Image Rotate maintains your original image quality and resolution when rotating, ensuring lossless output.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I rotate multiple images at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Currently, Image Rotate processes one image at a time, but you can quickly rotate multiple images by uploading them sequentially.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature before downloading to ensure the rotation angle is exactly what you need</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For landscape to portrait conversions, try 90Â° or 270Â° rotation depending on your preferred orientation</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your original image files as backups before rotating, or download rotated versions with different names</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use custom angle rotation for fine-tuning images that need slight adjustments beyond standard 90Â° increments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
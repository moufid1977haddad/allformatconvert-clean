'use client';
import { useState, useRef } from 'react';
export default function SepiaFilterPage() {
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(100);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const f = intensity / 100;
      for (let i = 0; i < data.data.length; i += 4) {
        const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
        data.data[i] = Math.min(255, r*(1-0.607*f) + g*0.769*f + b*0.189*f);
        data.data[i+1] = Math.min(255, r*0.349*f + g*(1-0.314*f) + b*0.168*f);
        data.data[i+2] = Math.min(255, r*0.272*f + g*0.534*f + b*(1-0.869*f));
      }
      ctx.putImageData(data, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Sepia Filter</h1>
        <p className="text-neutral-500 text-center mb-8">Apply sepia tone effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}%</label><input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Sepia</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="sepia.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Sepia Filter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Sepia Filter is a free online tool that instantly transforms your photos with a warm, vintage sepia tone effect. Simply upload your image and apply the classic brown-tinted filter to create nostalgic, timeless-looking pictures in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Sepia Filter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Click the upload button to select an image from your device or paste an image URL</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Preview your photo and adjust the sepia intensity using the slider to customize the effect strength</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Apply Filter' button to process your image with the sepia tone effect</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your filtered image by clicking the download button or share it directly to social media</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Sepia Filter completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Sepia Filter is 100% free. There are no hidden fees, subscriptions, or premium features required to apply sepia effects to your photos.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats are supported?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Sepia Filter supports all common image formats including JPG, PNG, GIF, WebP, and BMP. The tool automatically handles format conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my uploaded images?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your images are processed directly in your browser and are never stored on our servers. Your privacy and data security are completely protected.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I adjust the sepia filter intensity?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can customize the sepia effect with an intensity slider ranging from subtle to strong, allowing you to achieve your desired vintage look.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For best results, use high-resolution images as the sepia filter preserves image quality while adding the vintage effect</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different intensity levels to find the perfect balance between the original color and the sepia tone for your specific photo</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Sepia filters work especially well on black and white photos, landscape images, and portrait photography to enhance their vintage appeal</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save multiple versions of your sepia-filtered images with different intensity levels to compare and choose your favorite result</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
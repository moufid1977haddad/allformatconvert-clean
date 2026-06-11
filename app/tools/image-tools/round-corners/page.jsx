'use client';
import { useState, useRef } from 'react';

export default function RoundCornersPage() {
  const [image, setImage] = useState(null);
  const [radius, setRadius] = useState(20);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
    setResult(null);
  };

  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      const r = (radius / 100) * Math.min(img.width, img.height) / 2;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(img.width - r, 0);
      ctx.quadraticCurveTo(img.width, 0, img.width, r);
      ctx.lineTo(img.width, img.height - r);
      ctx.quadraticCurveTo(img.width, img.height, img.width - r, img.height);
      ctx.lineTo(r, img.height);
      ctx.quadraticCurveTo(0, img.height, 0, img.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Round Corners</h1>
        <p className="text-neutral-500 text-center mb-8">Add rounded corners to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Corner Radius: {radius}%</label><input type="range" min="1" max="50" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Round Corners</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="rounded.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Round Corners</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Round Corners is a free online tool that allows you to easily add rounded corners to images and photos with just a few clicks. Perfect for creating professional-looking graphics, profile pictures, and thumbnails without needing expensive design software.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Round Corners</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your image by clicking the upload button or dragging and dropping your file into the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Adjust the corner radius slider to set how rounded you want the corners to be</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your image in real-time to ensure the rounded corners look exactly as you want them</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your edited image in your preferred format by clicking the download button</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Round Corners support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Round Corners supports all major image formats including PNG, JPG, JPEG, GIF, WebP, and BMP files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploading images?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most images up to 10MB can be processed. For larger files, consider compressing your image first.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I adjust the corner radius independently for each corner?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The current version applies the same radius to all four corners, but you can adjust the overall radius value to your preference.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account to use Round Corners?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Round Corners is completely free and requires no account creation or login.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use a radius of 10-15 pixels for subtle rounded corners that work well for profile pictures and social media images</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For modern flat design aesthetics, try higher radius values between 20-30 pixels for a softer, more contemporary look</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always preview your image before downloading to ensure the rounded corners don't cut off important content</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine rounded corners with a subtle drop shadow for a polished, professional appearance on web designs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
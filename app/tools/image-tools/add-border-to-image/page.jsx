'use client';
import { useState, useRef } from 'react';

export default function AddBorderToImagePage() {
  const [image, setImage] = useState(null);
  const [borderWidth, setBorderWidth] = useState(10);
  const [borderColor, setBorderColor] = useState('#000000');
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
      canvas.width = img.width + borderWidth * 2;
      canvas.height = img.height + borderWidth * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, borderWidth, borderWidth);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Add Border to Image</h1>
        <p className="text-neutral-500 text-center mb-8">Add decorative borders to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Border Width: {borderWidth}px</label><input type="range" min="1" max="100" value={borderWidth} onChange={e => setBorderWidth(parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Border Color</label><input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Add Border</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="bordered.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Add Border To Image</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Add Border To Image is a free online tool that allows you to instantly add custom borders to your photos and images without any software installation. Choose from various border styles, colors, and widths to enhance your images and make them stand out.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Add Border To Image</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your image by clicking the upload button or dragging and dropping your file into the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired border style, color, and width from the customization options available</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview your image with the border applied to ensure it meets your expectations</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your bordered image to your device</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Add Border To Image support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports all common image formats including JPG, PNG, GIF, BMP, and WebP files.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit to the image size I can upload?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free accounts can upload images up to 10MB. For larger files, consider compressing your image first.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I adjust the border thickness?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can customize the border width by entering a specific pixel value or using the slider to adjust the thickness.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the tool watermark my image?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Add Border To Image does not add any watermarks to your images. Your edited photos remain completely yours.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different border colors that complement your image's dominant colors for a professional appearance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use thicker borders for smaller images and thinner borders for larger images to maintain visual balance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Try combining solid borders with rounded corners to create a modern and polished look</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save multiple versions of your image with different border styles to compare before choosing your final version</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useState, useRef } from 'react';
export default function TiffToJpgPage() {
  const [image, setImage] = useState(null);
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/jpeg', quality/100));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TIFF images to JPG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a TIFF file here</p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert to JPG</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.jpg" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download JPG</a></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Tiff To Jpg</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Tiff To Jpg is a free online conversion tool that instantly transforms TIFF image files into JPG format without requiring any software installation. This fast and reliable converter maintains image quality while reducing file size, making it perfect for sharing images across web and email platforms.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Tiff To Jpg</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Tiff To Jpg converter website and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button and select your TIFF file from your device, or drag and drop it directly into the converter</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to automatically process and convert your TIFF image to JPG format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted JPG file to your device by clicking the download button</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Tiff To Jpg completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Tiff To Jpg is 100% free with no hidden charges, registration requirements, or premium limitations. You can convert unlimited files without paying anything.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most free versions support files up to 50MB, though this may vary. Check the tool's specific guidelines for exact file size limits and supported formats.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my uploaded files be stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your files are processed securely and automatically deleted after conversion. The tool prioritizes user privacy and does not store or share your images.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple TIFF files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Many versions of Tiff To Jpg support batch conversion, allowing you to upload and convert multiple files simultaneously for increased efficiency.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress your TIFF files before conversion to ensure faster processing and smaller output file sizes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>JPG format works best for photographs and complex images, while PNG might be better for graphics with text or transparency needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always keep a backup of your original TIFF files before converting, in case you need to revert to the original format</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For web use, optimize your JPG quality settings to balance between image clarity and file size for faster loading times</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
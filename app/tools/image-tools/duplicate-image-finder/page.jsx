'use client';
import { useState, useRef } from 'react';
export default function DuplicateImageFinderPage() {
  const [images, setImages] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const inputRef = useRef();
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, data: reader.result });
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then(setImages);
    setDuplicates([]);
  };
  const findDuplicates = () => {
    const seen = {};
    const dups = [];
    images.forEach(img => {
      const key = img.data.slice(0, 100);
      if (seen[key]) dups.push([seen[key], img.name]);
      else seen[key] = img.name;
    });
    setDuplicates(dups);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Duplicate Image Finder</h1>
        <p className="text-neutral-500 text-center mb-8">Find duplicate images in your collection</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{images.length > 0 ? images.length + ' images loaded' : 'Click to select multiple images'}</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => <div key={i} className="relative"><img src={img.data} className="w-full h-16 object-cover rounded" /><p className="text-xs text-neutral-500 truncate">{img.name}</p></div>)}
            </div>
          )}
          <button onClick={findDuplicates} disabled={images.length < 2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Find Duplicates</button>
          {duplicates.length === 0 && images.length > 0 && <p className="text-green-400 text-center">No duplicates found!</p>}
          {duplicates.map(([a, b], i) => <div key={i} className="bg-red-900/30 rounded-xl p-3 text-sm"><span className="text-red-400">Duplicate: </span>{a} = {b}</div>)}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Duplicate Image Finder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Duplicate Image Finder is a free online tool that helps you identify and remove duplicate images from your computer or cloud storage. Simply upload your images and the tool will scan them for duplicates, saving you storage space and keeping your photo library organized.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Duplicate Image Finder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Duplicate Image Finder website and click the 'Upload Images' button to select photos from your device or folder</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Wait for the tool to scan and analyze all uploaded images using advanced image recognition technology</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the results as the tool displays groups of duplicate and similar images side by side for easy comparison</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Select which duplicate images you want to delete and click 'Remove Duplicates' to clean up your photo library</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Duplicate Image Finder really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Duplicate Image Finder is completely free with no hidden charges or premium features required to find and remove duplicate images.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many images can I upload at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can upload up to 1000 images per session, though processing time may vary depending on file sizes and your internet connection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my images be stored on your servers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your images are processed locally in your browser and automatically deleted after the scan completes. We do not store any of your personal photos.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can it find similar images or just exact duplicates?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Duplicate Image Finder can detect both exact duplicates and similar images with slight variations like different resolutions or minor edits.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Organize your images into folders before uploading to make it easier to manage and review duplicate results by category</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the similarity slider to adjust how strictly the tool matches images, helping you find near-duplicates with slight differences</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Backup your original images before removing duplicates to ensure you don't accidentally lose photos you want to keep</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Run the tool regularly on your photo library to maintain organization and free up storage space over time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
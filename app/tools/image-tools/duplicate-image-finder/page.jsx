'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function DuplicateImageFinderPage() {
  const [images, setImages] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    const readers = files.map(file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, data: reader.result });
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}. It may be corrupted or unreadable.`));
      reader.readAsDataURL(file);
    }));
    Promise.all(readers)
      .then(imgs => { setImages(imgs); setError(''); })
      .catch(err => setError(err.message || 'Failed to read one or more of the selected images.'));
    setDuplicates([]);
  };
  const findDuplicates = () => {
    const seen = {};
    const dups = [];
    images.forEach(img => {
      const key = img.data;
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
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => <div key={i} className="relative"><img src={img.data} className="w-full h-16 object-cover rounded" /><p className="text-xs text-neutral-500 truncate">{img.name}</p></div>)}
            </div>
          )}
          <button onClick={findDuplicates} disabled={images.length < 2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Find Duplicates</button>
          {duplicates.length === 0 && images.length > 0 && <p className="text-green-400 text-center">No duplicates found!</p>}
          {duplicates.map(([a, b], i) => <div key={i} className="bg-red-900/30 rounded-xl p-3 text-sm"><span className="text-red-400">Duplicate: </span>{a} = {b}</div>)}
        </div>
      </div>
      <SeoContent
        title="Duplicate Image Finder"
        description="Duplicate Image Finder scans a batch of images you select and flags pairs that are byte-for-byte identical, entirely in your browser — nothing is uploaded to a server. It works by comparing each image's full encoded data, so it only flags true exact duplicates and does not detect visually similar images with different resolutions or edits."
        howTo={[
          "Click the upload area and select multiple images from your device.",
          "Click 'Find Duplicates' to scan the batch.",
          "Review the list of detected duplicate pairs.",
          "Manually delete the duplicate files from your device using your file manager — the tool doesn't remove files itself."
        ]}
        faqs={[
          { q: "Is Duplicate Image Finder really free to use?", a: "Yes, it's completely free with no account required." },
          { q: "How many images can I upload at once?", a: "There's no fixed limit — you can select as many as your browser can comfortably load at once, though very large batches will take longer." },
          { q: "Will my images be stored on your servers?", a: "No, images are read and compared entirely in your browser using the File API. They are never uploaded anywhere." },
          { q: "Can it find similar images, or just exact duplicates?", a: "It only flags images whose full encoded data matches exactly, so it's reliable for catching true duplicate files without false positives. It does not use visual similarity matching, so resized, cropped, or edited copies of the same photo generally won't be flagged." }
        ]}
        tips={[
          "This tool doesn't delete anything for you — it only identifies duplicate pairs, so remove files manually afterward.",
          "For very similar-looking but non-identical photos (different resolution, slight edits), you'll need to compare them visually yourself.",
          "Back up your images before deleting anything, just in case.",
          "Run the tool again after reorganizing your photos to catch any duplicates you missed."
        ]}
      />
    </div>
  );
}
'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { sha256Hex, dHash, findPairs } from '../../../lib/imageSimilarity';
export default function DuplicateImageFinderPage() {
  const [images, setImages] = useState([]);
  const [pairs, setPairs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    setPairs(null);
    setError('');
    setImages(files.map((file) => ({ name: file.name, file, url: URL.createObjectURL(file) })));
  };
  const findDuplicates = async () => {
    setBusy(true);
    setError('');
    try {
      const unreadable = [];
      const items = [];
      for (const im of images) {
        const sha = await sha256Hex(await im.file.arrayBuffer());
        let hash = null;
        try { const bmp = await createImageBitmap(im.file); hash = dHash(bmp); bmp.close && bmp.close(); } catch { unreadable.push(im.name); }
        items.push({ name: im.name, sha, hash });
      }
      setPairs(findPairs(items));
      if (unreadable.length) setError(`This browser cannot display ${unreadable.join(', ')}: compared for exact copies only.`);
    } catch (err) {
      setError('Could not compare the images: ' + (err?.message || err));
    }
    setBusy(false);
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
              {images.map((img, i) => <div key={i} className="relative"><img src={img.url} className="w-full h-16 object-cover rounded" /><p className="text-xs text-neutral-500 truncate">{img.name}</p></div>)}
            </div>
          )}
          <button onClick={findDuplicates} disabled={images.length < 2 || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{busy ? 'Comparing…' : 'Find Duplicates'}</button>
          {pairs && pairs.length === 0 && <p className="text-green-600 text-center">No duplicates or near-duplicates among these {images.length} images.</p>}
          {pairs && pairs.map((d, i) => <div key={i} className={'rounded-xl p-3 text-sm ' + (d.kind === 'exact' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800')}><strong>{d.kind === 'exact' ? 'Identical files' : 'Same picture'}</strong>{d.kind === 'similar' ? ` (${64 - d.bits}/64 matching)` : ''}: {d.a} = {d.b}</div>)}
        </div>
      </div>
      <SeoContent
        title={"Duplicate Image Finder"}
        description={"Duplicate Image Finder compares a batch of images entirely in your browser — nothing is uploaded. It finds identical files (same SHA-256 fingerprint) and also the same picture saved differently — resized, re-compressed, converted from PNG to JPG — using a perceptual difference hash (dHash, the method of the imagehash library): two images are reported as the same picture when at most 6 of their 64 hash bits differ. Results appear only after you click Find Duplicates."}
        howTo={[
          "Click the upload area and select several images at once.",
          "Click 'Find Duplicates'.",
          "Red lines are identical files; amber lines are the same picture in another size, quality or format, with how many of the 64 hash bits match.",
          "Delete the copies you don't need from your device."
        ]}
        faqs={[
          { q: "Is Duplicate Image Finder free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it find resized or re-saved copies?", a: "Yes — besides byte-identical files, it compares a perceptual hash, so the same photo resized, re-compressed or converted to another format is reported as the same picture." },
          { q: "Can it be fooled?", a: "Heavily edited copies (cropped, rotated, filtered) may not be matched, and two very plain images (for example two blank pages) can look alike to the hash; check the thumbnails before deleting anything." },
          { q: "Are my images uploaded?", a: "No — everything is computed in your browser." }
        ]}
        tips={[
          "Compare one folder at a time for the clearest results.",
          "An amber match between two files of different sizes usually means one is a smaller copy of the other: keep the larger one."
        ]}
      />
    </div>
  );
}
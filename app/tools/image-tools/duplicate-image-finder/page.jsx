'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { sha256Hex, dHash, findPairs } from '../../../lib/imageSimilarity';
import { unreadableImageMessage, imageHeaderSize } from '../../../lib/fileChecks';
import { CANVAS_MAX_AREA } from '../../../lib/mediaSupport';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
// Beyond a canvas's largest area (268 MP) a picture is never decoded here (a 30 000 × 30 000 PNG is 3.6 GB once open):
// compared byte for byte only, and said so. Below it, a picture this browser cannot open is caught and said too.
const HUGE = CANVAS_MAX_AREA;
export default function DuplicateImageFinderPage() {
  const [images, setImages] = useState([]);
  const [pairs, setPairs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useToolError('');
  // P23: what is wrong with a file is said as soon as it is chosen (it was said only after "Find Duplicates", or
  // never: an empty file had a "fingerprint" like any other). Empty files are left out; a picture this browser cannot
  // open is still compared byte for byte.
  const [notes, setNotes] = useState([]);
  // P24 (03/10): how close two pictures must be to count as the same one (imgonline shows a similarity %; dupeGuru has a
  // filter hardness): strict 3, normal 6 (imagehash's usual), loose 10 of 64 hash bits may differ
  const [maxBits, setMaxBits] = useState(6);
  const inputRef = useRef();
  const genRef = useRef(0); // the latest selection: a slower, older one never overwrites it
  const handleFiles = async (e) => {
    const gen = ++genRef.current;
    const all = Array.from(e.target.files);
    e.target.value = '';
    setPairs(null);
    setError('');
    const files = all.filter((f) => f.size > 0);
    const found = all.filter((f) => !f.size).map((f) => `"${f.name}" is empty (0 bytes), so there is nothing to compare: it was left out.`);
    const list = [];
    for (const file of files) {
      const size = await imageHeaderSize(file);
      const huge = !!size && size.width * size.height > HUGE; // no thumbnail: a 900 MP picture would be decoded whole
      if (huge) found.push(`"${file.name}": ${await unreadableImageMessage(file)} It is compared for exact copies only.`);
      list.push({ name: file.name, file, url: huge ? null : URL.createObjectURL(file) });
    }
    if (gen !== genRef.current) return;
    setNotes(found);
    setImages(list);
  };
  const onThumbError = async (im) => {
    const gen = genRef.current;
    const why = await unreadableImageMessage(im.file);
    if (gen !== genRef.current) return;
    setNotes((n) => [...n, `"${im.name}": ${why} It is compared for exact copies only.`]);
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
        const size = await imageHeaderSize(im.file);
        if (size && size.width * size.height > HUGE) unreadable.push(im.name); // never decoded whole (900 MP = 3.6 GB)
        else try { const bmp = await createImageBitmap(im.file); hash = dHash(bmp); bmp.close && bmp.close(); } catch { unreadable.push(im.name); }
        items.push({ name: im.name, sha, hash });
      }
      setPairs(findPairs(items, maxBits));
      if (unreadable.length) setError(`This browser cannot open ${unreadable.map((n) => `"${n}"`).join(', ')} as a picture: compared for exact copies only.`);
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
            <p className="text-neutral-500">{images.length > 0 ? images.length + ' images loaded' : <UploadPrompt what="several images" />}</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {notes.map((n, i) => <p key={i} role="alert" className="text-red-400 text-center text-sm">{n}</p>)}
          {error && <p role="alert" className="text-red-400 text-center text-sm">{error}</p>}
          {images.length === 1 && <p className="text-neutral-500 text-center text-sm">Add at least one more image to compare.</p>}
          <label className="block text-sm"><span className="block text-neutral-500 mb-1">Same picture when</span>
            <select id="dup-strict" disabled={busy} value={maxBits} onChange={(e) => { setMaxBits(Number(e.target.value)); setPairs(null); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2"><option value={3}>Strict — nearly identical (61/64 matching or more)</option><option value={6}>Normal — resized or re-compressed copies (58/64)</option><option value={10}>Loose — also lightly edited copies (54/64; more false matches)</option></select></label>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => <div key={i} className="relative">{img.url ? <img src={img.url} onError={() => onThumbError(img)} className="w-full h-16 object-cover rounded" /> : <div className="w-full h-16 rounded bg-neutral-100" />}<p className="text-xs text-neutral-500 truncate">{img.name}</p></div>)}
            </div>
          )}
          <button onClick={findDuplicates} disabled={images.length < 2 || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{busy ? 'Comparing…' : 'Find Duplicates'}</button>
          {pairs && pairs.length === 0 && <p className="text-green-600 text-center">No duplicates or near-duplicates among these {images.length} images.</p>}
          {pairs && pairs.map((d, i) => <div key={i} className={'rounded-xl p-3 text-sm ' + (d.kind === 'exact' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800')}><strong>{d.kind === 'exact' ? 'Identical files' : 'Same picture'}</strong>{d.kind === 'similar' ? ` (${64 - d.bits}/64 matching)` : ''}: {d.a} = {d.b}</div>)}
        </div>
      </div>
      <SeoContent
        title={"Duplicate Image Finder"}
        description={"Duplicate Image Finder compares a batch of images entirely in your browser — nothing is uploaded. It finds identical files (same SHA-256 fingerprint) and also the same picture saved differently — resized, re-compressed, converted from PNG to JPG — using a perceptual difference hash (dHash, the method of the imagehash library): two images are reported as the same picture when at most 6 of their 64 hash bits differ (Normal), or 3 (Strict) or 10 (Loose), as you choose. Results appear only after you click Find Duplicates."}
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
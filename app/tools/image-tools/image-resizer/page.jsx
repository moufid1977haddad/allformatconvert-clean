'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkedBlob, canvasSizeProblem, flattenOntoWhite } from '../../../lib/mediaSupport';

// Modelled on the reference site (iLoveIMG "Resize image"): by pixels with the aspect ratio locked by
// default and "do not enlarge", or by percentage; the output keeps the source format (it used to always
// be PNG: a 491 KB JPEG came out as a 2.56 MB PNG -- docs/audit/RAPPORT-outils-mis-en-avant.md).
const PERCENTS = [25, 50, 75]; // "x% smaller", as on the reference site
const MIME_BY_TYPE = { 'image/jpeg': 'image/jpeg', 'image/png': 'image/png', 'image/webp': 'image/webp' };
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const fmtSize = (b) => (b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / (1024 * 1024)).toFixed(2) + ' MB');

export default function ImageResizerPage() {
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [orig, setOrig] = useState(null); // {w, h}
  const [mode, setMode] = useState('pixels');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lock, setLock] = useState(true);
  const [noEnlarge, setNoEnlarge] = useState(true);
  const [percent, setPercent] = useState(50);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    setResult(null);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { setOrig({ w: img.naturalWidth, h: img.naturalHeight }); setWidth(String(img.naturalWidth)); setHeight(String(img.naturalHeight)); setFile(f); setImage(url); };
    img.onerror = () => setError('This file could not be opened as an image.');
    img.src = url;
  };

  // Typing one side recomputes the other while the ratio is locked.
  const onWidth = (v) => { setWidth(v); if (lock && orig && Number(v) > 0) setHeight(String(Math.max(1, Math.round((Number(v) * orig.h) / orig.w)))); };
  const onHeight = (v) => { setHeight(v); if (lock && orig && Number(v) > 0) setWidth(String(Math.max(1, Math.round((Number(v) * orig.w) / orig.h)))); };

  const target = () => {
    if (!orig) return null;
    let w, h;
    if (mode === 'percent') { w = Math.max(1, Math.round((orig.w * (100 - percent)) / 100)); h = Math.max(1, Math.round((orig.h * (100 - percent)) / 100)); }
    else { w = parseInt(width, 10); h = parseInt(height, 10); }
    if (!(w > 0 && h > 0)) return null;
    if (noEnlarge && (w > orig.w || h > orig.h)) {
      const s = Math.min(orig.w / w, orig.h / h, 1);
      w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s));
    }
    return { w, h };
  };
  const dims = target();

  const resize = async () => {
    setError('');
    setResult(null);
    if (!dims) { setError('Please enter a valid width and height.'); return; }
    const sizeProblem = canvasSizeProblem(dims.w, dims.h);
    if (sizeProblem) { setError(sizeProblem); return; }
    try {
      const img = new Image();
      img.src = image;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = dims.w; canvas.height = dims.h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, dims.w, dims.h);
      let type = MIME_BY_TYPE[file.type] || 'image/png';
      let note = MIME_BY_TYPE[file.type] ? '' : 'Saved as PNG (the original format cannot be written by browsers).';
      if (type === 'image/jpeg') flattenOntoWhite(ctx, dims.w, dims.h);
      let blob;
      try {
        blob = await checkedBlob(canvas, type, type === 'image/png' ? undefined : 0.92);
      } catch (e) {
        if (type !== 'image/webp') throw e;
        type = 'image/png'; // Safari cannot encode WebP from a canvas: say so, never mislabel
        note = 'Saved as PNG: this browser cannot write WebP.';
        blob = await checkedBlob(canvas, type);
      }
      const base = file.name.replace(/\.[^.]+$/, '') || 'image';
      setResult({ url: URL.createObjectURL(blob), size: blob.size, w: dims.w, h: dims.h, name: `${base}-${dims.w}x${dims.h}.${EXT[type]}`, note });
    } catch (e) {
      setError(e.message || 'The image could not be resized.');
    }
  };

  const field = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Resizer</h1>
        <p className="text-neutral-500 text-center mb-8">Resize by pixels or percentage, proportions kept — in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} alt="" className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click to choose an image</p>}
            {orig && <p className="text-xs text-neutral-500 mt-2">{orig.w}×{orig.h} px · {fmtSize(file.size)}</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-2">
            {[['pixels', 'By pixels'], ['percent', 'By percentage']].map(([m, label]) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={'flex-1 rounded-lg py-2 text-sm font-semibold transition ' + (mode === m ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')}>{label}</button>
            ))}
          </div>
          {mode === 'pixels' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm text-neutral-600">Width (px)<input type="number" min="1" value={width} onChange={(e) => onWidth(e.target.value)} className={field} /></label>
                <label className="text-sm text-neutral-600">Height (px)<input type="number" min="1" value={height} onChange={(e) => onHeight(e.target.value)} className={field} /></label>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={lock} onChange={(e) => { setLock(e.target.checked); if (e.target.checked && orig && Number(width) > 0) setHeight(String(Math.max(1, Math.round((Number(width) * orig.h) / orig.w)))); }} />Keep proportions</label>
            </div>
          ) : (
            <div className="flex gap-2">
              {PERCENTS.map((p) => (
                <button key={p} type="button" onClick={() => setPercent(p)} className={'flex-1 rounded-lg py-2 text-sm font-semibold transition ' + (percent === p ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')}>{p}% smaller</button>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={noEnlarge} onChange={(e) => setNoEnlarge(e.target.checked)} />Do not enlarge if the image is smaller</label>
          {dims && orig && <p className="text-sm text-neutral-600 text-center">{orig.w}×{orig.h} → <span className="font-semibold">{dims.w}×{dims.h}</span> px</p>}
          <button onClick={resize} disabled={!image || !dims} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Resize</button>
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <img src={result.url} alt="Resized" className="max-h-48 mx-auto rounded" />
              <p className="text-center text-sm text-neutral-600">{result.w}×{result.h} px · {fmtSize(result.size)}{result.note ? ` · ${result.note}` : ''}</p>
              <a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image Resizer"
        description="Image Resizer changes the size of a JPG, PNG or WebP image by exact pixels or by percentage, with the proportions locked by default so nothing gets stretched, and keeps the image in its original format. Everything happens in your browser — your image is never uploaded."
        howTo={[
          'Click the upload area and choose an image.',
          "Choose 'By pixels' and type the new width (the height follows), or 'By percentage'.",
          "Click 'Resize' and check the new size.",
          'Download the resized image, in the same format as the original.'
        ]}
        faqs={[
          { q: 'Will my image be stretched?', a: "No: 'Keep proportions' is on by default, so changing the width changes the height with it. Turn it off only if you really want a different shape." },
          { q: 'What format is the result?', a: 'The same as your original: a JPG stays JPG, a PNG stays PNG (with its transparency), a WebP stays WebP. On Safari, which cannot write WebP, a WebP is saved as PNG and the page says so.' },
          { q: 'Can it enlarge an image?', a: "Yes, if you untick 'Do not enlarge'. For enlarging small photos with real detail, use our AI Image Upscaler instead." },
          { q: 'Is my image uploaded?', a: 'No. Resizing happens entirely in your browser.' }
        ]}
        tips={[
          'For a lighter file, resize first, then run the result through Image Compressor.',
          'Social media: 1080 px wide suits most feeds.',
          "Use 'By percentage' to halve a photo in one click."
        ]}
      />
    </div>
  );
}

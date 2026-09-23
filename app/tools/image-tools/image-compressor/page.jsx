'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';

const formatSize = (bytes) => (bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(2) + ' MB');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_FILES = 20;
// 78 = the setting that matches the reference site's own output on the audit photo
// (MozJPEG q78: 209.7 KB / 43.67 dB, iLoveIMG: 209.2 KB / 43.72 dB -- docs/audit/RAPPORT-ecarts-marche.md §3b).
const DEFAULT_QUALITY = 78;

export default function ImageCompressorPage() {
  const [items, setItems] = useState([]);
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const workerRef = useRef(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setError(files.length > MAX_FILES ? `Up to ${MAX_FILES} images at a time — the first ${MAX_FILES} were kept.` : '');
    setItems(files.slice(0, MAX_FILES).map((file, i) => ({ id: `${Date.now()}-${i}`, file, preview: URL.createObjectURL(file), status: 'ready' })));
  };

  const update = (id, patch) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const runOne = (worker, it) => new Promise((resolve) => {
    const onMessage = (e) => {
      const m = e.data;
      if (m.id !== it.id) return;
      if (m.type === 'progress') { update(it.id, { pct: m.pct }); return; }
      worker.removeEventListener('message', onMessage);
      if (m.type === 'error') { update(it.id, { status: 'error', message: m.message }); return resolve(); }
      // Never hand over a "compressed" file that is not smaller than what the visitor brought.
      if (m.blob.size >= it.file.size) {
        update(it.id, { status: 'notSmaller', outSize: m.blob.size });
        return resolve();
      }
      const base = it.file.name.replace(/\.[^.]+$/, '') || 'image';
      update(it.id, { status: 'done', url: URL.createObjectURL(m.blob), blob: m.blob, outSize: m.blob.size, note: m.note, name: `${base}-compressed.${EXT[m.blob.type] || 'jpg'}` });
      resolve();
    };
    worker.addEventListener('message', onMessage);
    update(it.id, { status: 'working', pct: 0 });
    worker.postMessage({ id: it.id, file: it.file, quality });
  });

  const compressAll = async () => {
    if (!items.length) return;
    setBusy(true);
    setError('');
    workerRef.current?.terminate();
    const worker = new Worker(new URL('./compress.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onerror = (err) => setError('The compression engine stopped: ' + (err?.message || 'unknown error'));
    for (const it of items) await runOne(worker, it);
    setBusy(false);
  };

  const done = items.filter((it) => it.status === 'done');
  const downloadZip = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const used = new Set();
    for (const it of done) {
      let name = it.name, n = 1;
      while (used.has(name)) name = it.name.replace(/(\.[^.]+)$/, `-${++n}$1`);
      used.add(name);
      zip.file(name, it.blob);
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'compressed-images.zip';
    a.click();
  };

  const totalIn = done.reduce((s, it) => s + it.file.size, 0);
  const totalOut = done.reduce((s, it) => s + it.outSize, 0);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress JPG, PNG and WebP in your browser — the format is kept, your images never leave your device</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !busy && inputRef.current.click()}>
            <p className="text-neutral-500">{items.length ? `${items.length} image${items.length > 1 ? 's' : ''} selected — click to choose others` : `Click to choose images (up to ${MAX_FILES})`}</p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple className="hidden" onChange={handleFiles} disabled={busy} />
          </div>
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          <div>
            <label htmlFor="quality" className="block text-sm text-neutral-600 mb-1">Quality: {quality}%{quality === 100 ? ' (PNG: lossless)' : ''}</label>
            <input id="quality" type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value, 10))} className="w-full" disabled={busy} />
            <p className="text-xs text-neutral-500 mt-1">Lower = smaller file. {DEFAULT_QUALITY}% is our recommended balance.</p>
          </div>
          <button onClick={compressAll} disabled={!items.length || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {busy ? 'Compressing…' : `Compress ${items.length > 1 ? `${items.length} images` : 'image'}`}
          </button>
          {items.length > 0 && (
            <ul className="divide-y divide-neutral-200">
              {items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  <img src={it.preview} alt="" className="w-14 h-14 object-cover rounded" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="truncate font-medium text-neutral-800">{it.file.name}</p>
                    {it.status === 'ready' && <p className="text-neutral-500">{formatSize(it.file.size)}</p>}
                    {it.status === 'working' && <p className="text-neutral-500">Compressing… {Math.round(it.pct || 0)}%</p>}
                    {it.status === 'done' && (
                      <p className="text-neutral-600">{formatSize(it.file.size)} → <span className="font-semibold text-indigo-600">{formatSize(it.outSize)}</span> <span className="text-green-700 font-semibold">(−{Math.round((1 - it.outSize / it.file.size) * 100)}%)</span>{it.note ? <span className="text-neutral-500"> · {it.note}</span> : null}</p>
                    )}
                    {it.status === 'notSmaller' && <p className="text-amber-800">Already well compressed: at {quality}% the result would be {formatSize(it.outSize)}, not smaller than {formatSize(it.file.size)}. Nothing to download — lower the quality to shrink it further.</p>}
                    {it.status === 'error' && <p className="text-red-600">{it.message}</p>}
                  </div>
                  {it.status === 'done' && <a href={it.url} download={it.name} className="shrink-0 bg-green-600 hover:bg-green-500 text-white rounded-lg px-3 py-1.5 text-sm font-semibold">Download</a>}
                </li>
              ))}
            </ul>
          )}
          {done.length > 1 && !busy && (
            <div className="text-center space-y-2">
              <p className="text-sm text-neutral-600">{formatSize(totalIn)} → <span className="font-semibold text-indigo-600">{formatSize(totalOut)}</span> in total (−{Math.round((1 - totalOut / totalIn) * 100)}%)</p>
              <button onClick={downloadZip} className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 py-2 font-semibold transition">Download all (ZIP)</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image Compressor"
        description="Image Compressor shrinks JPG, PNG and WebP images entirely in your browser — your images are never uploaded. JPGs are re-encoded with MozJPEG, the encoder behind the best online compressors; PNGs stay PNG with their transparency, reduced to the smallest colour palette that keeps the quality you chose; WebPs stay WebP. In our tests on a real photo, the default setting produced a file the same size and quality as the leading online compressor's."
        howTo={[
          `Click the upload area and choose one or more images (up to ${MAX_FILES}).`,
          `Set the quality slider — ${DEFAULT_QUALITY}% is the recommended balance; 100% makes PNGs lossless.`,
          "Click 'Compress' and watch each image's before/after size.",
          "Download each image, or all of them at once as a ZIP."
        ]}
        faqs={[
          { q: "Is Image Compressor free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Which formats does it compress?", a: "JPG, PNG and WebP, each kept in its own format. Other images your browser can open (BMP, static GIF, AVIF…) are converted to JPG, on a white background. For animated GIFs, use our GIF Compressor, which keeps the animation." },
          { q: "Will compression affect image quality?", a: "Below 100%, yes, a little: that is how the file gets smaller. At the default setting the difference is hard to see on a photo. For PNGs, 100% is fully lossless; if no palette can keep the quality you chose, the PNG is repacked losslessly instead." },
          { q: "Does it keep transparency?", a: "Yes for PNG and WebP. Transparent areas of other formats become white, since they are saved as JPG." },
          { q: "Can I compress multiple images at once?", a: `Yes, up to ${MAX_FILES} at a time, then download them one by one or together as a ZIP.` },
          { q: "Are my images uploaded?", a: "No. Everything runs in your browser, in a background worker; your images never leave your device." }
        ]}
        tips={[
          "If an image is already heavily compressed, the tool tells you instead of handing back a larger file.",
          "Photos shrink the most as JPG; logos, screenshots and graphics with few colours shrink the most as PNG.",
          "Phone photos keep their orientation, and their location and camera details (EXIF) are removed.",
          "Keep your original file as a backup in case you need the full-quality version later."
        ]}
      />
    </div>
  );
}

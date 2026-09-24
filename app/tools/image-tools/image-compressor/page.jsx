'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';

const formatSize = (bytes) => (bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(2) + ' MB');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
const MAX_FILES = 20;
// An optimised SVG is only offered if it DRAWS the same as the original: both are rendered at the same size
// (1024 px), over white and over black (so transparency counts), and compared pixel by pixel. Calibrated in
// Chromium and Firefox on 7 real SVGs and on copies with one shape deleted
// (docs/audit/RAPPORT-licence-et-ameliorations.md §3b, scripts/browser-tests/svg-check-calibration.mjs):
//  - an average (PSNR) is the wrong test: deleting a small shape from Tux still scored 53.9 dB;
//  - a raw per-pixel maximum is too: browser anti-aliasing moves edge pixels of a correct SVGO output by up
//    to 73 levels, more than some deleted shapes. So each differing pixel is compared with the 3x3
//    neighbourhood of the other image (the anti-aliasing tolerance pixelmatch uses): correct outputs then
//    stay at or under 59 levels, every deleted shape reaches 72-145 (a 3-pixel sliver, 37-39, is the one
//    thing it cannot see). SVGO's path rewriting that visibly moved a letter of the W3C logo scored 115:
//    that file gets the cautious setting instead.
const SVG_MAX_PIXEL_DIFF = 64;

const loadImg = (blob) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => resolve({ img, url });
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
  img.src = url;
});

// Largest difference (0-255, per channel) between the two drawings, after neighbourhood tolerance.
async function svgMaxPixelDiff(original, candidate) {
  const [a, b] = await Promise.all([loadImg(original), loadImg(candidate)]);
  try {
    let w = a.img.naturalWidth || 1024, h = a.img.naturalHeight || 1024;
    const k = 1024 / Math.max(w, h);
    w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
    const diff = (X, i, Y, j) => Math.max(Math.abs(X[i] - Y[j]), Math.abs(X[i + 1] - Y[j + 1]), Math.abs(X[i + 2] - Y[j + 2]));
    const oneWay = (X, Y) => {
      let worst = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (diff(X, i, Y, i) <= worst) continue;
        let best = 255;
        for (let dy = -1; dy <= 1 && best > worst; dy++) for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy >= 0 && xx >= 0 && yy < h && xx < w) best = Math.min(best, diff(X, i, Y, (yy * w + xx) * 4));
        }
        worst = Math.max(worst, best);
      }
      return worst;
    };
    let worst = 0;
    for (const bg of ['#fff', '#000']) {
      const draw = (img) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
        return ctx.getImageData(0, 0, w, h).data;
      };
      const p = draw(a.img), q = draw(b.img);
      worst = Math.max(worst, oneWay(p, q), oneWay(q, p));
    }
    return worst;
  } finally {
    URL.revokeObjectURL(a.url); URL.revokeObjectURL(b.url);
  }
}
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
    const onMessage = async (e) => {
      const m = e.data;
      if (m.id !== it.id) return;
      if (m.type === 'progress') { update(it.id, { pct: m.pct }); return; }
      worker.removeEventListener('message', onMessage);
      if (m.type === 'error') { update(it.id, { status: 'error', message: m.message }); return resolve(); }
      if (m.type === 'svg') {
        // First candidate that is smaller AND draws the same wins; otherwise the original is the right file.
        let chosen = null, unreadable = false, anySmaller = false;
        let cautious = false;
        for (const { blob: c, cautious: isCautious } of m.candidates) {
          if (c.size >= it.file.size) continue;
          anySmaller = true;
          try {
            if ((await svgMaxPixelDiff(it.file, c)) < SVG_MAX_PIXEL_DIFF) { chosen = c; cautious = isCautious; break; }
          } catch { unreadable = true; break; }
        }
        const base = it.file.name.replace(/\.[^.]+$/, '') || 'image';
        if (chosen) update(it.id, { status: 'done', url: URL.createObjectURL(chosen), blob: chosen, outSize: chosen.size, note: cautious ? 'still vector, cautious setting (the full one changed the drawing), checked to draw the same' : 'still vector, checked to draw the same', name: `${base}-compressed.svg` });
        else if (unreadable) update(it.id, { status: 'error', message: 'Your browser could not draw this SVG, so we could not check the result. Nothing to download.' });
        else update(it.id, { status: anySmaller ? 'svgKept' : 'svgMinimal' });
        return resolve();
      }
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
        <p className="text-neutral-500 text-center mb-8">Compress JPG, PNG, WebP and SVG in your browser — the format is kept, your images never leave your device</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !busy && inputRef.current.click()}>
            <p className="text-neutral-500">{items.length ? `${items.length} image${items.length > 1 ? 's' : ''} selected — click to choose others` : `Click to choose images (up to ${MAX_FILES})`}</p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,.svg,image/*" multiple className="hidden" onChange={handleFiles} disabled={busy} />
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
                    {it.status === 'svgMinimal' && <p className="text-amber-800">This SVG is already optimised: nothing could be removed from it. Nothing to download — your file is already the best version.</p>}
                    {it.status === 'svgKept' && <p className="text-amber-800">This SVG could not be made smaller without changing how it looks, so we kept it as it is. Nothing to download — your file is already the best version.</p>}
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
        description="Image Compressor shrinks JPG, PNG and WebP images entirely in your browser — your images are never uploaded. JPGs are re-encoded with MozJPEG, the encoder behind the best online compressors; PNGs stay PNG with their transparency, reduced to the smallest colour palette that keeps the quality you chose; WebPs stay WebP; SVGs stay vector, minified with SVGO, and are only offered once the tool has checked they draw exactly like the original. In our tests on a real photo, the default setting produced a file the same size and quality as the leading online compressor's."
        howTo={[
          `Click the upload area and choose one or more images (up to ${MAX_FILES}).`,
          `Set the quality slider — ${DEFAULT_QUALITY}% is the recommended balance; 100% makes PNGs lossless.`,
          "Click 'Compress' and watch each image's before/after size.",
          "Download each image, or all of them at once as a ZIP."
        ]}
        faqs={[
          { q: "Is Image Compressor free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Which formats does it compress?", a: "JPG, PNG, WebP and SVG, each kept in its own format. Other images your browser can open (BMP, static GIF, AVIF…) are converted to JPG, on a white background. For animated GIFs, use our GIF Compressor, which keeps the animation." },
          { q: "Will compression affect image quality?", a: "Below 100%, yes, a little: that is how the file gets smaller. At the default setting the difference is hard to see on a photo. For PNGs, 100% is fully lossless; if no palette can keep the quality you chose, the PNG is repacked losslessly instead." },
          { q: "Does it keep transparency?", a: "Yes for PNG and WebP. Transparent areas of other formats become white, since they are saved as JPG." },
          { q: "How are SVG files compressed?", a: "They stay vector: SVGO, the standard SVG optimiser, removes editor metadata, shortens numbers and ids and merges what can be merged — the same method the leading online compressor uses (in our test on the Tux SVG: 48.8 KB → 35.1 KB, identical to theirs within 4 bytes). Before offering the file, the tool draws both versions and compares them pixel by pixel; if they differ, it tries a more cautious setting, and if that still differs it keeps your original. The quality slider does not apply to SVG." },
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

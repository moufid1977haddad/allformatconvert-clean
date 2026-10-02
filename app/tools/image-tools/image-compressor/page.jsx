'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import IosOriginalNote from '../../../components/IosOriginalNote';
import { formatBytes } from '../../../lib/formatBytes';
import { imageDims } from '../../../lib/bigImage';
import { imageHeaderSize } from '../../../lib/fileChecks';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';

const formatSize = formatBytes;
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif' };
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
  // P24 (03/10): compress to a target size (KB) instead of a quality
  const [byTarget, setByTarget] = useState(false);
  const [targetKb, setTargetKb] = useState('100');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useToolError('');
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

  // P23 (02/10): a 20 000 × 20 000 PNG (400 MP, 49 KB on disk) kept "Compressing…" for ever (the PNG optimiser on 1.6 GB
  // of pixels). The size is read from the header first: at most a canvas's largest area, 268 MP, on every device (a
  // 200 MP Android photo or a 63 MP iPhone panorama still passes — a lower phone bound was not measured for this tool).
  const UNREADABLE = 'This file could not be read: it may have been moved or changed since you chose it. Choose it again.';
  const runOne = async (worker, it) => {
    let size = null;
    try { size = await imageHeaderSize(it.file); } catch { update(it.id, { status: 'error', message: UNREADABLE }); return; }
    const mp = size ? (size.width * size.height) / 1e6 : 0;
    if (mp > 268) {
      update(it.id, { status: 'error', message: `This image is ${size.width.toLocaleString('en-US')} × ${size.height.toLocaleString('en-US')} pixels (${Math.round(mp)} megapixels), more than the 268-megapixel limit of a browser canvas. Use a smaller version of the image.` });
      return;
    }
    return runInWorker(worker, it);
  };
  const runInWorker = (worker, it) => new Promise((resolve) => {
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
    // the settings this image was made with: the messages below quote them, not the fields as they are now (P24 review)
    update(it.id, { status: 'working', pct: 0, sentTargetKb: byTarget ? Number(targetKb) : null, sentQuality: quality });
    // __forceBands: set only by the browser tests, to run the iPhone (band) decode in Firefox.
    imageDims(it.file).then((dims) => worker.postMessage({ id: it.id, file: it.file, quality, dims, forceBands: !!window.__forceBands, canvasCap: window.__forceSafariCanvasCap === true, targetBytes: byTarget && Number(targetKb) > 0 ? Math.round(Number(targetKb) * 1024) : 0 }))
      .catch(() => { worker.removeEventListener('message', onMessage); update(it.id, { status: 'error', message: UNREADABLE }); resolve(); });
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

  const totalIn = done.reduce((s, it) => s + it.file.size, 0);
  const totalOut = done.reduce((s, it) => s + it.outSize, 0);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress JPG, PNG, WebP, AVIF and SVG in your browser — the format is kept, your images never leave your device</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote kind="photo" />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !busy && inputRef.current.click()}>
            <p className="text-neutral-500">{items.length ? `${items.length} image${items.length > 1 ? 's' : ''} selected — click to choose others` : `Click to choose images (up to ${MAX_FILES})`}</p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,.avif,image/svg+xml,.svg,image/*" multiple className="hidden" onChange={handleFiles} disabled={busy} />
          </div>
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2 text-sm text-neutral-700">
              <label className="flex items-center gap-1"><input type="radio" name="ic-mode" checked={!byTarget} onChange={() => setByTarget(false)} disabled={busy} /> By quality</label>
              <label className="flex items-center gap-1"><input id="ic-target-mode" type="radio" name="ic-mode" checked={byTarget} onChange={() => setByTarget(true)} disabled={busy} /> To a size of</label>
              <input id="ic-target-kb" type="number" min="5" step="5" value={targetKb} onChange={(e) => setTargetKb(e.target.value)} disabled={busy || !byTarget} className="w-24 border border-neutral-200 rounded px-2 py-1" aria-label="Target size in KB" /> KB
            </div>
            <label htmlFor="quality" className="block text-sm text-neutral-600 mb-1">Quality: {quality}%{quality === 100 ? ' (PNG: lossless)' : ''}{byTarget ? ' (used for PNG only)' : ''}</label>
            <input id="quality" type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value, 10))} className="w-full" disabled={busy} />
            <p className="text-xs text-neutral-500 mt-1">Lower = smaller file. {DEFAULT_QUALITY}% is our recommended balance.</p>
          </div>
          <button onClick={compressAll} disabled={!items.length || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {busy ? 'Compressing…' : `Compress ${items.length > 1 ? `${items.length} images` : 'image'}`}
          </button>
          {items.length > 0 && (
            <DownloadGroup zipName="compressed-images.zip">
            <ul className="divide-y divide-neutral-200">
              {items.map((it) => (
                <li key={it.id} className="py-3 space-y-2">
                  <div className="flex items-center gap-3">
                  <img src={it.preview} alt="" className="w-14 h-14 object-cover rounded" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="truncate font-medium text-neutral-800">{it.file.name}</p>
                    {it.status === 'ready' && <p className="text-neutral-500">{formatSize(it.file.size)}</p>}
                    {it.status === 'working' && <p className="text-neutral-500">Compressing… {Math.round(it.pct || 0)}%</p>}
                    {it.status === 'done' && (
                      <p className="text-neutral-600">{formatSize(it.file.size)} → <span className="font-semibold text-indigo-600">{formatSize(it.outSize)}</span> <span className="text-green-700 font-semibold">(−{Math.round((1 - it.outSize / it.file.size) * 100)}%)</span>{it.note ? <span className="text-neutral-500"> · {it.note}</span> : null}</p>
                    )}
                    {it.status === 'notSmaller' && it.sentTargetKb && it.file.size <= it.sentTargetKb * 1024 && <p className="text-amber-800" data-under-target>This image is already {formatSize(it.file.size)}, under the {it.sentTargetKb} KB asked: nothing to compress.</p>}
                    {it.status === 'notSmaller' && !(it.sentTargetKb && it.file.size <= it.sentTargetKb * 1024) && <p className="text-amber-800">Already well compressed: at {it.sentQuality ?? quality}% the result would be {formatSize(it.outSize)}, not smaller than {formatSize(it.file.size)}. Nothing to download — lower the quality to shrink it further.</p>}
                    {it.status === 'svgMinimal' && <p className="text-amber-800">This SVG is already optimised: nothing could be removed from it. Nothing to download — your file is already the best version.</p>}
                    {it.status === 'svgKept' && <p className="text-amber-800">This SVG could not be made smaller without changing how it looks, so we kept it as it is. Nothing to download — your file is already the best version.</p>}
                    {it.status === 'error' && <p className="text-red-600">{it.message}</p>}
                  </div>
                  </div>
                  {it.status === 'done' && <FileDownload href={it.url} blob={it.blob} name={it.name} />}
                </li>
              ))}
            </ul>
            </DownloadGroup>
          )}
          {done.length > 1 && !busy && (
            <div className="text-center space-y-2">
              <p className="text-sm text-neutral-600">{formatSize(totalIn)} → <span className="font-semibold text-indigo-600">{formatSize(totalOut)}</span> in total (−{Math.round((1 - totalOut / totalIn) * 100)}%)</p>
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
          { q: "Which formats does it compress?", a: "JPG, PNG, WebP, AVIF and SVG, each kept in its own format. Other images your browser can open (BMP, a still GIF…) are converted to JPG, on a white background, and the result says so. An animated GIF is not turned into a still picture: the page sends you to our GIF Compressor, which keeps the animation." },
          { q: "Will compression affect image quality?", a: "Below 100%, yes, a little: that is how the file gets smaller. At the default setting the difference is hard to see on a photo. For PNGs, 100% is fully lossless; if no palette can keep the quality you chose, the PNG is repacked losslessly instead." },
          { q: "Does it keep transparency?", a: "Yes for PNG and WebP. Transparent areas of other formats become white, since they are saved as JPG." },
          { q: "Can I compress an image to a given size, like 100 KB?", a: "Yes, for JPG, WebP and AVIF: choose 'To a size of' and type the size. The highest quality that fits is found automatically. The picture keeps its dimensions: if even the lowest quality is too big, the page says so and you can make it smaller first with Image Resizer. A PNG is compressed at the quality you set." },
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

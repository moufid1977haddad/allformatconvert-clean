'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import IosOriginalNote from '../../../components/IosOriginalNote';
import { formatBytes } from '../../../lib/formatBytes';
import { imageDims } from '../../../lib/bigImage';
import { imageHeaderSize } from '../../../lib/fileChecks';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { reducedSize, PHONE_MAX_MP, PHONE_REDUCE_MP, overPhoneBound } from '../../../lib/reduceImage';

// P27 (phase 7): a phone bound, measured. Memory this page needs (peak of the tab, Chromium, scripts/p27/
// phone-bound-memory.mjs, a noisy photo-like 24 MP JPEG scaled up): 24 MP 0.86 GB, 48 MP 1.4 GB, 100 MP 2.4 GB -- about 22-30 MB per megapixel.
// A phone browser reloads a tab far below a computer (iOS Safari around 1.5-2 GB on recent iPhones, Android Chrome
// in the same range on a 4 GB phone): 50 MP keeps a 48 MP iPhone or 50 MP Android photo working and stops the
// 108 / 200 MP ones, which would end in a reloaded page instead of a message. Computers: MAX_MP below.
// P33 (05/10): 48 MP, the site's one phone number (lib/reduceImage.js PHONE_MAX_MP / PHONE_MAX_PIXELS): the bound is the
// pixel count of the owner's 48 MP iPhone photo (8064 × 6048 = 48.77 MP, the one size proven on a real iPhone), so that
// photo passes with no word; the page said 50 while it reduced to 48. PHONE_MAX_MP and PHONE_REDUCE_MP come from there.
// Computers: measured (P27) on the same images, the JPEG engine (mozjpeg in WebAssembly, 2 GB of memory at most) compresses
// 140 MP and runs out of memory at 150 MP -- its worker then died without a word and the page said "Compressing… 5%"
// for ever. The bound is declared before the work, and a watchdog (below) turns any silent stop into a message.
const MAX_MP = 140;
// P32 (04/10): what "Reduce to … MP then compress" makes on a phone. The encoder's memory grows with the pixels (MozJPEG,
// measured in Node: 4.0 × the RGBA size; tab peaks: scripts/p32/compressor-peak-memory.mjs), and the one size proven on the owner's iPhone is
// a 48 MP photo (8064 × 6048 = 48.8 MP, compressed fine). 50 MP would need 2-3 % more than that proof; 48 MP needs less,
// so the reduced panorama is never heavier than a photo the phone is known to handle. Computers: reduced to MAX_MP.
// A fresh worker for any image over this (the iPhone canvas limit): the previous image's encoder memory goes with the
// old worker instead of adding to the next one's.
const FRESH_WORKER_MP = 16.7;

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
  const stalledRef = useRef(false);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setError(files.length > MAX_FILES ? `Up to ${MAX_FILES} images at a time — the first ${MAX_FILES} were kept.` : '');
    const list = files.slice(0, MAX_FILES).map((file, i) => ({ id: `${Date.now()}-${i}`, file, preview: URL.createObjectURL(file), status: 'ready' }));
    setItems(list);
    // P31 (03/10): the size is read from the file's header as soon as it is chosen (no decoding), so an image over
    // the bound is said BEFORE the Compress button — the owner's 63 MP iPhone panorama was "1 image selected" with no
    // word until then.
    for (const it of list) {
      imageHeaderSize(it.file).then((size) => { if (size) update(it.id, { size }); }).catch(() => {});
    }
  };
  const overBound = (w, h) => (isMobileDevice() ? overPhoneBound(w, h) : (w * h) / 1e6 > MAX_MP);
  const reduceMp = () => (isMobileDevice() ? PHONE_REDUCE_MP : MAX_MP);
  const overLimit = items.filter((it) => it.size && it.status === 'ready' && overBound(it.size.width, it.size.height));

  // P31: "Reduce to … MP then compress", in one gesture (the market's resize-then-compress, e.g. iLoveIMG's two
  // tools, in one step here). P32 (04/10): each image over the bound is reduced INSIDE the compressor's worker, its
  // pixels handed straight to the encoder (lib/reduceImage.js) -- the page no longer encodes an intermediate JPEG.
  const reduceThenCompress = async () => {
    const target = reduceMp();
    const list = items.filter((it) => it.status === 'ready').map((it) => {
      if (!(it.size && overBound(it.size.width, it.size.height))) return it;
      update(it.id, { reduceMp: target });
      return { ...it, reduceMp: target };
    });
    await compressAll(list);
  };

  const update = (id, patch) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  // P23 (02/10): a 20 000 × 20 000 PNG (400 MP, 49 KB on disk) kept "Compressing…" for ever (the PNG optimiser on 1.6 GB
  // of pixels). The size is read from the header first: at most MAX_MP (measured, P27) on a computer; on a
  // phone PHONE_MAX_MP (P27, measured above; a 63 MP iPhone panorama is above it -- to recheck on a real iPhone).
  const UNREADABLE = 'This file could not be read: it may have been moved or changed since you chose it. Choose it again.';
  const runOne = async (worker, it) => {
    let size = null;
    try { size = await imageHeaderSize(it.file); } catch { update(it.id, { status: 'error', message: UNREADABLE }); return; }
    const mp = size ? (size.width * size.height) / 1e6 : 0;
    // an image the visitor chose to reduce is compressed at its reduced size (the worker reduces it first)
    if (it.reduceMp) return runInWorker(worker, it, mp);
    if (mp > MAX_MP) {
      update(it.id, { status: 'error', message: `This image is ${size.width.toLocaleString('en-US')} × ${size.height.toLocaleString('en-US')} pixels (${Math.round(mp)} megapixels), more than the ${MAX_MP} megapixels this in-browser compressor can hold in memory. Use a smaller version of the image.` });
      return;
    }
    if (isMobileDevice() && overPhoneBound(size.width, size.height)) {
      update(it.id, { status: 'error', message: `This image is ${Math.round(mp)} megapixels: on a phone or tablet the limit is ${PHONE_MAX_MP} megapixels, because compressing it would need more memory than a phone browser gives a page (it would reload). Use a computer, or a smaller version of the image.` });
      return;
    }
    return runInWorker(worker, it, mp);
  };
  // P27: a worker that dies (out of memory inside the image engine) sends nothing; without an answer within a generous
  // time for the image's size (measured: 100 MP in 20 s on a computer), the image is reported, the worker replaced.
  const runInWorker = (worker, it, mp = 0) => new Promise((resolve) => {
    let watchdog = null;
    const arm = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        worker.removeEventListener('message', onMessage);
        update(it.id, { status: 'error', message: 'The compression stopped on this image without an answer (usually: an image too large for the memory this browser gives a page). Nothing was produced. Try a smaller version of the image.' });
        stalledRef.current = true;
        resolve();
      }, 60_000 + Math.round(mp * 1500));
    };
    const onMessage = async (e) => {
      const m = e.data;
      if (m.id !== it.id) return;
      if (m.type === 'progress') { arm(); update(it.id, { pct: m.pct, status: m.phase === 'reduce' ? 'reducing' : 'working' }); return; }
      clearTimeout(watchdog);
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
      if (m.blob.size >= it.file.size) { // never larger than what the visitor brought
        update(it.id, { status: 'notSmaller', outSize: m.blob.size });
        return resolve();
      }
      const base = it.file.name.replace(/\.[^.]+$/, '') || 'image';
      update(it.id, { status: 'done', url: URL.createObjectURL(m.blob), blob: m.blob, outSize: m.blob.size, ...(reduceTo ? { size: reduceTo, reducedFrom } : {}), note: [reduceTo ? `reduced from ${reducedFrom.width} × ${reducedFrom.height} to ${reduceTo.width} × ${reduceTo.height}` : '', m.note].filter(Boolean).join(' · '), name: `${base}-compressed.${EXT[m.blob.type] || 'jpg'}` });
      resolve();
    };
    worker.addEventListener('message', onMessage);
    arm();
    // the settings this image was made with: the messages below quote them, not the fields as they are now (P24 review)
    let reduceTo = null, reducedFrom = null;
    update(it.id, { status: it.reduceMp ? 'reducing' : 'working', pct: 0, sentTargetKb: byTarget ? Number(targetKb) : null, sentQuality: quality });
    // __forceBands: set only by the browser tests, to run the iPhone (band) decode in Firefox.
    imageDims(it.file).then((dims) => {
      if (it.reduceMp) {
        // the reduced shape follows the size as displayed (EXIF rotation applied), which the band reader works in
        if (!dims) throw new Error('unreadable');
        reduceTo = reducedSize(dims.width, dims.height, it.reduceMp);
        reducedFrom = dims;
      }
      worker.postMessage({ id: it.id, file: it.file, quality, dims, reduceTo, forceBands: !!window.__forceBands, canvasCap: window.__forceSafariCanvasCap === true, targetBytes: byTarget && Number(targetKb) > 0 ? Math.round(Number(targetKb) * 1024) : 0 });
    })
      .catch(() => { clearTimeout(watchdog); worker.removeEventListener('message', onMessage); update(it.id, { status: 'error', message: UNREADABLE }); resolve(); });
  });

  const compressAll = async (only) => {
    const list = Array.isArray(only) ? only : items;
    if (!list.length) return;
    setBusy(true);
    setError('');
    const start = () => {
      workerRef.current?.terminate();
      const w = new Worker(new URL('./compress.worker.js', import.meta.url), { type: 'module' });
      workerRef.current = w;
      w.onerror = (err) => setError('The compression engine stopped: ' + (err?.message || 'unknown error'));
      return w;
    };
    let worker = start(), used = false;
    for (const it of list) {
      // P32: a large image starts in a fresh worker, so the encoder memory of the image before it is given back first
      // (a worker's WebAssembly memory only grows; on a phone two large images' worth would not fit)
      if (used && (it.reduceMp || (it.size && (it.size.width * it.size.height) / 1e6 > FRESH_WORKER_MP))) worker = start();
      used = true;
      await runOne(worker, it);
      // a stalled worker is replaced before the next image (its memory goes with it)
      if (stalledRef.current) { stalledRef.current = false; worker = start(); }
    }
    setBusy(false);
  };

  const done = items.filter((it) => it.status === 'done');

  const totalIn = done.reduce((s, it) => s + it.file.size, 0);
  const totalOut = done.reduce((s, it) => s + it.outSize, 0);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Compressor</h1>
        <p className="text-neutral-500 text-center mb-2">Compress JPG, PNG, WebP, AVIF and SVG in your browser — the format is kept, your images never leave your device</p>
        <p className="text-neutral-500 text-xs text-center mb-8">Up to {MAX_FILES} images at a time, each up to {MAX_MP} megapixels on a computer and {PHONE_MAX_MP} on a phone or tablet (48 MP phone photos fit; a larger image can be reduced to {PHONE_REDUCE_MP} MP first).</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <IosOriginalNote kind="photo" />
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !busy && inputRef.current.click()}>
            <p className="text-neutral-500">{items.length ? `${items.length} image${items.length > 1 ? 's' : ''} selected — click to choose others` : <><UploadPrompt what="images" /> (up to {MAX_FILES})</>}</p>
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
          {overLimit.length > 0 && !busy && (
            <div role="alert" data-over-limit className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
              {overLimit.map((it) => {
                const mp = (it.size.width * it.size.height) / 1e6, r = reducedSize(it.size.width, it.size.height, reduceMp());
                return <p key={it.id}><span className="font-semibold break-all">{it.file.name}</span> is {it.size.width.toLocaleString('en-US')} × {it.size.height.toLocaleString('en-US')} pixels ({Math.round(mp)} megapixels): {isMobileDevice() ? `on a phone or tablet the limit is ${PHONE_MAX_MP} megapixels, because compressing more would need more memory than a phone browser gives a page.` : `more than the ${MAX_MP} megapixels this in-browser compressor can hold in memory.`} It can be reduced to {r.width.toLocaleString('en-US')} × {r.height.toLocaleString('en-US')} ({Math.round((r.width * r.height) / 1e6 * 10) / 10} MP{isMobileDevice() ? ', the size of a 48 MP phone photo' : ''}) first.</p>;
              })}
              <button type="button" onClick={reduceThenCompress} data-reduce-then-compress className="w-full min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2">
                Reduce to {reduceMp()} MP then compress
              </button>
            </div>
          )}
          <button onClick={() => compressAll()} disabled={!items.length || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
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
                    {it.status === 'ready' && <p className="text-neutral-500">{formatSize(it.file.size)}{it.size ? ` · ${it.size.width} × ${it.size.height}` : ''}{it.reducedFrom ? ` (reduced from ${it.reducedFrom.width} × ${it.reducedFrom.height})` : ''}</p>}
                    {it.status === 'reducing' && <p className="text-neutral-500">Reducing to {it.reduceMp || reduceMp()} MP… {Math.round(it.pct || 0)}%</p>}
                    {it.status === 'working' && <p className="text-neutral-500">Compressing… {Math.round(it.pct || 0)}%</p>}
                    {it.status === 'done' && (
                      <p className="text-neutral-600">{formatSize(it.file.size)} → <span className="font-semibold text-indigo-600">{formatSize(it.outSize)}</span> <span className="text-green-700 font-semibold">(−{Math.round((1 - it.outSize / it.file.size) * 100)}%)</span>{it.note ? <span className="text-neutral-500"> · {it.note}</span> : null}</p>
                    )}
                    {it.status === 'notSmaller' && it.sentTargetKb && it.file.size <= it.sentTargetKb * 1024 && <p className="text-amber-800" data-under-target>This image is already {formatSize(it.file.size)}, under the {it.sentTargetKb} KB asked: nothing to compress.</p>}
                    {it.status === 'notSmaller' && !(it.sentTargetKb && it.file.size <= it.sentTargetKb * 1024) && <p className="text-amber-800">Already well compressed: at {it.sentQuality ?? quality}% the result would be {formatSize(it.outSize)}, not smaller than {formatSize(it.file.size)}. Nothing to download — lower the quality to shrink it further.</p>}
                    {it.status === 'svgMinimal' && <p className="text-amber-800">This SVG is already optimized: nothing could be removed from it. Nothing to download — your file is already the best version.</p>}
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
        description={`Image Compressor makes JPG, PNG, WebP, AVIF and SVG files smaller without changing their format, and without changing their dimensions unless you choose to reduce an oversized image. JPGs are re-encoded with MozJPEG; a PNG keeps its transparency and gets the smallest color palette that still meets the quality you set; WebP and AVIF stay WebP and AVIF; an SVG stays vector, is minified with SVGO and is only offered if it draws the same as the original. Other images your browser can open, such as BMP, become JPG. If a result would not be smaller, you get no file, just a message. A background worker does the encoding.`}
        example={{ caption: 'Measured on 23 September 2026 at the default setting (78), against iLoveIMG on the same files (docs/audit/RAPPORT-ecarts-marche.md, §3b).', inputLabel: 'Original files', input: 'Photo, JPEG, 491 KB\nAlready compressed JPEG, 149 KB\nTransparent PNG, 987 KB', outputLabel: 'Our result (iLoveIMG)', output: '209,692 bytes (209,154)\n145,480 bytes (144,293)\n135,368 bytes (170,281)' }}
        howToTitle="How to compress images"
        howTo={[
          `Click the upload area and choose up to ${MAX_FILES} images.`,
          `Keep "By quality" and set the slider (${DEFAULT_QUALITY} is the recommended balance), or choose "To a size of" and type a size in KB.`,
          `Click "Compress image" (or "Compress" followed by the number of images) and watch each size before and after.`,
          `Click "Download" for each image, or "Download all" for compressed-images.zip.`
        ]}
        specs={[
          { label: 'Input formats', value: `JPG, PNG, WebP, AVIF, SVG; other browser-readable images become JPG` },
          { label: 'Images at once', value: `Up to ${MAX_FILES}` },
          { label: 'Largest image', value: `${MAX_MP} megapixels on a computer, ${PHONE_MAX_MP} on phones and tablets; a larger one can be reduced first in the same step` },
          { label: 'Refused', value: `Animated GIF, animated PNG and animated WebP, with a message pointing to GIF Compressor` }
        ]}
        privacy={`Compression runs in a background worker of your browser, with encoders (MozJPEG, OxiPNG, libwebp, libavif) downloaded from our site the first time they are needed. Your images are not uploaded. The messages shown next to each image are not reported; a page-level error (too many files, the engine stopping) or a crash sends a cleaned report with the tool's name and your browser's name and version.`}
        faqs={[
          { q: "Can I compress an image to a size like 100 KB?", a: `Yes. Choose "To a size of", type 100 in the KB box and compress. For JPG, WebP and AVIF the highest quality between 10 and 95 that fits is found automatically, without shrinking the picture; if even quality 10 is too big, the result says so and suggests Image Resizer. A PNG uses the slider instead.` },
          { q: "Does compression lower the image quality?", a: `Yes for JPG, WebP and AVIF, at every setting: they are always re-encoded with loss, slightly at high values. A PNG at quality 100 is repacked without any loss, and so is a PNG for which no palette reaches the chosen quality.` },
          { q: "Does an SVG stay a vector file?", a: `Yes. SVGO removes editor metadata, shortens numbers and ids and merges what it can. Both versions are then drawn and compared, with small anti-aliasing differences tolerated; if the drawing changed, a more cautious setting is tried, and if that changes it too, your original is kept.` },
          { q: "Is there a limit on image size?", a: `Yes. Up to ${MAX_MP} megapixels on a computer and ${PHONE_MAX_MP} on a phone or tablet, where a page that needs more memory gets reloaded. A larger image is named as soon as you choose it, and a button reduces it and compresses it in one step.` },
          { q: "Does it keep transparency and photo orientation?", a: `Yes. PNG, WebP, AVIF and SVG keep their transparency; images converted to JPG get a white background. Photos stay the right way up, while their EXIF details, such as GPS location and camera model, are removed.` }
        ]}
        tips={[
          `If an image is reported as already well compressed, lower the slider and compress it again.`,
          `On an iPhone, pick the photo through Files rather than the photo library to compress the original file; the page explains how.`
        ]}
      />
    </div>
  );
}

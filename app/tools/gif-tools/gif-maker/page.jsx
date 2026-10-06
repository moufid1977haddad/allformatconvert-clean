'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';
import { gifFrames } from '../../../lib/gifFrames';
import { IOS_CANVAS_MAX_PIXELS } from '../../../lib/canvasLimit';
import { useToolError } from '../../../lib/useToolError';

// Frames of different sizes used to be stretched to the first image's size (a portrait photo after a landscape one
// came out squashed). Now, as on ezgif (read 26/09/2026: crop to a common size, alignment, reordering), each frame
// is fitted inside the output with a background colour (default), cropped to fill it, or stretched on request; the
// output size and the order of frames can be chosen, and the loop count set.
const FITS = [['fit', 'Fit (keep proportions, add background)'], ['fill', 'Crop to fill (keep proportions)'], ['stretch', 'Stretch (old behavior)']];
const MAX_SIDE = 1920; // ezgif's limit too

// Where an image of w x h goes inside W x H.
function place(w, h, W, H, fit) {
  if (fit === 'stretch') return { dx: 0, dy: 0, dw: W, dh: H };
  const k = fit === 'fill' ? Math.max(W / w, H / h) : Math.min(W / w, H / h);
  const dw = w * k, dh = h * k;
  return { dx: (W - dw) / 2, dy: (H - dh) / 2, dw, dh };
}

export default function GifMakerPage() {
  const [images, setImages] = useState([]); // { name, src, w, h }
  const [delay, setDelay] = useState(200);
  const [fit, setFit] = useState('fit');
  const [bg, setBg] = useState('#FFFFFF');
  const [sizeMode, setSizeMode] = useState('largest'); // largest (ezgif's default: no frame shrunk) | first | custom
  const [custom, setCustom] = useState({ w: 480, h: 480 });
  const [loops, setLoops] = useState('0'); // 0 = forever
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [loading, setLoading] = useState(false);
  const [framesNote, setFramesNote] = useState('');
  const inputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    // P24 review (03/10): an animated GIF added here gave its first picture only, without a word. It is split into its
    // frames (as ezgif's maker does), each one placed in the list in order; at most 300 frames per GIF.
    const MAX_GIF_FRAMES = 300;
    const notes = [];
    const expand = async (f) => {
      if (!/gif$/i.test(f.type) && !/\.gif$/i.test(f.name)) return null;
      try {
        const { width, height, frames } = await gifFrames(await f.arrayBuffer());
        if (frames.length < 2) return null;
        if (frames.length > MAX_GIF_FRAMES) notes.push(`${f.name}: ${frames.length} frames, only the first ${MAX_GIF_FRAMES} were added`);
        else notes.push(`${f.name}: its ${frames.length} frames were added`);
        const c = document.createElement('canvas'); c.width = width; c.height = height; const ctx = c.getContext('2d');
        return frames.slice(0, MAX_GIF_FRAMES).map((fr, k) => { ctx.putImageData(fr.imageData, 0, 0); return { name: `${f.name} #${k + 1}`, src: c.toDataURL('image/png'), w: width, h: height, delay: String(fr.delay) }; }); // each frame keeps its own duration (P24 review)
      } catch { return null; }
    };
    const readers = files.map(f => expand(f).then((many) => many || new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => { const im = new Image(); im.onload = () => resolve({ name: f.name, src: reader.result, w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => resolve(null); im.src = reader.result; };
      reader.readAsDataURL(f);
    })));
    Promise.all(readers).then(lists => {
      const imgs = lists.flat();
      const ok = imgs.filter(Boolean);
      if (ok.length < imgs.length) setError(`${imgs.length - ok.length} file(s) could not be read as images and were left out.`); else setError('');
      setFramesNote(notes.join('; '));
      setImages(prev => [...prev, ...ok]); setResult(null);
    });
  };

  const removeImage = (i) => { setImages(prev => prev.filter((_, idx) => idx !== i)); setResult(null); };
  const move = (i, d) => { setImages(prev => { const n = prev.slice(); const j = i + d; if (j < 0 || j >= n.length) return prev; [n[i], n[j]] = [n[j], n[i]]; return n; }); setResult(null); };

  const outSize = () => {
    let W, H;
    if (sizeMode === 'custom') { W = Math.round(Number(custom.w)); H = Math.round(Number(custom.h)); }
    else if (sizeMode === 'largest') { W = Math.max(...images.map(i => i.w)); H = Math.max(...images.map(i => i.h)); }
    else { W = images[0]?.w; H = images[0]?.h; }
    const k = Math.min(1, MAX_SIDE / Math.max(W, H)); // never above 1920 px on a side
    return { W: Math.max(1, Math.round(W * k)), H: Math.max(1, Math.round(H * k)), capped: k < 1 };
  };

  const createGif = async () => {
    if (images.length < 2) return;
    const { W, H } = outSize();
    if (!(W > 0 && H > 0)) { setError('Set the output width and height.'); return; }
    setLoading(true); setResult(null); setError('');
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      const gif = GIFEncoder();
      const repeat = Math.max(0, Math.floor(Number(loops) || 0)); // GIF loop count: 0 = forever
      for (const [n, image] of images.entries()) {
        const im = new Image();
        await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = image.src; });
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        const p = place(im.naturalWidth, im.naturalHeight, W, H, fit);
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(im, p.dx, p.dy, p.dw, p.dh);
        const { data } = ctx.getImageData(0, 0, W, H);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        // P24 (03/10): a frame can keep its own duration (ezgif's maker: delay per frame); else the common delay
        const own = Number(image.delay);
        gif.writeFrame(index, W, H, { palette, delay: own >= 20 ? own : delay, ...(n === 0 ? { repeat } : {}) });
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      setResult({ url: URL.createObjectURL(blob), frameCount: images.length, W, H, bytes: blob.size });
    } catch (e) { setError('The GIF could not be made: ' + (e?.message || e)); }
    setLoading(false);
  };

  const input = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-sm';
  const size = images.length ? outSize() : null;
  const mixed = images.length > 1 && images.some(i => i.w * images[0].h !== i.h * images[0].w);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF Maker</h1>
        <p className="text-neutral-500 text-center mb-8">Create an animated GIF from images, without squashing them</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add images for GIF frames</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative" data-frame={i}>
                  <img src={img.src} alt={`Frame ${i + 1}`} className="w-full h-20 object-contain bg-neutral-100 rounded" />
                  <button onClick={() => removeImage(i)} aria-label={`Remove frame ${i + 1}`} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
                  {/* wraps: on a phone the arrows are 44 px touch targets and the size label goes under them */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-neutral-500">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move frame ${i + 1} earlier`} className="px-1 disabled:opacity-30">◀</button>
                    <span className="order-last basis-full text-center sm:order-none sm:basis-auto">{i + 1} · {img.w}×{img.h}</span>
                    <button onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Move frame ${i + 1} later`} className="px-1 disabled:opacity-30">▶</button>
                  </div>
                  <input type="number" min="20" max="10000" step="10" placeholder={`${delay} ms`} value={img.delay ?? ''} aria-label={`Duration of frame ${i + 1} (ms)`} title="This frame's duration in ms (empty: the common delay)"
                    onChange={(e) => { const v = e.target.value; setImages((prev) => prev.map((x, k) => (k === i ? { ...x, delay: v === '' ? undefined : v } : x))); setResult(null); }}
                    className="w-full mt-1 border border-neutral-200 rounded px-1 py-0.5 text-xs text-center" />
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Frames of another shape</span>
              <select id="gm-fit" value={fit} onChange={e => { setFit(e.target.value); setResult(null); }} className={input}>{FITS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            {fit === 'fit' && <label className="flex items-center justify-between gap-2 sm:mt-6">Background <input id="gm-bg" type="color" value={bg} onChange={e => { setBg(e.target.value); setResult(null); }} aria-label="Background colour" /></label>}
            <label className="block"><span className="block text-neutral-500 mb-1">Output size</span>
              <select id="gm-size" value={sizeMode} onChange={e => { setSizeMode(e.target.value); setResult(null); }} className={input}>
                <option value="largest">Largest width and height (no frame shrunk)</option><option value="first">Same as the first image</option><option value="custom">Custom…</option>
              </select></label>
            {sizeMode === 'custom' && <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="block text-neutral-500 mb-1">Width (px)</span><input id="gm-w" type="number" min="1" max={MAX_SIDE} value={custom.w} onChange={e => { setCustom(c => ({ ...c, w: e.target.value })); setResult(null); }} className={input} /></label>
              <label className="block"><span className="block text-neutral-500 mb-1">Height (px)</span><input id="gm-h" type="number" min="1" max={MAX_SIDE} value={custom.h} onChange={e => { setCustom(c => ({ ...c, h: e.target.value })); setResult(null); }} className={input} /></label>
            </div>}
            <label className="block"><span className="block text-neutral-500 mb-1">Repeat</span>
              <select id="gm-loops" value={loops} onChange={e => { setLoops(e.target.value); setResult(null); }} className={input}>
                <option value="0">Forever</option>{[1, 2, 3, 5, 10].map(n => <option key={n} value={String(n)}>{n} more time{n > 1 ? 's' : ''}</option>)}
              </select></label>
          </div>
          {size && <p className="text-xs text-neutral-500" data-size>GIF size: {size.W} × {size.H} px{size.capped ? ` (reduced to ${MAX_SIDE} px on the longest side)` : ''}.{mixed ? ' Your images have different shapes: see "Frames of another shape".' : ''}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Frame Delay: {delay}ms</label><input aria-label="Frame Delay (ms)" type="range" min="50" max="1000" value={delay} onChange={e => { setDelay(parseInt(e.target.value)); setResult(null); }} className="w-full" /></div>
          {images.length === 1 && <p className="text-neutral-500 text-center text-sm">Add at least one more image to make an animation.</p>}
          <button onClick={createGif} disabled={images.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{loading ? 'Creating...' : 'Create GIF'}</button>
          {framesNote && <p className="text-sm text-neutral-600 text-center" data-frames-note>{framesNote}</p>}
          {error && <p className="text-red-600 text-sm text-center" role="alert">{error}</p>}
          {result && (
            <div className="text-center space-y-3">
              <p className="text-green-700" data-result>GIF created ({result.frameCount} frames, {result.W} × {result.H} px, {formatBytes(result.bytes)})</p>
              <img src={result.url} alt="The animated GIF" className="max-w-full mx-auto rounded-xl border border-neutral-200" />
              <FileDownload href={result.url} name="animated.gif" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="GIF Maker"
        description="GIF Maker builds an animated GIF from two or more pictures: JPG, PNG, WebP, GIF or any image your browser opens. An animated GIF you add is split into its frames, up to 300 per GIF, each keeping its own duration (one under 20 ms uses 'Frame Delay' instead). You can change the order, give any frame its own duration, decide how pictures of another shape are placed (fit on a background color, crop to fill, or stretch), and choose the output size and how often the GIF repeats. It is encoded with gifenc on this page. The GIF has no transparency: transparent areas of your pictures take the background color."
        howToTitle="How to make a GIF from images"
        howTo={[
          "Click the box \"Click to add images for GIF frames\" and pick two or more pictures.",
          "Move a frame earlier or later with ◀ or ▶, remove one with its x, and type a duration in ms under any frame that needs its own.",
          "Choose \"Frames of another shape\", the \"Output size\" and \"Repeat\".",
          "Set \"Frame Delay\" for the frames without their own duration, then click \"Create GIF\".",
          "Click \"Download\" to save animated.gif."
        ]}
        specs={[
          { label: "Input", value: "JPG, PNG, WebP, GIF and other images your browser opens; animated GIFs are split into frames" },
          { label: "Output", value: "Animated GIF, saved as animated.gif" },
          { label: "Largest side", value: `${MAX_SIDE} px at most; a larger output is scaled down` },
          { label: "Frames", value: "Two images at least; up to 300 frames taken from each animated GIF" },
          { label: "Timing", value: "Common delay 50 to 1000 ms, or 20 to 10000 ms for a single frame" },
          { label: "On iPhone and iPad", value: `An animated GIF over ${(IOS_CANVAS_MAX_PIXELS / 1e6).toFixed(1)} megapixels cannot be split and is added as one still picture` }
        ]}
        privacy="Your pictures are read and the GIF is encoded with gifenc on this page; nothing you add is uploaded. A failure shown on the page reaches our error log as a cleaned message with the tool and browser names; your pictures and their names are not included."
        faqs={[
          { q: "Can each frame have its own duration?", a: "Yes. Type a number of milliseconds, from 20 to 10000, under a frame; leave it empty to use \"Frame Delay\". Frames taken from an animated GIF arrive with their original durations filled in; one under 20 ms is replaced by \"Frame Delay\"." },
          { q: "Can I mix portrait and landscape pictures?", a: "Yes. \"Fit (keep proportions, add background)\" places each one inside the GIF on the background color, \"Crop to fill (keep proportions)\" fills the frame and cuts the edges, and \"Stretch (old behavior)\" distorts the picture to fit." },
          { q: "Will transparent PNGs stay transparent?", a: "No. Every frame is painted on the background color first, white unless you change it, so transparent areas take that color. Image to GIF keeps 1-bit transparency if you need it." },
          { q: "Can I choose the size of the GIF?", a: `Yes. \"Largest width and height (no frame shrunk)\" is the default, \"Same as the first image\" uses the size of the first picture, and \"Custom…\" lets you type both sides. A side above ${MAX_SIDE} px is scaled down.` },
          { q: "Can I add an animated GIF?", a: "Yes. Its frames are added in order, up to 300 per GIF, each with its own duration (under 20 ms, \"Frame Delay\" applies), and a note under the button says how many were added." }
        ]}
        tips={[
          "\"Same as the first image\" makes a smaller GIF only when the first picture is smaller than the others."
        ]}
      />
    </div>
  );
}

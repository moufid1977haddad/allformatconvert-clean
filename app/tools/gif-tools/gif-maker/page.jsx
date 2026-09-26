'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

// Frames of different sizes used to be stretched to the first image's size (a portrait photo after a landscape one
// came out squashed). Now, as on ezgif (read 26/09/2026: crop to a common size, alignment, reordering), each frame
// is fitted inside the output with a background colour (default), cropped to fill it, or stretched on request; the
// output size and the order of frames can be chosen, and the loop count set.
const FITS = [['fit', 'Fit (keep proportions, add background)'], ['fill', 'Crop to fill (keep proportions)'], ['stretch', 'Stretch (old behaviour)']];
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    const readers = files.map(f => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => { const im = new Image(); im.onload = () => resolve({ name: f.name, src: reader.result, w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => resolve(null); im.src = reader.result; };
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs => {
      const ok = imgs.filter(Boolean);
      if (ok.length < imgs.length) setError(`${imgs.length - ok.length} file(s) could not be read as images and were left out.`); else setError('');
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
        gif.writeFrame(index, W, H, { palette, delay, ...(n === 0 ? { repeat } : {}) });
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      setResult({ url: URL.createObjectURL(blob), frameCount: images.length, W, H, kb: blob.size / 1024 });
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
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move frame ${i + 1} earlier`} className="px-1 disabled:opacity-30">◀</button>
                    <span>{i + 1} · {img.w}×{img.h}</span>
                    <button onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label={`Move frame ${i + 1} later`} className="px-1 disabled:opacity-30">▶</button>
                  </div>
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
          <div><label className="block text-sm text-neutral-500 mb-1">Frame Delay: {delay}ms</label><input type="range" min="50" max="1000" value={delay} onChange={e => { setDelay(parseInt(e.target.value)); setResult(null); }} className="w-full" /></div>
          <button onClick={createGif} disabled={images.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Create GIF'}</button>
          {error && <p className="text-red-600 text-sm text-center" role="alert">{error}</p>}
          {result && (
            <div className="text-center space-y-3">
              <p className="text-green-700" data-result>GIF created ({result.frameCount} frames, {result.W} × {result.H} px, {result.kb.toFixed(0)} KB)</p>
              <img src={result.url} alt="The animated GIF" className="max-w-full mx-auto rounded-xl border border-neutral-200" />
              <a href={result.url} download="animated.gif" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download GIF</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="GIF Maker"
        description="GIF Maker turns a sequence of photos or graphics into a real, downloadable animated GIF, entirely in your browser with the gifenc library — nothing is uploaded anywhere. Images of different sizes keep their proportions: each frame is fitted inside the GIF with a background colour, or cropped to fill it (stretching is still available). Choose the output size, the order of the frames, the delay and how many times it repeats."
        howTo={[
          "Click the upload area and add two or more images to use as frames.",
          "Reorder frames with the ◀ ▶ arrows, or remove one with its \"x\" button.",
          "Choose how frames of another shape are handled (fit with a background, crop to fill, or stretch), the output size and how many times the GIF repeats.",
          "Set your frame delay, click \"Create GIF\", then preview and download the animated GIF."
        ]}
        faqs={[
          { q: "Can I download a finished GIF file directly?", a: "Yes — click \"Create GIF\" and a \"Download GIF\" button appears with the finished, real animated GIF file." },
          { q: "What if my images are not all the same size?", a: "By default each image is fitted inside the GIF without changing its proportions, and the space around it is filled with the background colour you choose. You can instead crop each image to fill the frame, or stretch it (which distorts it)." },
          { q: "What image formats can I use as frames?", a: "Any image format your browser supports, such as JPG, PNG, WebP, or GIF." },
          { q: "Will photos look as good as flat graphics or icons?", a: "Simple, flat-color images tend to look best. The underlying encoder doesn't apply dithering, so photos or gradients with fine color detail may show some visible color banding after being reduced to a 256-color palette." },
          { q: "Is GIF Maker free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is my data private?", a: "Yes. Everything happens locally in your browser — your images are never uploaded to a server." }
        ]}
        tips={[
          "The default size, \"Largest width and height\", never shrinks a frame; \"Same as the first image\" gives a smaller GIF.",
          "\"Crop to fill\" avoids borders but cuts the edges of images whose shape differs from the GIF's.",
          "Flat-color graphics, icons, and logos encode cleanly — photos and smooth gradients can show visible banding since the encoder doesn't dither.",
          "Short delays (50–150ms) read as fluid motion; longer delays (300ms+) suit slideshow-style GIFs where each frame should linger."
        ]}
      />
    </div>
  );
}

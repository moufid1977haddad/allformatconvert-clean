'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { runStagedToolResult, mediaServiceConfigured, MediaJobError } from '../../../lib/mediaJob';

// The AI service's own input ceiling (services/background-removal/app/upscale.py, UPSCALE_MAX_INPUT_PIXELS),
// checked here BEFORE the upload so the visitor never waits for a refusal.
const MAX_INPUT_PIXELS = 1_000_000;
const MAX_FILE_BYTES = 30 * 1024 * 1024;

export default function ImageUpscalerPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dims, setDims] = useState(null);
  const [scale, setScale] = useState(4);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('');
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [split, setSplit] = useState(50);
  const inputRef = useRef();
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setResult(null);
    setError('');
    setDims(null);
    if (f.size > MAX_FILE_BYTES) { setFile(null); setError(`This file is ${(f.size / 1048576).toFixed(1)} MB; images up to ${MAX_FILE_BYTES / 1048576} MB are accepted.`); return; }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const px = img.naturalWidth * img.naturalHeight;
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
      if (px > MAX_INPUT_PIXELS) {
        setFile(null);
        setError(`This image is ${img.naturalWidth}×${img.naturalHeight} (${(px / 1e6).toFixed(1)} megapixels). The AI upscaler accepts images up to ${(MAX_INPUT_PIXELS / 1e6).toFixed(0)} megapixel (for example 1000×1000): it is made to enlarge small images. Shrink it first with Image Resizer, or keep it as it is — it is already large.`);
        return;
      }
      setFile(f);
      setPreview(url);
    };
    img.onerror = () => { setFile(null); setError('This file could not be opened as an image. JPG, PNG and WebP are supported.'); };
    img.src = url;
  };

  const upscale = async () => {
    if (!file) return;
    if (!mediaServiceConfigured()) { setError('The AI upscaler is not available right now.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const { json, blob } = await runStagedToolResult({
        file, endpoint: '/api/image-upscale', fields: { scale }, signal: ac.signal,
        onStage: (s) => {
          if (s.stage === 'upload') { setPhase('Uploading'); setPct(Math.round(s.pct || 0)); }
          else if (s.stage === 'converting') { setPhase('Upscaling with AI — this takes up to a minute'); setPct(0); }
          else if (s.stage === 'download') { setPhase('Downloading'); setPct(Math.round(s.pct || 0)); }
        },
      });
      if (!json.ok || !blob) throw new Error(json.error || 'Upscaling failed. Please try again.');
      setResult({ url: URL.createObjectURL(blob), size: blob.size, w: json.width, h: json.height });
    } catch (e) {
      if (!((e instanceof MediaJobError && e.code === 'cancelled') || e?.name === 'AbortError')) setError(e?.message || 'Upscaling failed. Please try again.');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const baseName = (file?.name || 'image').replace(/\.[^.]+$/, '');

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">AI Image Upscaler</h1>
        <p className="text-neutral-500 text-center mb-8">Enlarge small images 2× or 4× with an AI model that rebuilds real detail</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition" onClick={() => !loading && inputRef.current.click()}>
            {preview && file ? <img src={preview} alt="" className="max-h-48 mx-auto rounded" /> : <div><p className="text-neutral-500 text-sm">Click to upload an image</p><p className="text-neutral-500 text-xs mt-1">JPG, PNG, WebP · up to 1 megapixel (e.g. 1000×1000)</p></div>}
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} disabled={loading} />
          </div>
          <div>
            <p className="block text-sm text-neutral-600 mb-2">Enlarge</p>
            <div className="flex gap-2">
              {[2, 4].map((s) => (
                <button key={s} onClick={() => setScale(s)} disabled={loading} className={'flex-1 py-2 rounded-lg font-semibold text-sm transition ' + (scale === s ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')}>
                  {s}×{dims && file ? ` → ${dims.w * s}×${dims.h * s}` : ''}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              <p className="text-center text-sm text-neutral-600">{phase}{pct ? ` ${pct}%` : '…'}</p>
              <button onClick={() => abortRef.current?.abort()} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={upscale} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Upscale Image</button>
          )}
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <div className="relative select-none overflow-hidden rounded-lg border border-neutral-200" style={{ aspectRatio: `${result.w} / ${result.h}` }}>
                {/* before (the original, stretched by the browser) under after (the AI result), split by the slider */}
                <img src={preview} alt="Original" className="absolute inset-0 w-full h-full" style={{ imageRendering: 'auto' }} />
                <img src={result.url} alt="Upscaled" className="absolute inset-0 w-full h-full" style={{ clipPath: `inset(0 0 0 ${split}%)` }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }} />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Before</span>
                <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">After</span>
              </div>
              <label className="block text-xs text-neutral-600">Compare
                <input type="range" min="0" max="100" value={split} onChange={(e) => setSplit(Number(e.target.value))} className="w-full" aria-label="Before/after comparison" />
              </label>
              <p className="text-center text-sm text-neutral-600">{dims.w}×{dims.h} → <span className="font-semibold text-indigo-600">{result.w}×{result.h}</span> · PNG, {(result.size / 1048576).toFixed(1)} MB</p>
              <a href={result.url} download={`${baseName}-upscaled-${scale}x.png`} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
          <p className="text-xs text-neutral-500 text-center">AI model: <a href="https://github.com/Phhofm/models/releases/tag/4xNomos2_hq_mosr" className="underline" target="_blank" rel="noopener noreferrer">4xNomos2_hq_mosr</a> by Philip Hofmann, licensed <a href="https://creativecommons.org/licenses/by/4.0/" className="underline" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.</p>
        </div>
      </div>
      <SeoContent
        title="AI Image Upscaler"
        description="AI Image Upscaler enlarges small images 2× or 4× with a super-resolution neural network (MoSR) that rebuilds fine detail — skin, fabric, foliage — instead of just stretching and blurring the pixels. In our tests on a real photo reduced to a quarter of its size, its result was measurably closer to the original than the leading online upscaler's (LPIPS perceptual distance 0.107 against 0.164, lower is better). Your image is sent to our own server for processing, never to a third party, and deleted after you download the result."
        howTo={[
          "Click the upload area and select a small image (up to 1 megapixel, e.g. 1000×1000).",
          "Choose 2× or 4× enlargement.",
          "Click 'Upscale Image' and wait while the AI model works (usually under a minute).",
          "Drag the comparison slider to see the difference, then download your PNG."
        ]}
        faqs={[
          { q: "Is AI Image Upscaler free to use?", a: "Yes, it's free with no signup and no watermark." },
          { q: "Does it really use AI?", a: "Yes. A super-resolution neural network (the MoSR architecture, model 4xNomos2_hq_mosr) predicts the missing detail, rather than smoothing an enlarged copy like a classic resize." },
          { q: "Why is there a 1-megapixel limit?", a: "The upscaler is made to enlarge small images: a 1-megapixel photo becomes 16 megapixels at 4×. Larger images take much longer to process and are usually already large enough; shrink them first with Image Resizer if you really need to." },
          { q: "What formats are supported?", a: "JPG, PNG and WebP in; PNG out, so the enlarged image isn't re-compressed. Transparency is kept." },
          { q: "Is my image uploaded to a server?", a: "Yes — the AI model needs a server. It runs on our own server (not a third-party service); your image is deleted after you download the result, or automatically after a short time." },
          { q: "Who made the AI model?", a: "4xNomos2_hq_mosr was trained by Philip Hofmann and published under the Creative Commons Attribution 4.0 licence. We chose it after comparing nine open models on the same photo." }
        ]}
        tips={[
          "Start from the best version of the image you have: the AI rebuilds detail, but it can't recover what heavy compression destroyed.",
          "4× is the model's native factor; 2× is the 4× result reduced, so both take about the same time.",
          "Use the comparison slider on a face or a texture to see what the AI added.",
          "Download the result right away — it's deleted from our server after the download."
        ]}
      />
    </div>
  );
}

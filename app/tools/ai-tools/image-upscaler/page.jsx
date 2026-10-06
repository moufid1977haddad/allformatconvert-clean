'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { runStagedToolResult, mediaServiceConfigured, MediaJobError } from '../../../lib/mediaJob';
import { webgpuAvailable, readImage, localOutputProblem, upscaleInBrowser, serverSecondsFor, serverNeedsParts, upscaleOnServerInParts } from '../../../lib/localUpscale';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// Input ceiling, the free offers' level (iLoveIMG 6 Mpx, Upscale.media 6.25 Mpx without an account; 28/09),
// checked here BEFORE any work. The same on our server (UPSCALE_MAX_INPUT_PIXELS) and on this device.
// Where the model runs (28/09): on this device through WebGPU when the browser has it (free, the image
// never leaves the device), else on our server, bounded by its own monthly spend cap.
const MAX_INPUT_PIXELS = 6_000_000;
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
  const [error, setError] = useToolError('');
  const [split, setSplit] = useState(50);
  const [where, setWhere] = useState(''); // 'device' | 'server'
  const [offerServer, setOfferServer] = useState(0); // server seconds, offered when this device looks much slower
  const serverNowRef = useRef(false);
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
        setError(`This image is ${img.naturalWidth}×${img.naturalHeight} (${(px / 1e6).toFixed(1)} megapixels). The AI upscaler accepts images up to ${(MAX_INPUT_PIXELS / 1e6).toFixed(0)} megapixels (for example 3000×2000). Shrink it first with Image Resizer, or keep it as it is — it is already large.`);
        return;
      }
      setFile(f);
      setPreview(url);
    };
    img.onerror = () => { setFile(null); setError('This file could not be opened as an image. JPG, PNG and WebP are supported.'); };
    img.src = url;
  };

  const runOnServer = async (ac) => {
    if (!mediaServiceConfigured()) throw new Error('The AI upscaler is not available right now.');
    setWhere('server');
    const est = dims ? serverSecondsFor(dims.w, dims.h) : 60;
    const t0 = Date.now();
    const one = async (f, part = '') => {
      const { json, blob } = await runStagedToolResult({
        file: f, endpoint: '/api/image-upscale', fields: { scale }, signal: ac.signal,
        onStage: (st) => {
          const left = Math.max(10, est - Math.round((Date.now() - t0) / 1000));
          if (st.stage === 'upload') { setPhase(`Uploading to our server${part}`); setPct(Math.round(st.pct || 0)); }
          else if (st.stage === 'converting') { setPhase(`Upscaling on our server${part} — about ` + (left < 90 ? left + ' seconds' : Math.round(left / 60) + ' minutes') + ' left'); setPct(0); }
          else if (st.stage === 'download') { setPhase(`Downloading${part}`); setPct(Math.round(st.pct || 0)); }
        },
      });
      if (!json.ok || !blob) throw new Error(json.error || 'Upscaling failed. Please try again.');
      return { json, blob };
    };
    // A large image goes in bands, each well within the server's time (see localUpscale.js).
    if (dims && serverNeedsParts(dims.w, dims.h, scale)) {
      const r = await upscaleOnServerInParts(file, scale, async (f, i, n) => (await one(f, ` (part ${i + 1} of ${n})`)).blob, { signal: ac.signal });
      return { blob: r.blob, w: r.width, h: r.height, preview: r.preview };
    }
    const { json, blob } = await one(file);
    return { blob, w: json.width, h: json.height };
  };

  const upscale = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    setOfferServer(0);
    serverNowRef.current = false;
    let ac = new AbortController();
    abortRef.current = ac;
    try {
      let out = null;
      const img = (await webgpuAvailable()) ? await readImage(file) : null;
      // On this device when it can: WebGPU, no transparency to carry (the server path keeps it), a canvas this browser can hold.
      if (img && !img.hasAlpha && !localOutputProblem(img.width, img.height, scale)) {
        setWhere('device');
        const serverEst = serverSecondsFor(img.width, img.height);
        try {
          const r = await upscaleInBrowser(img, scale, {
            signal: ac.signal,
            onPhase: (p) => { setPhase(p); setPct(0); },
            onProgress: ({ done, total, etaSeconds }) => {
              setPct(Math.round((done / total) * 100));
              setPhase('Upscaling on this device — about ' + (etaSeconds < 90 ? etaSeconds + ' s' : Math.round(etaSeconds / 60) + ' min') + ' left');
              // A slow graphics chip: offer our server when it would clearly be faster.
              if (done >= 2 && etaSeconds > serverEst * 2 && etaSeconds > 60) setOfferServer(serverEst);
            },
          });
          out = { blob: r.blob, w: r.width, h: r.height, preview: r.preview };
        } catch (e) {
          if (e?.name === 'AbortError' && !serverNowRef.current) throw e;
          // The visitor chose the server, or the GPU failed: our server takes over.
          out = null;
          ac = new AbortController();
          abortRef.current = ac;
        }
      }
      if (!out) out = await runOnServer(ac);
      // A result too big for this device to show (iPhone, streamed PNG) is shown through its small preview.
      setResult({ url: URL.createObjectURL(out.blob), previewUrl: out.preview ? URL.createObjectURL(out.preview) : null, size: out.blob.size, w: out.w, h: out.h });
    } catch (e) {
      if (!((e instanceof MediaJobError && e.code === 'cancelled') || e?.name === 'AbortError')) setError(e?.message || 'Upscaling failed. Please try again.');
    } finally {
      setLoading(false);
      setOfferServer(0);
      abortRef.current = null;
    }
  };

  const useServerNow = () => { serverNowRef.current = true; setOfferServer(0); abortRef.current?.abort(); };

  const baseName = (file?.name || 'image').replace(/\.[^.]+$/, '');

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">AI Image Upscaler</h1>
        <p className="text-neutral-500 text-center mb-8">Enlarge small images 2× or 4× with a super-resolution AI model</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition" onClick={() => !loading && inputRef.current.click()}>
            {preview && file ? <img src={preview} alt="" className="max-h-48 mx-auto rounded" /> : <div><p className="text-neutral-500 text-sm"><UploadPrompt what="an image" /></p><p className="text-neutral-500 text-xs mt-1">JPG, PNG, WebP · up to 6 megapixels (e.g. 3000×2000)</p></div>}
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
              <p className="text-center text-sm text-neutral-600" data-where={where}>{phase}{pct ? ` ${pct}%` : '…'}</p>
              {where === 'device' && <p className="text-center text-xs text-neutral-500">Running on your device: your image is not uploaded.</p>}
              {offerServer > 0 && <button onClick={useServerNow} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl py-2 text-sm font-semibold transition" data-offer-server>This device is slow — use our server instead (about {offerServer < 90 ? offerServer + ' s' : Math.round(offerServer / 60) + ' min'})</button>}
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
                <img src={result.previewUrl || result.url} alt="Upscaled" className="absolute inset-0 w-full h-full" style={{ clipPath: `inset(0 0 0 ${split}%)` }} />
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }} />
                <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Before</span>
                <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">After</span>
              </div>
              <label className="block text-xs text-neutral-600">Compare
                <input type="range" min="0" max="100" value={split} onChange={(e) => setSplit(Number(e.target.value))} className="w-full" aria-label="Before/after comparison" />
              </label>
              <p className="text-center text-sm text-neutral-600">{dims.w}×{dims.h} → <span className="font-semibold text-indigo-600">{result.w}×{result.h}</span> · PNG, {formatBytes(result.size)}</p>
              <p className="text-center text-xs text-neutral-500" data-where={where}>{where === 'device' ? 'The AI ran right here, in your browser: your photo was not uploaded anywhere.' : 'The AI ran on our server: your photo was sent to it for this.'}</p>
              <FileDownload href={result.url} name={`${baseName}-upscaled-${scale}x.png`} />
            </div>
          )}
          <p className="text-xs text-neutral-500 text-center">AI model: <a href="https://github.com/Phhofm/models/releases/tag/4xNomos2_hq_mosr" className="underline" target="_blank" rel="noopener noreferrer">4xNomos2_hq_mosr</a> by Philip Hofmann, licensed <a href="https://creativecommons.org/licenses/by/4.0/" className="underline" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.</p>
        </div>
      </div>
      <SeoContent
        title="AI Image Upscaler"
        description={`AI Image Upscaler enlarges a JPG, PNG or WebP image 2× or 4× with 4xNomos2_hq_mosr, a super-resolution neural network that predicts fine detail instead of only stretching pixels. Images up to ${MAX_INPUT_PIXELS / 1e6} megapixels and ${MAX_FILE_BYTES / 1048576} MB are accepted. If your browser offers WebGPU, the image has no transparency and the result fits in the browser, the model runs on your device; otherwise the image goes to our own server. Either way you get a PNG and a before/after slider to compare. The page always says where the work was done.`}
        howToTitle="How to upscale an image with AI"
        howTo={[
          "Click the upload area and choose a JPG, PNG or WebP image.",
          "Under \"Enlarge\", pick 2× or 4×; each button shows the size of the result.",
          "Click \"Upscale Image\"; the page says whether it runs on your device or on our server and how long is left, and \"Cancel\" stops it.",
          "Drag the \"Compare\" slider to see before and after, then click \"Download\" to save the PNG."
        ]}
        specs={[
          { label: "Input formats", value: "JPG, PNG, WebP" },
          { label: "Maximum input", value: `${MAX_INPUT_PIXELS / 1e6} megapixels and ${MAX_FILE_BYTES / 1048576} MB` },
          { label: "Output", value: "PNG, transparency kept, named after your image with -upscaled-2x or -upscaled-4x" },
          { label: "Where it runs", value: "On your device with WebGPU; on our server otherwise, for images with transparency, or when you choose it" },
          { label: "Usage limits", value: "None when it runs on your device; on our server, a number of jobs per connection per hour and per day, and the upscaler's own monthly budget" }
        ]}
        privacyTitle="Where your image is processed"
        privacy="When your browser has WebGPU, the AI model is downloaded once and the image is enlarged in your browser; it is not uploaded. Otherwise the image is uploaded to our media service on Railway and enlarged by our own AI service, never a third party; large images are sent in parts. The image and the result are deleted from the service after your download completes, or when the job expires."
        faqs={[
          { q: "Is my image uploaded?", a: "No, not when it runs on your device: with WebGPU, no transparency and a result your browser can hold, the image stays in the browser and the page says so. Otherwise yes: it goes to our own server, never a third party, and the page says that too." },
          { q: "How large can the image be?", a: `${MAX_INPUT_PIXELS / 1e6} megapixels, for example 3000×2000, and ${MAX_FILE_BYTES / 1048576} MB. At 4× such an image becomes ${(MAX_INPUT_PIXELS * 16) / 1e6} megapixels. Larger photos are refused before any work starts; shrink them first with Image Resizer.` },
          { q: "Does 2× take less time than 4×?", a: "No. The model always enlarges 4×, and the 2× result is the 4× result reduced by half, so both take about the same time. Choose 2× when you do not need the larger file." },
          { q: "Is transparency kept?", a: "Yes. An image with transparent areas is always processed on our server, which enlarges the colors with the AI model and resizes the transparency layer with a standard filter, then joins both in the PNG." },
          { q: "Is the AI model openly licensed?", a: "Yes. Philip Hofmann trained 4xNomos2_hq_mosr and published it under the Creative Commons Attribution 4.0 licence; the page credits it under the tool. We chose it after comparing nine open models on the same photo." }
        ]}
        tips={[
          "The first run on your device downloads the AI model; later runs during the same visit start sooner.",
          "On a slow graphics chip, accept the page's offer to switch to our server when it appears."
        ]}
      />
    </div>
  );
}

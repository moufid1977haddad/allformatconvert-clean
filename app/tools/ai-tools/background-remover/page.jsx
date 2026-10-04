'use client';
import { useEffect, useRef, useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { checkedDataURL, checkedBlob } from '../../../lib/mediaSupport';
import { createPngWriter, forEachBand, imageDims } from '../../../lib/bigImage';
import { derivedName } from '../../../lib/download';
import { checkFileSize, MAX_REMOVEBG_ORIGINAL_BYTES } from '@/lib/quota/limits';
import { FileDownload } from '../../../components/FileDownload';
import { WORK_PIXELS, composeBand } from '../../../lib/mattingRefine';
import { reportToolError } from '../../../lib/reportError';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// Matches the model's own fixed internal input resolution (see
// services/background-removal/app/infer.py, MODEL_INPUT_SIZE) -- IS-Net
// downsamples every image to this size before inference regardless of what
// it's given, so sending anything larger over the network is pure waste.
// The visitor's original file is never sent anywhere; only this small,
// browser-resized copy is uploaded to generate the mask.
const RESIZE_TARGET_PX = 1024;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// Downscales to fit within RESIZE_TARGET_PX x RESIZE_TARGET_PX (never
// upscales), preserving aspect ratio, and returns a small JPEG data URL --
// this copy is only ever used to generate the mask, never shown to the
// visitor, so JPEG's lossy compression has no effect on the final result.
function resizeForUpload(img) {
  const scale = Math.min(1, RESIZE_TARGET_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return checkedDataURL(canvas, 'image/jpeg', 0.92);
}

// Applies the (small) returned mask, scaled up, as the alpha channel of the ORIGINAL photo -- never the resized
// upload copy -- so the visitor always gets their photo back at its real, full resolution.
// 30/09 (owner's iPhone, 12 MP photo): "Download PNG" made Safari kill the tab ("A problem repeatedly occurred").
// The old code held the photo as a data: URL, two full-size canvases, two full copies of their pixels and the
// PNG as a ~40 MB data: string at once (~350 MB for 12 MP). Now, as remove.bg and Pixian keep full resolution
// without holding everything: the photo is read band by band (4 MP at a time, decoded natively), the mask
// applied to the band, and the band's rows written straight into ONE PNG Blob (app/lib/bigImage.js); the page
// shows a small preview. No canvas ever exceeds 4 MP, no copy of the full image is kept besides the PNG itself.
const BAND_PIXELS = 4_000_000;
const PREVIEW_PIXELS = 1_500_000;
// P21 (02/10): the edges are refined before that (app/lib/mattingRefine.js, in a Worker, on a copy of at most 1 MP):
// on the owner's iPhone a mug on blue-violet plastic kept a blue line along its edge and a light halo in its handle.
// The refined alpha (curve 0.1–0.9: soft detail such as fine hair is kept), the "mixing" alpha and the local subject / background colours are drawn stretched on each band,
// and composeBand gives every edge pixel the subject's colour instead of the photo's mix (what remove.bg calls "edge
// color corrections"). Measured on 28 real cut-outs laid on known backgrounds (docs/audit/RAPPORT-p21-nuit-jour-02-10.md):
// background colour left in the edge 11.0 % → 4.8 %. P31 (03/10): colours from the nearest sure subject/background
// pixels + multi-level foreground estimation (see mattingRefine.js): 4.9 % → 3.9 %, same alpha error, same speed.
async function refineEdges(img, maskImg) {
  const k = Math.min(1, Math.sqrt(WORK_PIXELS / (img.naturalWidth * img.naturalHeight)));
  const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
  const draw = (src) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data; c.width = 1; return d;
  };
  const rgba = draw(img), m4 = draw(maskImg);
  const mask = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) mask[i] = m4[i * 4];
  const worker = new Worker(new URL('./refine.worker.js', import.meta.url), { type: 'module' });
  const res = await new Promise((resolve, reject) => {
    // Never a spinner forever: past 30 s the cut-out is given without the refinement (caller's fallback).
    setTimeout(() => reject(new Error('edge refinement took longer than 30 s')), 30000);
    worker.onmessage = ({ data }) => (data.ok ? resolve(data) : reject(new Error(data.message)));
    worker.onerror = (e) => reject(new Error(e.message || 'refinement failed'));
    worker.postMessage({ rgba, mask, w, h }, [rgba.buffer, mask.buffer]);
  }).finally(() => worker.terminate());
  const toCanvas = (data) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0); return c; };
  return { alpha: toCanvas(res.layers), fg: toCanvas(res.fg), bg: toCanvas(res.bg) };
}

// layers: { alpha, fg, bg } (canvases at working size, from refineEdges), or { alpha: maskImg } unrefined.
async function recompositeAtFullResolution(file, dims, layers) {
  const { width: W, height: H } = dims;
  const png = createPngWriter(W, H, true);
  const k = Math.min(1, Math.sqrt(PREVIEW_PIXELS / (W * H)));
  const preview = document.createElement('canvas');
  preview.width = Math.max(1, Math.round(W * k)); preview.height = Math.max(1, Math.round(H * k));
  const pctx = preview.getContext('2d');
  pctx.imageSmoothingEnabled = true; pctx.imageSmoothingQuality = 'high';
  const bandRows = Math.max(1, Math.floor(BAND_PIXELS / W));
  const stretch = (src) => {
    if (!src) return null;
    const c = document.createElement('canvas'); c.width = W; c.height = Math.min(H, bandRows);
    const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    return { c, x, src };
  };
  const refined = !!layers.fg;
  const parts = [stretch(layers.alpha), stretch(layers.fg), stretch(layers.bg)];
  const bandCanvas = document.createElement('canvas');
  bandCanvas.width = W; bandCanvas.height = Math.min(H, bandRows);
  const bctx = bandCanvas.getContext('2d');
  await forEachBand(file, dims, BAND_PIXELS, async (rgba, y, rows) => {
    // Each layer: the same scaled drawing as on one big canvas, shifted to this band.
    const [A, F, B] = parts.map((p) => {
      if (!p) return null;
      p.x.clearRect(0, 0, W, p.c.height);
      p.x.drawImage(p.src, 0, -y, W, H);
      return p.x.getImageData(0, 0, W, rows).data;
    });
    if (refined) composeBand(rgba, A, F, B);
    else for (let i = 3; i < rgba.length; i += 4) rgba[i] = A[i - 3]; // the mask's R channel becomes the alpha
    bctx.clearRect(0, 0, W, bandCanvas.height);
    bctx.putImageData(new ImageData(rgba, W, rows), 0, 0);
    pctx.drawImage(bandCanvas, 0, 0, W, rows, 0, y * k, W * k, rows * k);
    await png.writeRows(rgba, rows);
  });
  for (const p of parts) if (p) p.c.width = 1;
  bandCanvas.width = 1;
  const blob = await png.finish();
  const previewBlob = await checkedBlob(preview, 'image/png');
  preview.width = 1;
  return { blob, url: URL.createObjectURL(blob), previewUrl: URL.createObjectURL(previewBlob), name: derivedName(file.name, 'no-background', 'png') };
}

export default function BackgroundRemoverPage() {
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useToolError('');
  const fileRef = useRef();
  const progressTimerRef = useRef(null);

  useEffect(() => () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current); }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setResult(null);
    const sizeCheck = checkFileSize(file, MAX_REMOVEBG_ORIGINAL_BYTES, 'Images');
    if (!sizeCheck.ok) { setPreview(''); setFile(null); setError(sizeCheck.message); return; }
    // An object URL, not a data: URL: the photo is not copied into a string (tens of MB on a phone).
    setPreview(URL.createObjectURL(file)); setFile(file); setError('');
  };

  // There is no real progress feed for a single server round trip, so this
  // climbs toward 90% and slows down the longer it runs -- reads naturally
  // whether the request finishes in a couple of seconds (the common case)
  // or takes longer because the service had gone to sleep from inactivity
  // and needed a moment to wake up.
  const startProgress = () => {
    setProgress(4);
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.08));
    }, 300);
  };

  const stopProgress = (finalValue) => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = null;
    setProgress(finalValue);
  };

  const process = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      startProgress();
      const originalImg = await loadImage(preview);
      const dims = await imageDims(file);
      if (!dims) throw new Error('Could not open this image. The file may be damaged or in a format your browser cannot read.');
      const resizedDataUrl = resizeForUpload(originalImg);
      const resizedBase64 = resizedDataUrl.split(',')[1];

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: resizedBase64, tool: 'background-remover' }),
      });

      // A non-2xx response isn't guaranteed to be JSON -- e.g. a platform-level
      // error page -- so response.json() is never allowed to throw straight
      // into the visitor's face.
      let data = null;
      try { data = await response.json(); } catch { data = null; }

      if (!response.ok || !data || !data.mask) {
        setError((data && data.error) || 'Error removing background. Please try again.');
        stopProgress(0);
        setLoading(false);
        return;
      }

      const maskImg = await loadImage('data:image/png;base64,' + data.mask);
      let layers;
      try { layers = await refineEdges(originalImg, maskImg); }
      catch (err) {
        // The cut-out is still right without the refinement (the mask as it came, as before 02/10): give it, and
        // report the failure so it is seen and fixed.
        reportToolError({ tool: 'background-remover', file, error: err });
        layers = { alpha: maskImg };
      }
      setResult(await recompositeAtFullResolution(file, dims, layers));
      stopProgress(100);
    } catch(e) { setError('Error: ' + e.message); stopProgress(0); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Background Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove any background instantly with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {preview ? <img src={preview} className="max-h-48 mx-auto rounded-lg" alt="original" /> : <div><p className="text-neutral-500 text-sm"><UploadPrompt what="an image" /></p><p className="text-neutral-500 text-xs mt-1">JPG, PNG, WEBP supported</p></div>}
          </div>
          <p className="text-neutral-500 text-xs text-center -mt-2">Max {(MAX_REMOVEBG_ORIGINAL_BYTES / (1024 * 1024)).toFixed(0)} MB per file — matches the largest limit offered by remove.bg, Pixian, and PhotoRoom; your photo is resized in the browser before upload and returned at its full original resolution.</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={process} disabled={!preview || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Removing background…' : 'Remove Background'}
          </button>
          {loading && (
            <div className="space-y-1.5">
              <ProgressBar pct={Math.round(progress)} label="Removing background" />
              <p className="text-xs text-neutral-400 text-center">This can take a bit longer than usual if the tool hasn't been used in a while.</p>
            </div>
          )}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3">
              <label className="block text-sm text-neutral-500">Result</label>
              <div className="rounded-xl overflow-hidden" style={{backgroundImage: 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'}}>
                <img src={result.previewUrl} className="max-h-64 mx-auto" alt="result" />
              </div>
              <FileDownload href={result.url} name={result.name} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Background Remover"
        description="Background Remover is a free online tool that instantly removes the background from an image using an AI segmentation model that runs on our own infrastructure, giving you a transparent PNG in one click. Perfect for product photos, portraits, and professional graphics, with no software installation required."
        howTo={[
          "Click the upload area and select a photo from your device.",
          "Click 'Remove Background' and wait a few seconds while the background is automatically detected and removed.",
          "Preview the result against the checkered transparency background.",
          "Click 'Download' next to the PNG file to save your transparent image."
        ]}
        faqs={[
          { q: "Is Background Remover completely free to use?", a: "Yes, Background Remover is free to use with no account creation or watermarks on your downloaded image." },
          { q: "What image formats does Background Remover support?", a: "The tool accepts common image formats like JPG and PNG, and always outputs the result as a transparent PNG file." },
          { q: "How long does it take to remove a background?", a: "Most images are processed in a few seconds. It can take noticeably longer for the first request in a while, since the background-removal service needs a moment to wake up after sitting idle." },
          { q: "Do I need to install any software or create an account?", a: "No, Background Remover works entirely online with no downloads, installations, or account requirements." },
          { q: "How large can an uploaded photo be?", a: `Up to ${(MAX_REMOVEBG_ORIGINAL_BYTES / (1024 * 1024)).toFixed(0)} MB — matching the highest limit offered by remove.bg, Pixian, and PhotoRoom. Your photo is resized in the browser before upload for fast, private processing, and the result is delivered at your original photo's full resolution, not a reduced one.` }
        ]}
        tips={[
          "For best results, use images with clear contrast between the subject and background.",
          "Simple, uniform backgrounds are removed more cleanly than busy or low-contrast ones.",
          "If the automatic result isn't clean around fine details like hair, try a higher-resolution source image.",
          "Download your result right after processing, since the image isn't saved on our server."
        ]}
      />
    </div>
  );
}
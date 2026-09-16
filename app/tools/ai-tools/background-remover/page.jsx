'use client';
import { useEffect, useRef, useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { checkFileSize, MAX_REMOVEBG_ORIGINAL_BYTES } from '@/lib/quota/limits';

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
  return canvas.toDataURL('image/jpeg', 0.92);
}

// Scales the (small) returned mask up to the ORIGINAL image's full
// resolution and applies it as the alpha channel of the ORIGINAL image --
// never the resized upload copy -- so the visitor always gets their photo
// back at its real, full resolution. The mask is a grayscale ('L' mode)
// PNG: R, G and B channels all hold the same intensity value, so the R
// channel alone is used as the alpha value for each pixel.
function recompositeAtFullResolution(originalImg, maskImg) {
  const width = originalImg.naturalWidth;
  const height = originalImg.naturalHeight;

  const originalCanvas = document.createElement('canvas');
  originalCanvas.width = width;
  originalCanvas.height = height;
  const originalCtx = originalCanvas.getContext('2d');
  originalCtx.drawImage(originalImg, 0, 0, width, height);
  const originalData = originalCtx.getImageData(0, 0, width, height);

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  maskCtx.imageSmoothingEnabled = true;
  maskCtx.imageSmoothingQuality = 'high';
  maskCtx.drawImage(maskImg, 0, 0, width, height);
  const maskData = maskCtx.getImageData(0, 0, width, height);

  const pixels = originalData.data;
  const maskPixels = maskData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i + 3] = maskPixels[i];
  }
  originalCtx.putImageData(originalData, 0, 0);
  return originalCanvas.toDataURL('image/png');
}

export default function BackgroundRemoverPage() {
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const progressTimerRef = useRef(null);

  useEffect(() => () => { if (progressTimerRef.current) clearInterval(progressTimerRef.current); }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setResult('');
    const sizeCheck = checkFileSize(file, MAX_REMOVEBG_ORIGINAL_BYTES, 'Images');
    if (!sizeCheck.ok) { setPreview(''); setError(sizeCheck.message); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); setError(''); };
    reader.onerror = () => { setPreview(''); setError('Failed to read the image file. It may be corrupt or in an unsupported format.'); };
    reader.readAsDataURL(file);
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
    setResult('');
    setError('');
    try {
      startProgress();
      const originalImg = await loadImage(preview);
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
      setResult(recompositeAtFullResolution(originalImg, maskImg));
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
            {preview ? <img src={preview} className="max-h-48 mx-auto rounded-lg" alt="original" /> : <div><p className="text-neutral-400 text-sm">Click to upload an image</p><p className="text-neutral-300 text-xs mt-1">JPG, PNG, WEBP supported</p></div>}
          </div>
          <p className="text-neutral-400 text-xs text-center -mt-2">Max {(MAX_REMOVEBG_ORIGINAL_BYTES / (1024 * 1024)).toFixed(0)} MB per file — matches the largest limit offered by remove.bg, Pixian, and PhotoRoom; your photo is resized in the browser before upload and returned at its full original resolution.</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={process} disabled={!preview || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
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
                <img src={result} className="max-h-64 mx-auto" alt="result" />
              </div>
              <a href={result} download="no-background.png" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download PNG</a>
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
          "Click 'Download PNG' to save your transparent image to your computer."
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
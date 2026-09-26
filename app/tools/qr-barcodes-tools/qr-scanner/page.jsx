'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';

// Scans a QR code from an image (file, drop, paste) or, added 26/09/2026, live from the camera -- what the
// reference scanners offer first (their page opens on the camera). The box used to say "drop" without handling it.
const SCAN_EVERY_MS = 100; // ~10 reads a second
const SCAN_MAX_SIDE = 800; // frames downscaled for jsQR: a phone camera's 1920 px frame is slow and no easier to read

export default function QrScannerPage() {
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [camera, setCamera] = useState(false); // live camera on
  const [cameras, setCameras] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const videoRef = useRef();
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const jsqrRef = useRef(null);

  const found = (text) => { setResult(text); setStatus(''); };
  const stopCamera = () => {
    clearTimeout(timerRef.current); timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamera(false);
  };
  useEffect(() => () => stopCamera(), []);

  const decode = async (source, w, h) => {
    jsqrRef.current ??= (await import('jsqr')).default;
    const k = Math.min(1, SCAN_MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsqrRef.current(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' });
  };

  const scanFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus(`"${file.name}" is not an image.`); return; }
    stopCamera(); setLoading(true); setStatus('Scanning...'); setResult('');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = url; });
      // Full resolution first (small or distant codes), then downscaled.
      jsqrRef.current ??= (await import('jsqr')).default;
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const code = jsqrRef.current(d.data, d.width, d.height) || await decode(img, img.naturalWidth, img.naturalHeight);
      if (code) found(code.data); else setStatus('No QR code found in image');
    } catch { setStatus('Could not load image file'); }
    URL.revokeObjectURL(url); setLoading(false);
  };

  const startCamera = async (id = deviceId) => {
    setResult(''); setStatus('');
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('This browser cannot use a camera here (a camera needs a secure https page). Upload a photo of the code instead.'); return; }
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: id ? { deviceId: { exact: id } } : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream; setCamera(true);
      const v = videoRef.current; v.srcObject = stream; await v.play();
      const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
      setCameras(list); setDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId || id || '');
      setStatus('Point the camera at a QR code…');
      const tick = async () => {
        if (!streamRef.current) return;
        if (v.videoWidth) {
          const code = await decode(v, v.videoWidth, v.videoHeight);
          if (code && code.data !== '') { found(code.data); stopCamera(); return; }
        }
        timerRef.current = setTimeout(tick, SCAN_EVERY_MS);
      };
      tick();
    } catch (e) {
      stopCamera();
      const n = e?.name;
      setStatus(n === 'NotAllowedError' ? 'Camera access was refused. Allow the camera for this site in your browser settings, or upload a photo of the code.'
        : n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'NotSupportedError' ? 'No camera was found. Upload a photo of the code instead.'
          : n === 'NotReadableError' ? 'The camera is in use by another app. Close it and try again, or upload a photo of the code.'
            : `The camera could not be started (${e?.message || n || 'unknown error'}). Upload a photo of the code instead.`);
    }
  };

  useEffect(() => { // paste an image (screenshot) anywhere on the page
    const onPaste = (e) => {
      const cd = e.clipboardData; if (!cd) return;
      const f = [...(cd.files || [])].find((x) => x.type.startsWith('image/'))
        || [...(cd.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'))?.getAsFile();
      if (f) { e.preventDefault(); scanFile(f); }
    };
    window.addEventListener('paste', onPaste); return () => window.removeEventListener('paste', onPaste);
  }, []);

  const isLink = /^https?:\/\/\S+$/i.test(result);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">QR Code Scanner</h1>
        <p className="text-neutral-500 text-center mb-8">Scan QR codes with your camera or from an image</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {camera
              ? <button type="button" onClick={stopCamera} className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold">Stop camera</button>
              : <button type="button" onClick={() => startCamera()} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold">Scan with camera</button>}
            <button type="button" onClick={() => inputRef.current.click()} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl py-3 font-semibold">Upload an image</button>
          </div>
          <div className={camera ? 'space-y-2' : 'hidden'}>
            <video ref={videoRef} playsInline muted className="w-full rounded-xl bg-black" aria-label="Camera view" />
            {cameras.length > 1 && <label className="flex items-center gap-2 text-sm text-neutral-600">Camera
              <select id="qs-camera" value={deviceId} onChange={(e) => { setDeviceId(e.target.value); startCamera(e.target.value); }} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                {cameras.map((c, i) => <option key={c.deviceId || i} value={c.deviceId}>{c.label || `Camera ${i + 1}`}</option>)}
              </select></label>}
          </div>
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-500'}`}
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); scanFile(e.dataTransfer.files?.[0]); }}
            data-dropzone
          >
            <p className="text-neutral-500">Click, drop or paste (Ctrl+V) a QR code image here</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; scanFile(f); }} />
          </div>
          {status && <p className="text-center text-amber-700 text-sm" role="status">{loading ? 'Scanning...' : status}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 space-y-3" data-result>
              <div className="text-green-700 text-xl font-bold text-center">QR Code Found!</div>
              <p className="text-center break-all" data-text>{result}</p>
              <div className={`grid gap-2 ${isLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy</button>
                {isLink && <a href={result} target="_blank" rel="noopener noreferrer nofollow" className="block text-center bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-2 font-semibold">Open link</a>}
              </div>
              {isLink && <p className="text-xs text-neutral-500 text-center">Check the address before opening it: QR codes can hide malicious links.</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="QR Code Scanner"
        description="QR Code Scanner is a free online tool that decodes QR codes live from your camera or from any image, directly in your browser — no software installation, no registration, and no image or video ever leaves your device. Scan with your phone's or laptop's camera, or upload, drop or paste a photo or screenshot, and instantly retrieve the URL, text, or other data it contains."
        howTo={[
          "Click \"Scan with camera\" and allow the camera, then point it at the QR code — it stops by itself when the code is read. Or upload, drop or paste an image containing a QR code.",
          "Wait a moment while the tool decodes the code locally in your browser.",
          "View the decoded text or URL displayed on screen.",
          "Click \"Copy\" to copy the result, or \"Open link\" for a web address."
        ]}
        faqs={[
          { q: "Is QR Code Scanner free to use?", a: "Yes, it's completely free and requires no registration to decode unlimited QR codes." },
          { q: "Can I scan with my phone's camera?", a: "Yes. Click \"Scan with camera\" and allow the camera; the rear camera is used when there is one, and you can switch cameras. Nothing is recorded or uploaded: each frame is read in your browser." },
          { q: "Do I need to install any software?", a: "No, QR Code Scanner is a web-based tool that works directly in your browser without any downloads or installations." },
          { q: "What kinds of QR codes can it read?", a: "Any standard QR code containing text or a URL — live from a camera, photos of printed codes, screenshots, and exported images, including light codes on a dark background." },
          { q: "Is my data private?", a: "Yes. The image or camera view is decoded entirely in your browser and is never uploaded to a server." }
        ]}
        tips={[
          "For the camera, hold the code flat and fill about half the view; good light helps more than getting very close.",
          "If scanning fails on a full photo, try cropping the image tightly around just the QR code.",
          "Always verify a decoded URL before opening it — QR codes can be used to hide malicious links.",
          "Screenshots work just as well as photos: copy one and press Ctrl+V on this page."
        ]}
      />
    </div>
  );
}
